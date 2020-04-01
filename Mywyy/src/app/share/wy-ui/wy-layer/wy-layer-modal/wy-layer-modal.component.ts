import { Component, EventEmitter, OnInit, ChangeDetectionStrategy, ElementRef, ChangeDetectorRef, ViewChild, AfterViewInit, Renderer2, Inject, Output, Input, OnChanges, SimpleChanges, PLATFORM_ID } from '@angular/core';
import { ModalTypes } from 'src/app/store/reducers/member.reducer';
import { Overlay, OverlayRef, OverlayKeyboardDispatcher, OverlayContainer, BlockScrollStrategy} from '@angular/cdk/overlay'
import { BatchActionsService } from 'src/app/store/batch-actions.service';
import { ESCAPE } from '@angular/cdk/keycodes'
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { WINDOW } from 'src/app/service/service.module';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface SizeType { w: number; h: number; }

@Component({
  selector: 'app-wy-layer-modal',
  templateUrl: './wy-layer-modal.component.html',
  styleUrls: ['./wy-layer-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations:[trigger('showHide', [
      state('start', style({ transform: 'scale(1)', opacity: 1 })),
      state('hide', style({ transform: 'scale(0)', opacity: 0 })),
      transition('show<=>hide', animate('0.1s')) 
    ])]
})
export class WyLayerModalComponent implements OnInit, AfterViewInit, OnChanges {
 
  modalTitle = {
    register: '注册',
    loginByPhone: '手机登录',
    share: '分享',
    like: '收藏',
    default: ''
  }

  showModal = 'hide';

  @Input() visible = false;
  @Input() showSpin = false;
  @Input() currentModalType = ModalTypes.Default;
  private overlayRef: OverlayRef;
  private scrollStrategy: BlockScrollStrategy;
  private resizeHandler: () => void;
  private overlayContainerEl: HTMLElement;

  @ViewChild('modalContainer', {static: false}) private modalRef: ElementRef; 

  @Output() onLoadMySheets = new EventEmitter<void>();

  private isBrowser: boolean;

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private plateformId: object,
    private overlay: Overlay,
    private elementRef: ElementRef,
    private overlayKeyboardDispatcher: OverlayKeyboardDispatcher,
    private cdr: ChangeDetectorRef,
    private batchActionsServe: BatchActionsService,
    private rd: Renderer2,
    private overlayContainerServe:OverlayContainer
  ) {
    this.isBrowser = isPlatformBrowser(this.plateformId);
    this.scrollStrategy = this.overlay.scrollStrategies.block();
  }

  ngOnInit() {
    this.createOberlay();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !changes['visible'].firstChange) {
      this.handleVisibeChange(this.visible);
    }
  }

  ngAfterViewInit(): void {
    this.overlayContainerEl = this.overlayContainerServe.getContainerElement();
    this.listenResizeToCenter();
 }

  private listenResizeToCenter() {
    if (this.isBrowser) {
      const modal = this.modalRef.nativeElement;
      const modalSize = this.getHideDomSize(modal);
      this.keepCenter(modal, modalSize);
      this.resizeHandler = this.rd.listen('window', 'resize', () => this.keepCenter(modal, modalSize));
    
    }
}

  private keepCenter (modal: HTMLElement, size: SizeType) {
    const left = (this.getWindowSize().w - size.w) / 2;
    const top = (this.getWindowSize().h - size.h) / 2;
    modal.style.left = left + 'px';
    modal.style.top = top + 'px';

  }

  private createOberlay() {
    this.overlayRef = this.overlay.create();
    this.overlayRef.overlayElement.appendChild(this.elementRef.nativeElement);
    this.overlayRef.keydownEvents().subscribe(e => this.keydownListener(e));
  }

  private keydownListener (evt: KeyboardEvent) {
   if (evt.keyCode === ESCAPE) {
     this.hide();
   }
  }

  private watchModalVisible(visib: boolean) {
    if (this.visible !==  visib) {
      this.visible = visib;
      this.handleVisibeChange(visib);
    }
  } 
  private watchModalType(type: ModalTypes) {
    if (this.currentModalType !== type) {
      if (type ===  ModalTypes.Like) {
        this.onLoadMySheets.emit();
      }
      this.currentModalType = type;
      this.cdr.markForCheck();
    }
  }
  private handleVisibeChange(visib: boolean) {
    if (visib) {
      this.showModal = 'show';
      this.scrollStrategy.enable();
      this.overlayKeyboardDispatcher.add(this.overlayRef);
      this.listenResizeToCenter();
      this.changePointerEvents('auto');
    } else {
      this.showModal = 'hide';
      this.scrollStrategy.disable();
      this.overlayKeyboardDispatcher.remove(this.overlayRef);
      this.resizeHandler();
      this.changePointerEvents('none');

    }
    this.cdr.markForCheck();
  }

  private changePointerEvents (type: 'none' | 'auto') {
    if (this.overlayContainerEl) {
      this.overlayContainerEl.style.pointerEvents = type;
    }
  }

  hide() {
    this.batchActionsServe.controlModal(false);
  }

  private getWindowSize():SizeType {
    return {
      w: window.innerWidth || this.doc.documentElement.clientWidth || this.doc.body.offsetWidth,
      h: window.innerHeight || this.doc.documentElement.clientHeight || this.doc.body.offsetHeight
    }
  } 

  private getHideDomSize(dom: HTMLElement):SizeType {
    return {
      w: dom.offsetWidth,
      h: dom.offsetHeight
    }
  }

}
