import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {

  transform(time: number): any {
    if(time) {
      const temp = time | 0;//向下取整
      const minute = temp / 60 | 0;
      const second = (temp % 60).toString().padStart(2, '0');//padstart前置补0,如果秒数不够就设置为两位，补0
      return `${minute}:${second}`;
    }
    else{
      return '00:00'
    }
  }

}
