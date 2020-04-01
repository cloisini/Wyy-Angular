import { Component, OnInit,EventEmitter, ViewEncapsulation, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, Input, OnChanges, SimpleChanges, Output, Inject } from '@angular/core';
import BScroll from '@better-scroll/core'
import ScrollBar from '@better-scroll/scroll-bar';
import MouseWheel from '@better-scroll/mouse-wheel'
import { timer } from 'rxjs';

BScroll.use(MouseWheel)
BScroll.use(ScrollBar);


@Component({
  selector: 'app-wy-scroll',
  template: `
    <div class="wy-scroll" #wrap>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`.wy-scroll{width: 100%; height: 100%; overflow: hidden}`],
  encapsulation: ViewEncapsulation.None,//样式内联
  changeDetection: ChangeDetectionStrategy.OnPush//变更检测策略
})
export class WyScrollComponent implements OnInit,AfterViewInit,OnChanges {
 
  @Input() data: any[];
  @Input() refreshDelay = 50;

  @Output() private onScrollEnd = new EventEmitter<number>();

  private bs: BScroll;

  @ViewChild('wrap', { static: true}) private wrapRef: ElementRef;
  constructor(readonly el: ElementRef) { }

  ngOnInit() {
  }
  ngAfterViewInit () {
    this.bs = new BScroll(this.wrapRef.nativeElement, {
          scrollY: true,
          scrollbar: {
            interactive: true
          },
          mouseWheel:{}
    });
    this.bs.on('scrollEnd', ({ y }) => this.onScrollEnd.emit(y));
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.refreshScroll();
    }
  }

  scrollToElement(...args) {
    this.bs.scrollToElement.apply(this.bs, args);
  }
  scrollTo(...args) {
    this.bs.scrollToElement.apply(this.bs, args);
  }
  
  //刷新
  private refresh() {
    this.bs.refresh();
  }

  refreshScroll() {
    timer(this.refreshDelay).subscribe(() => {
      this.refresh();
    }) ;
  }
}
