import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from "bignumber.js";
import {Utils} from "../common/utils";

@Pipe({
  name: 'dollarUsLocale'
})
export class DollarUsLocalePipe implements PipeTransform {

  transform(num?: BigNumber | string, defaultZero = false): string {
    return Utils.toDollarUSLocaleString(num, defaultZero);
  }

}
