import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { AppStoreModule } from 'src/app/store';
import { Store, select, MemoizedSelector } from '@ngrx/store';
import { getSongList, getPlayList, getCurrentIndex, getPlayMode, getCurrentSong, getCurrentAction } from 'src/app/store/selectors/player.selector';
import { playerReducer, PlayState, CurrentActions } from 'src/app/store/reducers/player.reducer';
import { Song, Singer } from 'src/app/service/data-types/common.types';
import { PlayMode } from './player-types';
import { SetCurrentIndex, SetPlayMode, SetPlayList, SetSongList, SetCurrentAction } from 'src/app/store/actions/player.actions';
import { Subscription, fromEvent, timer } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { shuffle, findIndex } from 'src/app/utils/array';
import { WyPlayerPanelComponent } from './wy-player-panel/wy-player-panel.component';
import { NzModalService } from 'ng-zorro-antd';
import { BatchActionsService } from 'src/app/store/batch-actions.service';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate,AnimationEvent } from '@angular/animations';
import { MemberService } from 'src/app/service/member.service';
import { SetShareInfo } from 'src/app/store/actions/member.actions';

// const modeTypes: PlayMode = [{
//   type: 'loop',
//   label: '循环'
// }, {
//   type: 'random',
//   label: '随机'
// }, {
//   type: 'singleLoop',
//   label: '单曲循环'
// }]
const modeTypes: PlayMode[] = [{
  type: 'loop',
  label: '循环'
}, {
  type: 'random',
  label: '随机'
}, {
  type: 'singleLoop',
  label: '单曲循环'
}];

enum TipTitles {
  Add = '已添加到列表',
  Play = '已开始播放'
}

@Component({
  selector: 'app-wy-player',
  templateUrl: './wy-player.component.html',
  styleUrls: ['./wy-player.component.less'],
  animations:[trigger('showHide',[
    state('show', style({ bottom: 0 })),
    state('hide', style({ bottom: -71 })),
    transition('show=>hide',[animate('0.3s')]),
    transition('hide=>show',[animate('0.1s')])
  ])]
})
export class WyPlayerComponent implements OnInit {
  showPlayer = 'hide';
  isLocked = false;

  controlTooltip = {
    title: '',
    show: false
  }
  
  //是否正在动画
  animating = false;


  percent = 0;
  bufferPercent = 0;
  songList:Song[];
  playList: Song[];
  currentIndex: number;
  currentSong: Song;

  duration: number;
  currentTime: number;

  //播放状态
  playing = false;

  //是否可以播放
  songReady = false;
  //音量
  volume = 10;

  //是否显示音量面板
  showVolumnPanel = false;

  //是否显示列表面板
  showPanel = false;

  //是否绑定document click事件
  bindFlag = false;

  //绑定windows的Click事件用的
  private winClick: Subscription;

  //当前模式
  currentMode: PlayMode;
  modeCount = 0;



  @ViewChild('audio', { static: true}) private audio: ElementRef;
  @ViewChild(WyPlayerPanelComponent, { static: false}) private playerPanel: WyPlayerPanelComponent;



  private audioEl: HTMLAudioElement;

  constructor(
    private store$: Store<{player: AppStoreModule}>,
    @Inject(DOCUMENT) private doc: Document,
    private nzModalServe: NzModalService,
    private batchActionsServer: BatchActionsService,
    private router: Router,
  ) { 
    const appstore$ = this.store$.pipe(select('player'));

    const stateArr = [{
      type: getSongList,
      cb: list => this.watchList(list, 'songList')
    },{
      type: getPlayList,
      cb: list => this.watchList(list, 'playList')
    },{
      type: getCurrentIndex,
      cb: index => this.watchCurrentIndex(index)
    },{
      type: getPlayMode,
      cb: mode => this.watchPlayMode(mode)
    },{
      type: getCurrentSong,
      cb: song => this.watchCurrentSong(song)
    },{
      type: getCurrentAction,
      cb: action => this.watchCurrentAction(action)
    }
    
  ];
  
  stateArr.forEach(item => {
      appstore$.pipe(select(<any>item.type)).subscribe(item.cb);
    })
  }

  ngOnInit() {
    this.audioEl = this.audio.nativeElement;
    this.audioEl.volume = 10 / 100;
    //console.log('audioEl :', this.audio.nativeElement);
  }


  

  private watchList(list: Song[], type: string){
    this[type] = list;
  }
  private watchCurrentIndex(index: number){
    this.currentIndex = index;
  }
  private watchPlayMode(mode: PlayMode){
    console.log('mode :', mode);
    this.currentMode = mode;
    if (this.songList) {
      let list = this.songList.slice();
      if(mode.type === 'random') {
        list = shuffle(this.songList);
      }
      this.updateCurrentIndex(list, this.currentSong);
      this.store$.dispatch(SetPlayList({ playList: list }));
    }
  }

  private watchCurrentSong(song: Song){
    this.currentSong= song;
    if (song) {    
      this.duration = song.dt / 1000;
    }
  }
  private  watchCurrentAction(action: CurrentActions) {
    const title = TipTitles[CurrentActions[action]];
    if (title) {
      this.controlTooltip.title = title;
      if (this.showPlayer === 'hide') {
        this.togglePlayer('show');
      } else {
        this.showToolTip();
      }
    }
    this.store$.dispatch(SetCurrentAction({ currentAction: CurrentActions.Other}));

  }
  
