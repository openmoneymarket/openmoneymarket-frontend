import { Pipe, PipeTransform } from '@angular/core';
import {BigNumber} from "bignumber.js";
import {Utils} from "../common/utils";

@Pipe({
  name: 'roundDown0DecPercent'
})
export class RoundDown0DecPercentPipe implements PipeTransform {

  transform(num?: BigNumber | string, defaultZero = false): string {
    return Utils.to0DecimalRoundedDownPercentString(num, defaultZero);
  }

}
