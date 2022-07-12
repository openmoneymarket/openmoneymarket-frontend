import { Injectable } from '@angular/core';
import {StateChangeService} from "../state-change/state-change.service";
import {Times} from "../../common/constants";
import {Utils} from "../../common/utils";
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
/**
 * Service that manages reloading / refreshing of the data
 */
export class ReloaderService {

  public currentTimestamp: number = Math.floor(new Date().getTime() / 1000);
  public currentTimestampMicro: BigNumber = Utils.timestampNowMicroseconds();

  constructor(private stateChangeService: StateChangeService) {
    // refresh current timestamp every 10 second
    this.refreshCurrentTimestamp();
    setInterval(() => this.refreshCurrentTimestamp() , Times.secondsInMilliseconds(10));
  }

  refreshCurrentTimestamp(): void {
    this.currentTimestamp = Math.floor(new Date().getTime() / 1000);
    this.currentTimestampMicro = Utils.timestampNowMicroseconds();
    this.stateChangeService.currentTimestampUpdate(this.currentTimestamp, this.currentTimestampMicro);
  }
}
