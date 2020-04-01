export  function sliderEvent(e:Event) {
    e.stopPropagation();//阻止冒泡
    e.preventDefault();//阻止默认事件
  }
export  function getElementOffset(el: HTMLElement): { top: number; left: number; } {
  if(!el.getClientRects().length){
    return {
      top: 0,
      left: 0
    }
  }
  const rect = el.getBoundingClientRect();//位置
  const win = el.ownerDocument.defaultView;
  return {
    top: rect.top + win.pageYOffset,
    left: rect.left + win.pageXOffset
  }
}