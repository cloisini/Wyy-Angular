import { Component, OnInit, TemplateRef, ViewChild, Input,EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-wy-carousel',
  templateUrl: './wy-carousel.component.html',
  styleUrls: ['./wy-carousel.component.less'],
  changeDetection:ChangeDetectionStrategy.OnPush
  //angular变更检测，只会在input输入属性发生变化之后，组件才会发生变更检测，有利于优化性能
})
export class WyCarouselComponent implements OnInit {
  @ViewChild('dot',{static:true}) dotRef:TemplateRef<any>;
  @Input() activeIndex=0;
  @Output() changeSlide=new EventEmitter<'pre' | 'next'>();
  constructor() { }

  ngOnInit() {
  }
  onChangeSlide(type:'pre' | 'next'){
    this.changeSlide.emit(type);
  }

}
