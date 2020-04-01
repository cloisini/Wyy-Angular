import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, forkJoin} from 'rxjs';
import { first } from 'rxjs/internal/operators';
import { User, UserSheet, RecordVal } from 'src/app/service/data-types/member.types';
import { MemberService } from 'src/app/service/member.service';

type CenterDataType=[User, RecordVal[]];

@Injectable({
  providedIn: 'root',
})
export class RecordResolverService implements Resolve<CenterDataType> {
  constructor(
    private memberServe: MemberService,
    private router: Router
  ) {}
  resolve(route: ActivatedRouteSnapshot):Observable<CenterDataType> {
    const uid = route.paramMap.get('id');
    if (uid) {
      return forkJoin([
        this.memberServe.getUserDetail(uid),
        this.memberServe.getUserRecord(uid)
      ]).pipe(first());
      
    } else {
      this.router.navigate(['/home']);
    }
     // forkJoin等待所有数据请求完成发射出去
  }   
}