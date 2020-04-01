import { NgModule, SkipSelf, Optional } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from '../app-routing.module';
import { ServiceModule } from '../service/service.module';
import { PagesModule } from '../pages/pages.module';
import { ShareModule } from '../share/share.module';
import {  NZ_I18N, zh_CN } from 'ng-zorro-antd';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { AppStoreModule } from '../store';

//配置语言
registerLocaleData(zh);
@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    ServiceModule,
    PagesModule,
    ShareModule,
    AppStoreModule,
    AppRoutingModule
  ],
  exports:[

    ShareModule,
    AppRoutingModule

  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
})
export class CoreModule { 

  //@SkipSelf 跳过寻找自己
  //@Optional 如果paretModeul没找到就赋值null
  constructor(@SkipSelf() @Optional() parentModeul:CoreModule){

    if(parentModeul){

      throw new Error('CoreModule 只能配AppModule引用')

    }

  }

}
