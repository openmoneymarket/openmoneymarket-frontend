import { Injectable } from '@angular/core';
import BigNumber from "bignumber.js";
import {DEFAULT_SLIDER_MAX} from "../../common/constants";

declare var noUiSlider: any;
declare var wNumb: any;

@Injectable({
  providedIn: 'root'
})
export class SlidersService {

  constructor() { }

  public createNoUiSlider(htmlElement: any, start?: BigNumber, padding?: BigNumber, connect?: string, tooltips?: [],
                          range?: any, format?: any): void {
    if (!htmlElement) { return; }
    noUiSlider.create(htmlElement, {
      start: [start?.toNumber() ?? 10000],
      padding: [padding?.toNumber() ?? 0],
      connect: connect ?? 'lower',
      range: range ?? {
        min: [0],
        max: [15000]
      }
    });
  }

  public deriveSliderMaxValue(max: BigNumber): number {
    if (max.isZero() || max.isNegative() || max.isNaN()) {
      return DEFAULT_SLIDER_MAX;
    }

    return max.toNumber();
  }

}
