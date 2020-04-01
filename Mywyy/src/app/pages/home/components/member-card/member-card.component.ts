import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { User } from 'src/app/service/data-types/member.types';
import { MemberService } from 'src/app/service/member.service';
import { timer } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.less']
})
export class MemberCardComponent implements OnInit {
  point: number;
  showPoint = false;
  tipTitle = '';
  showTip = false;
  @Input() user: User;
  @Output() openModal = new EventEmitter<void>();
  constructor(private memberServe: MemberService,private messageServe: NzMessageService) { }

  ngOnInit() {
  }
  onSignin() {
    this.memberServe.sigin().subscribe(res => {
      this.alertMessage('success', '签到成功');
      this.tipTitle = '积分+' + res.point;
      this.showTip = true;
      timer(1500).subscribe(() => 
      {
        this.showTip = false ;
        this.tipTitle = ""
      })}, error => {
      console.log('error :', error);
      this.alertMessage('error', error.msg || '签到失败');
    });
  }
  private alertMessage (type: string, msg: string) {
    this.messageServe.create(type, msg);
}
}
