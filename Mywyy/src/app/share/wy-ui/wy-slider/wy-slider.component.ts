import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ViewChild, ElementRef, Input, Inject, ChangeDetectorRef, OnDestroy, forwardRef, Output ,EventEmitter} from '@angular/core';
import { Source } from 'webpack-sources';
import { fromEvent, merge, Observable, Subscription } from 'rxjs';
import { filter, tap, pluck, map, distinctUntilChanged, takeUntil } from 'rxjs/internal/operators';
import { SliderEventObserverConfig, SliderValue } from './wy-slider-types';
import { DOCUMENT } from '@angular/common';
import { sliderEvent, getElementOffset } from './wy-slider-helper';
import { inArray } from 'src/app/utils/array';
import { limitNumberInRange, getPercent } from 'src/app/utils/number';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';



@Component({
  selector: 'app-wy-slider',
  templateUrl: './wy-slider.component.html',
  styleUrls: ['./wy-slider.component.less'],
  encapsulation:ViewEncapsulation.None,//视图封装模式，默认只进不出，改为none后组件视图想当与放入html中
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers:[{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => WySliderComponent),
    multi: true
  }]
})
export class WySliderComponent implements OnInit, OnDestroy,ControlValueAccessor {
  @Input() wyVertical = false;
  @Input() wyMin = 0;
  @Input() wyMax = 100;
  @Input() bufferOffset: SliderValue = 0;
  @ViewChild('wySlider', { static: true}) private wySlider: ElementRef;

  @Output() wyOnAfterChange =new EventEmitter<SliderValue>();

  private sliderDom:HTMLDivElement;

  private dragSrart$: Observable<number>;
  private dragMove$: Observable<number>;
  private dragEnd$: Observable<Event>;

  private dragSrart_: Subscription | null;
  private dragMove_: Subscription | null;
  private dragEnd_: Subscription | null;

  private isDragging=false;

  value: SliderValue = null;
  offset: SliderValue = null;
  constructor(
    @Inject(DOCUMENT) private doc: Document,
    private cdr: ChangeDetectorRef
    ) { }

  ngOnInit() {
  
    this.sliderDom = this.wySlider.nativeElement;
    this.createDraggingObservables();
    this.subscribeDrag(['start']);
   
  }
  
  //绑定滑块事件
  private createDraggingObservables(){
    const orientField=this.wyVertical ? 'pageY': 'pageX';
    const mouse: SliderEventObserverConfig = {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      filter:(e: MouseEvent)=> e instanceof MouseEvent,
      pluckKey: [orientField]
    };
    const touch: SliderEventObserverConfig = {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      filter: (e: TouchEvent)=> e instanceof TouchEvent,
      pluckKey: ['touches','0',orientField]
    };
    [mouse, touch].forEach(source=>{
      const { start, move, end, filter: filerFunc,pluckKey} =  source;
       source.startPlucked$ = fromEvent(this.sliderDom, start)
      .pipe(
        filter(filerFunc), 
        tap(sliderEvent),
        pluck(...pluckKey),
        map((postition: number) => this.findClosestValue(postition))
        
      );

      source.end$ = fromEvent(this.doc, end);
      source.moveResolved$ = fromEvent(this.doc, move).pipe(
        filter(filerFunc), 
        tap(sliderEvent),
        pluck(...pluckKey),
        distinctUntilChanged(),//当值发生改变发射流
        map((postition: number) => this.findClosestValue(postition)),
        takeUntil(source.end$)
      )
    });

    //绑定
    this.dragSrart$ = merge(mouse.startPlucked$, touch.startPlucked$);//合并
    this.dragMove$ = merge(mouse.moveResolved$, touch.moveResolved$);//合并
    this.dragEnd$ = merge(mouse.end$, touch.end$);//合并
  }

