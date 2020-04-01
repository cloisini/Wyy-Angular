import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { FormsModule } from '@angular/forms';
import { WyUiModule } from './wy-ui/wy-ui.module';
import { ImgDefaultDirective } from './directives/img-default.directive';



@NgModule({
  
  imports: [
    NgZorroAntdModule,
    FormsModule,
    CommonModule,
    WyUiModule
  ],
  //导出
  exports:[
    NgZorroAntdModule,
    FormsModule,
    CommonModule,
    WyUiModule,
    ImgDefaultDirective
  ]
  
})
export class ShareModule { }
