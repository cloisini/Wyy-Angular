import { Component, Inject } from '@angular/core';
import { SearchService } from './service/search-service';
import { SearchResult, SongSheet } from './service/data-types/common.types';
import { isEmpty, filter, map, mergeMap, takeUntil } from 'rxjs/internal/operators';
import { isEmptyObject } from './utils/tools';
import { ModalTypes, ShareInfo } from './store/reducers/member.reducer';
import { AppStoreModule } from './store';
import { Store, select } from '@ngrx/store';
import { SetModalType, SetUserId, SetModalVisible } from './store/actions/member.actions';
import { BatchActionsService } from './store/batch-actions.service';
import { LoginParams } from './share/wy-ui/wy-layer/wy-layer-login/wy-layer-login.component';
import { MemberService, LikeSongParams, ShareParams } from './service/member.service';
import { User } from './service/data-types/member.types';
import { NzFormModule, NzMessageService, PREFIX } from 'ng-zorro-antd';
import { codeJson } from './utils/base64';
import { StorageService } from './service/storage.service';
import { getLikeId, getModalVisible, getModalType, getShareInfo } from './store/selectors/member.selector';
import { Router, ActivatedRoute, NavigationEnd, NavigationStart } from '@angular/router';
import { Observable, interval } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'mywyy';
  menu = [{
    label: '发现',
    path: '/home'
  }, {
    label: '歌单',
    path: '/sheet'
  }];

  loadPercent = 0;

  searchResult: SearchResult;
  wyRememberLogin: LoginParams;
  user: User;
  mySheets: SongSheet[];

  // 被收藏歌曲的id
  likeId: string;

  // 弹窗的显示
  visible = false;

  // 弹窗类型
  currentModalType = ModalTypes.Default;

  // 分享信息
  shareInfo: ShareInfo;

  // 弹窗loading
  showSpin = false;

  routeTitle = '';

  private navEnd: Observable<NavigationEnd>;

  constructor(
    private searchServer: SearchService,
    private store$: Store<{member: AppStoreModule}>,
    private batchActionServe: BatchActionsService,
    private memberServe: MemberService,
    private messageServe: NzMessageService,
    private storageServe: StorageService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private titleServe: Title,
    @Inject(DOCUMENT) private doc: Document

  ) {
    const userId = this.storageServe.getStorage('wyUserId');
    if (userId) {
      this.store$.dispatch(SetUserId({ id:  userId}));
      this.memberServe.getUserDetail(userId).subscribe(user => { this.user = user; });
    }
    const wyRemeberLogin = this.storageServe.getStorage('wyRemeberLogin');
    if (wyRemeberLogin) {
      this.wyRememberLogin = JSON.parse(wyRemeberLogin);
    }

    this.listenStates();

    this.router.events.pipe(filter(evt => evt instanceof NavigationStart)).subscribe(() => {
      this.loadPercent = 0;
      this.setTitle();
    });

    this.navEnd = this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)) as Observable<NavigationEnd>;
    this.setLoadingBar();
  }
  private  setLoadingBar() {
    interval(100).pipe(takeUntil(this.navEnd)).subscribe(() => {
      this.loadPercent = Math.max(95, ++ this.loadPercent);
    });
    this.navEnd.subscribe(() => {
      this.loadPercent = 100;
      // this.doc.documentElement.scrollTop = 0;
    });
  }


  private setTitle() {
    this.navEnd.pipe(
      map(() => this.activeRoute),
      map((route: ActivatedRoute) => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data)
      ).subscribe(data => {
        console.log('data :', data);
        this.routeTitle = data.title;
        this.titleServe.setTitle(this.routeTitle);
      });
  }

  private listenStates() {
    const appstore$ = this.store$.pipe(select('member'));
    const stateArr = [{
      type: getLikeId,
      cb: id => this.WatchlikeId(id)
    }, {
      type: getModalVisible,
      cb: visib => this.watchModalVisible(visib)
    }, {
      type: getModalType,
      cb: type => this.watchModalType(type)
    }, {
      type: getShareInfo,
      cb: info => this.watchShareInfo(info)
    }];

    stateArr.forEach(item => {
      appstore$.pipe(select(item.type as any)).subscribe(item.cb);
    });
  }

  private watchModalVisible(visib: boolean) {
    if (this.visible !==  visib) {
      this.visible = visib;
    }
  }
  private watchModalType(type: ModalTypes) {
    if (this.currentModalType !== type) {
      if (type ===  ModalTypes.Like) {
        this.onLoadMySheets();
      }
      this.currentModalType = type;
    }
  }


  private WatchlikeId(id: string) {
    if (id) {
      this.likeId = id;
    }
  }

  private watchShareInfo(info: ShareInfo) {
    if (info) {
      if (this.user) {
        this.shareInfo = info;
        this.openModal(ModalTypes.Share);
      } else {
        this.openModal(ModalTypes.Default);
      }
    }
  }

  openModalByMenu(type: 'loginByPhone' | 'register' ) {
    if (type === 'loginByPhone') {
      this.openModal(ModalTypes.LoginByPhone);
    } else {
      this.openModal(ModalTypes.Register);

    }
  }


  // 打开弹窗
  openModal(type: ModalTypes) {
    this.batchActionServe.controlModal(true, type);
  }

  closeModal() {
    this.batchActionServe.controlModal(false);
  }

  // 改变弹窗类型
  onChangeModalType(modalType = ModalTypes.Default) {
    this.store$.dispatch(SetModalType({ modalType }));
  }


  // 获取当前用户的歌单
  onLoadMySheets() {
    if (this.user) {
      this.memberServe.getUserSheets(this.user.profile.userId.toString()).subscribe(userSheet => {
        this.mySheets = userSheet.self;
        this.store$.dispatch(SetModalVisible({ modalVisible: true}));
      });
    } else {
      this.openModal(ModalTypes.Default);
    }
  }

  onSearch(keyWords: string) {
    if (keyWords) {
      this.searchServer.search(keyWords).subscribe(res => {
        this.searchResult = this.highlightKeyWord(keyWords, res);
        console.log('this.searchResult :', this.searchResult);
      });
    } else {
       this.searchResult = {};
    }
  }
  private highlightKeyWord(keywords: string, result: SearchResult): SearchResult {
    if (!isEmptyObject(result)) {
      const reg = new RegExp(keywords, 'ig');
      ['artists', 'playlists', 'songs'].forEach(type => {
        if (result[type]) {
          result[type].forEach(item => {
            item.name = item.name.replace(reg, '<span class="highlight">$&</span?');
          });
        }
      });
    }
    return result;
  }
  // 登录
  onLogin(params: LoginParams) {
    this.showSpin = true;
    this.memberServe.login(params).subscribe(user => {
      this.user = user;
      this.closeModal();
      this.alertMessage('success', '登陆成功！');
      this.storageServe.setStorage({
        key: 'wyUserId',
        value: user.profile.userId
       });
      this.store$.dispatch(SetUserId({ id:  user.profile.userId.toString()}));
      if (params.remember) {
        this.storageServe.setStorage({
          key: 'wyRememberLogin',
          value: JSON.stringify(codeJson(params))
         });
      } else {
        this.storageServe.removeStorage('wyRemeberLogin');
      }
      this.showSpin = false;
    }, error => {
      this.showSpin = false;
      this.alertMessage( 'error', error.message || '登陆失败' );
    });
  }

  onLogout() {
    this.memberServe.logout().subscribe(() => {
      this.user = null;
      this.storageServe.removeStorage('wyUserId');
      this.store$.dispatch(SetUserId({ id: ''}));
      this.alertMessage('success', '已退出');

    }, error =>  {
      this.alertMessage('error', error.message || '退出失败');
    });
  }

  // 收藏歌曲
  onLikeSong(args: LikeSongParams) {
    this.memberServe.likeSong(args).subscribe(() => {
      this.closeModal();
      this.alertMessage('success', '收藏成功');
    }, error =>  {
      this.alertMessage('error', error.msg || '收藏失败');
    });
  }

  onCreateSheet(sheetName: string) {
    this.memberServe.createSheet(sheetName).subscribe(pid => {
      this.onLikeSong({pid , tracks: this.likeId });
    }, error => {
      this.alertMessage('error', error.msg || '新建失败');
    });
  }

  // 分享
  onShare(arg: ShareParams) {
    this.memberServe.shareResource(arg).subscribe(() => {
      this.alertMessage('success', '分享成功');
      this.closeModal();
    }, error => {
      this.alertMessage('error', error.msg || '分享失败');
    });
  }

  // 注册

  onRegister(phone: string) {
    this.alertMessage('success', phone + '注册成功');
  }

  private alertMessage(type: string, msg: string) {
      this.messageServe.create(type, msg);
  }
}
