import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WySliderComponent } from './wy-slider.component';
import { WySliderHandleComponent } from './wy-slider-handle.component';
import { WySliderTrackComponent } from './wy-slider-track.component';



//WySliderHandleComponent,WySliderTrackComponent
@NgModule({
  declarations: [WySliderComponent,WySliderTrackComponent,WySliderHandleComponent],
  imports: [
    CommonModule
  ],
  exports:[WySliderComponent]
})
export class WySliderModule { }