  private subscribeDrag(events: string[] = ['start', 'move', 'end']){
    if(inArray(events,'start') && this.dragSrart$ && !this.dragSrart_){
      this.dragSrart_ = this.dragSrart$.subscribe(this.onDragStart.bind(this));
    }
    if(inArray(events, 'move') && this.dragMove$ && !this.dragMove_){
      this.dragMove_ = this.dragMove$.subscribe(this.onDragMove.bind(this));
    }
    if(inArray(events, 'end') && this.dragEnd$ && !this.dragEnd_){
      this.dragEnd_ = this.dragEnd$.subscribe(this.onDragEnd.bind(this));
    }
  }
  //解绑
  private unsubscribeDrag(events: string[] = ['start', 'move', 'end']){
    if(inArray(events,'start') && this.dragSrart_){
      this.dragSrart_.unsubscribe();
      this.dragSrart_ = null;
    }
    if(inArray(events, 'move') && this.dragMove_){
      this.dragMove_.unsubscribe();
      this.dragMove_ = null;
    }
    if(inArray(events, 'end') && this.dragEnd_){
      this.dragEnd_.unsubscribe();
      this.dragEnd_ = null;
    }
  }
  private onDragStart(value: number){
    
    this.toggleDragMoving(true);
    this.setValue(value);
    
  }
  private onDragMove(value: number){
    if(this.isDragging){
      this.setValue(value);
      this.cdr.markForCheck();
    }
  }
  private onDragEnd(){
    this.wyOnAfterChange.emit(this.value);
    this.toggleDragMoving(false);
    this.cdr.markForCheck();
  }

  private setValue(value: SliderValue, needCheck = false){
    if (needCheck) {
      if(this.isDragging) return;
      this.value = this.formatValue(value);
      this.updateTrackHandles();
    } else if (!this.valueEqual(this.value,value)) {
      this.value = value;
      this.updateTrackHandles();
      this.onValueChange(this.value);
    }
    
  }

  private formatValue(value: SliderValue): SliderValue {
    let res = value;
    if (this.assertValueValid(value)) {
      res = this.wyMin;
    }else {
      res =limitNumberInRange(value, this.wyMin, this.wyMax);
    }
    return res;
  }

  // 判断是否是NaN
  private assertValueValid(value: SliderValue): boolean {
    return isNaN(typeof value !== 'number' ? parseFloat(value) : value);
  }

  private valueEqual(valA: SliderValue, valB: SliderValue){
    if(typeof valA !== typeof valB){
      return false;
    }
    return valA === valB;
  }


  private updateTrackHandles(){
    this.offset = this.getValueToOffset(this.value);
    this.cdr.markForCheck();
  }

  private getValueToOffset(value: SliderValue):SliderValue{
    return getPercent(this.wyMin, this.wyMax, value);
  }

  private toggleDragMoving(movable: boolean){
    this.isDragging = movable;
    if(movable){
      this.subscribeDrag(['move', 'end']);
    } 
    else{
      this.unsubscribeDrag(['move', 'end']);
    }
  }

  private findClosestValue(postition: number): number{
    //获取滑块总长
    const sliderLength = this.getSliderLength();

    //获取滑块（左，上）端点位置
    const sliderStart=this.getSliderStartPosition();
    //滑块当前位置 / 滑块总长
    const ratio =limitNumberInRange((postition - sliderStart) / sliderLength,0,1);
    const ratioTrue = this.wyVertical ? 1 - ratio : ratio;

    return ratioTrue * (this.wyMax - this.wyMin) + this.wyMin; 
  }

  private getSliderLength(): number{
    return this.wyVertical ? this.sliderDom.clientHeight : this.sliderDom.clientWidth;
  }
  private getSliderStartPosition(): number{
    const offset = getElementOffset(this.sliderDom);
    return this.wyVertical ?  offset.top : offset.left;
  }


  private onValueChange(value: SliderValue): void {

  }
  private onTouched(): void {

  }

  writeValue(value: SliderValue): void {
    this.setValue(value, true);
  }
  registerOnChange(fn: (value: SliderValue) => void): void {
    this.onValueChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  ngOnDestroy(): void{
    this.unsubscribeDrag();
  }
}
