import { Pipe, PipeTransform } from '@angular/core';
import {Utils} from "../common/utils";
import {BigNumber} from "bignumber.js";

@Pipe({
  name: 'roundDown2Dec'
})
export class RoundDown2DecPipe implements PipeTransform {

  transform(value: BigNumber | number | string | undefined): string {
    return Utils.roundDownTo2Decimals(value);
  }

}
