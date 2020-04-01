import { Injectable, Inject } from '@angular/core';
import { ServiceModule, API_CONFIG } from './service.module';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SongUrl, Song, Lyric, SearchResult } from './data-types/common.types';
import { Observable, observable } from 'rxjs';
import { map } from 'rxjs/internal/operators';




@Injectable({
  providedIn: ServiceModule
})
export class SearchService {

  constructor(public http: HttpClient, @Inject(API_CONFIG) private uri: string) { }

  search(keywords: string): Observable<SearchResult> {
    const params = new HttpParams().set('keywords', keywords);

    return this.http.get(this.uri + 'search/suggest', { params })
    .pipe(map((res: {result: SearchResult}) => res.result));
  }


}
