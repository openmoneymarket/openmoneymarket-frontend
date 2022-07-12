import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from "bignumber.js";

@Pipe({
  name: 'abs'
})
export class AbsPipe implements PipeTransform {

  transform(value: BigNumber): BigNumber {
    return value.abs();
  }

}