  OnAnimateDone(event: AnimationEvent) {
    this.animating = false;
    if (event.toState === 'show' && this.controlTooltip.title) {
      this.showToolTip();
    }
  }

  private showToolTip() {
    this.controlTooltip.show = true;
    timer(1500).subscribe(() => {
      this.controlTooltip = {
        title: '',
        show: false
      }
    });
  }



  // 收藏歌曲
  onLikeSong(id: string) { 
    this.batchActionsServer.likeSong(id);
  }

  // 分享
  onShareSong(resource: Song, type = 'song') {
    const txt = this.makeTxt('歌曲', resource.name, resource.ar);;
    this.store$.dispatch(SetShareInfo({
       info: { id: resource.id.toString(), type, txt }
      }));
  }
  private makeTxt (type: string, name: string, makeBy: Singer[]):string {
    const makeByStr = makeBy.map(item => item.name).join('/');
    return `${type}: ${name} -- ${makeByStr}`;
  }

  
  private updateCurrentIndex(list: Song[], song:Song) {
    const newIndex = findIndex(list, song);
    this.store$.dispatch(SetCurrentIndex({ currentIndex: newIndex }));
  }

  //改变模式
  changeMode () {
    this.store$.dispatch(SetPlayMode({ playMode: modeTypes[++this.modeCount % 3] }))
  }
  onClickOutSide(target: HTMLElement) {
    if (target.dataset.act !== 'delete') {
      this.showVolumnPanel = false;
      this.showPanel = false;
      this.bindFlag = false; 
    }
  }


  onPercentChange(per: number){
    if (this.currentSong) {
      const currentTime = this.duration * (per / 100)
      this.audioEl.currentTime = currentTime;
      if (this.playerPanel) {
        this.playerPanel.seekLyric(currentTime * 1000);
      }
    }
  }
  //控制音量
  onVolumeChange(per: number) {

    this.audioEl.volume = per / 100;
    
  }

   //控制音量面板
  toggleVolPanel () {
    this.togglePanel('showVolumnPanel');
  }

   //控制列表面板
   toggleListPanel () {
     if (this.songList.length) {
      this.togglePanel('showPanel');
     }
  }

 
  togglePanel (type: string) {
    this[type] = !this[type];
    this.bindFlag = (this.showVolumnPanel || this.showPanel);
  }
 

  //播放/暂停
  onToggle() {
    if (!this.currentSong) {
      if(this.playList.length) {
        this.store$.dispatch(SetCurrentIndex({ currentIndex: 0 }));
        this.songReady = false;
      }
    }else {
      if(this.songReady){
        this.playing = !this.playing;
        if (this.playing) {
          this.audioEl.play();//播放
        }else {
          this.audioEl.pause();//暂停
        }
      }
    }
  }
  //上一曲
  onPrev(index: number) {
    console.log('index :', index);
     if (!this.songList) return;
     if (this.playList.length === 1){
      this.loop();
     }else {
      const newIndex = index < 0 ? this.playList.length - 1 : index;
      this.updateIndex(newIndex);
     }
  }
  //下一曲
   onNext(index: number) {
     console.log('index :', index);
     if (!this.songList) return;
     if (this.playList.length === 1){
      this.loop();
     }else {
      const newIndex = index >= this.playList.length ? 0 : index;
      this.updateIndex(newIndex);
     }
  }

  //播放结束
  onEnded () {
    this.playing = false;
    if (this.currentMode.type === 'singleLoop') {
      this.loop();
    }else {
      this.onNext(this.currentIndex + 1);
    }
  }
  // 播放错误
  onError() {
    this.playing = false;
    this.bufferPercent = 0;
  }


  //单曲循环
  private loop() {
    this.audioEl.currentTime = 0;
    this.play();
    if (this.playerPanel) {
      this.playerPanel.seekLyric(0);
    }
  }


  private updateIndex(index: number) {
    this.store$.dispatch(SetCurrentIndex({ currentIndex: index }));
    this.songReady = false;   
  }

  onCanplay(){
    this.songReady = true;
    this.play();


  }
  onTimeUpdate(e: Event) {
    this.currentTime = (<HTMLAudioElement>e.target).currentTime;
    this.percent = (this.currentTime / this.duration) * 100;
    const buffered = this.audioEl.buffered;//获取缓冲对象
    //buffered.end(0);//缓冲区域结束时间
    if (buffered.length && this.bufferPercent < 100) {
      this.bufferPercent = (buffered.end(0) / this.duration) * 100;
    }
  }

  private play(){
    this.audioEl.play();
    this.playing = true;
  }

  get picUrl(): string {
    return this.currentSong ? this.currentSong.al.picUrl : 'http://s4.music.126.net/style/web2/img/default/default_album.jpg';
  }

  //改变歌曲
  onChangeSong(song:Song) {
    this.updateCurrentIndex(this.playList, song);
  }

  //删除歌曲
  onDeleteSong(song: Song) {
    this.batchActionsServer.DeleteSong(song);
  }
  //清空歌曲
  onClearSong() {
    this.nzModalServe.confirm({
      nzTitle: '确认清空列表？',
      nzOnOk: () => {
        this.batchActionsServer.ClearSong();
      }
    })
  }

  // 跳转
  toInfo (path: [string, number]) {
    if (path[1]) {
      this.showVolumnPanel = false;
      this.showPanel = false;
      this.router.navigate(path);
    }
  }

  togglePlayer(type: string) {
    if (!this.isLocked && !this.animating) {
      this.showPlayer = type;
    }
  }

}

