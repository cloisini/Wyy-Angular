import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { HomeService } from 'src/app/service/home.service';
import { SingerService } from 'src/app/service/singer.service';
import { Banner, HotTag, SongSheet, Singer } from 'src/app/service/data-types/common.types';
import { Observable, forkJoin } from 'rxjs';
import { first } from 'rxjs/internal/operators';


type HomeDataType=[Banner[],HotTag[],SongSheet[],Singer[]];

@Injectable({
  providedIn: 'root',
})
export class HomeResolverService implements Resolve<HomeDataType> {
  constructor(
    private homeServe:HomeService,
    private singerServer:SingerService,
  ) {}
  resolve():Observable<HomeDataType> {
  /*   const userId = this.storageServe.getStorage('wyUserId');
    let detail$ = of(null);
    if (userId) {
      detail$ = this.memberServe.getUserDetail(userId);
      
    } */
     // forkJoin等待所有数据请求完成发射出去
   return  forkJoin([
          this.homeServe.getBanners(),
          this.homeServe.getHotTags(),
          this.homeServe.getPerosonalSheetList(),
          this.singerServer.getEnterSinger(),
      ]).pipe(first());//take(1),first()只执行第一次
  }   
}