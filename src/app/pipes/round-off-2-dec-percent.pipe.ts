import { Pipe, PipeTransform } from '@angular/core';
import {BigNumber} from "bignumber.js";
import {Utils} from "../common/utils";

@Pipe({
  name: 'roundOff2DecPercent'
})
export class RoundOff2DecPercentPipe implements PipeTransform {

  transform(num?: BigNumber | string, defaultZero = false): string {
    return Utils.to2DecimalRndOffPercString(num, defaultZero);
  }

}
