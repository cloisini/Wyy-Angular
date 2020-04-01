import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ShareInfo } from 'src/app/store/reducers/member.reducer';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { ShareParams } from 'src/app/service/member.service';

const MAX_MSG =140;

@Component({
  selector: 'app-wy-layer-share',
  templateUrl: './wy-layer-share.component.html',
  styleUrls: ['./wy-layer-share.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WyLayerShareComponent implements OnInit, OnChanges {
 
  @Input() shareInfo: ShareInfo;
  @Input() visible: false;

  @Output() onCancel = new EventEmitter<void>(); 
  @Output() onShare = new EventEmitter<ShareParams>();

  
  formModel: FormGroup;
  surplusMsgCount = 140;

  constructor() { 
    this.formModel = new FormGroup({
      msg: new FormControl('', Validators.maxLength(MAX_MSG))
    })
    this.formModel.get('msg').valueChanges.subscribe(msg => {
      this.surplusMsgCount = MAX_MSG - msg.length
    });
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !changes['visible'].firstChange) {
      //this.formModel.markAllAsTouched();
      this.formModel.get('msg').markAsTouched();
    }
  }

  OnSubmit() {
    console.log('this.formModel :', this.formModel);
    
    if (this.formModel.valid) {
      this.onShare.emit({
        id: this.shareInfo.id,
        msg: this.formModel.get('msg').value,
        type: this.shareInfo.type
      });
      console.log('id :', this.shareInfo.id);
      console.log('msg :', this.formModel.get('msg').value);
      console.log('type :', this.shareInfo.type);

    }
  }

}
