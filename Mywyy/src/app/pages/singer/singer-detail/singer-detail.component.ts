import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/internal/operators';
import { SingerDetail, Song, Singer } from 'src/app/service/data-types/common.types';
import { Store, select } from '@ngrx/store';
import { AppStoreModule } from 'src/app/store';
import { SongService } from 'src/app/service/song.service';
import { BatchActionsService } from 'src/app/store/batch-actions.service';
import { NzMessageService } from 'ng-zorro-antd';
import { getCurrentSong } from 'src/app/store/selectors/player.selector';
import { findIndex } from 'src/app/utils/array';
import { Subject } from 'rxjs';
import { SetShareInfo } from 'src/app/store/actions/member.actions';
import { MemberService } from 'src/app/service/member.service';

@Component({
  selector: 'app-singer-detail',
  templateUrl: './singer-detail.component.html',
  styleUrls: ['./singer-detail.component.less']
})
export class SingerDetailComponent implements OnInit, OnDestroy {
  singerDetail: SingerDetail;
  simiSingers: Singer[];
  currentIndex = -1;
  currentSong: Song;
  hasLiked = false;

  private destory$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private store$: Store<{player: AppStoreModule}>,
    private songServe: SongService,
    private batchActionServe: BatchActionsService,
    private nzMessageServe: NzMessageService,
    private memberServe: MemberService
    ) {
    this.route.data.pipe(map(res => res.singerDetail)).subscribe(([detail, simiSingers]) => {
      this.singerDetail = detail;
      this.simiSingers = simiSingers;
      console.log('this.simiSingers :', this.simiSingers);
      this.listenCurrent();
    });
   }

  ngOnInit() {
  }

  private listenCurrent() {
    this.store$
    .pipe(select('player'), select(getCurrentSong), takeUntil(this.destory$))
    .subscribe(song => {
      this.currentSong = song;
      if (song) {
        this.currentIndex = findIndex(this.singerDetail.hotSongs, song);
      }else {
        this.currentIndex = -1;
      }
    });

  }

    //添加一首歌曲
    onAddSong(song: Song, isPlay = false) {
      if (!this.currentSong || this.currentSong.id !==  song.id) {
        this.songServe.getSongList(song).subscribe(list => {
          if (list.length) {
            this.batchActionServe.insertSong(list[0], isPlay)
          }else {
            this.nzMessageServe.create('waring','无url！');
          }
        });
      }
    }

  onAddSongs(songs: Song[], isPlay = false) {
    this.songServe.getSongList(songs).subscribe(list => {
      if (list.length) {
        //this.batchActionServe.insertSongs(list);
        if (isPlay) {
          this,this.batchActionServe.selectPlayList({list, index: 0});
        }else {
          this,this.batchActionServe.insertSongs(list);
        }
      }
    })
  }
  
  // 收藏歌手
  onLikeSinger(id: string) {
    let typeInfo = {
      type: 1,
      msg: '收藏'
    }
    if (this.hasLiked) {
      typeInfo = {
        type: 2,
        msg: '取消收藏'
      }
    }
    this.memberServe.likeSinger(id, typeInfo.type).subscribe(() =>{
      this.hasLiked = !this.hasLiked;
      this.nzMessageServe.create('success', typeInfo.msg + '成功')

    },error => {
      this.nzMessageServe.create('error', error.msg || typeInfo.msg + '失败')
    });
  }

  // 批量收藏
  onLikeSongs(songs: Song[]) {
    const ids = songs.map(item => item.id).join(',');
    this.onLikeSong(ids);
  }
  
  // 收藏歌曲
  onLikeSong(id: string) { 
    this.batchActionServe.likeSong(id);
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



  ngOnDestroy(): void {
    this.destory$.next();
    this.destory$.complete();
   }

}
