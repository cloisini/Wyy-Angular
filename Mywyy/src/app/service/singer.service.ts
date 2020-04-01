import { Injectable, Inject } from '@angular/core';
import { ServiceModule, API_CONFIG } from './service.module';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

import {map} from 'rxjs/internal/operators'
import { Singer, SingerDetail } from './data-types/common.types';
import { query } from '@angular/animations';
import querySring from 'query-string'//angular本身就引用的库

type SingerParams={
  offset:number;//页数
  limit:number;//每页多少条
  cat?:string;//可选
}

const defaultParams:SingerParams={

    offset:0,
    limit:9,
    cat:'5001'

}

@Injectable({
  providedIn: ServiceModule
})
export class SingerService {

  constructor(public http:HttpClient,@Inject(API_CONFIG) private uri:string) { }

  getEnterSinger(args:SingerParams=defaultParams):Observable<Singer[]>{

    //添加传递参数
    const params=new HttpParams({fromString: querySring.stringify(args)})
    return this.http.get(this.uri+'artist/list',{params})
    .pipe(map((res:{artists:Singer[]}) =>res.artists));

  }
  // 获取歌手详情和热门歌曲
  getSingerDetail(id: string): Observable<SingerDetail> {
    const params = new HttpParams().set('id', id);
    return this.http.get(this.uri + 'artists', { params })
    .pipe(map(res => res as SingerDetail));
  }
  // 获取相似歌手
  getSimiSinger(id: string): Observable<Singer[]> {
    const params = new HttpParams().set('id', id);
    return this.http.get(this.uri + 'simi/artist', { params })
    .pipe(map((res: {artists}) => res.artists));
  }
}
