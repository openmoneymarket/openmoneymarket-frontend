import {PoolStats} from "./PoolStats";
import BigNumber from "bignumber.js";

export class UserPoolData {
  poolId: BigNumber;
  totalStakedBalance: BigNumber;
  userAvailableBalance: BigNumber;
  userStakedBalance: BigNumber;
  userTotalBalance: BigNumber;
  poolStats: PoolStats;
  cleanPoolName: string; // name without pool numbers
  quoteAssetName: string;
  prettyName: string;
  pairClassName: string; // used for css, e.g. OMM/USDS -> omm-usds

  constructor(poolId: BigNumber, totalStakedBalance: BigNumber, userAvailableBalance: BigNumber, userStakedBalance: BigNumber,
              userTotalBalance: BigNumber,
              poolStats: PoolStats) {
    this.poolId = poolId;
    this.totalStakedBalance = totalStakedBalance;
    this.userAvailableBalance = userAvailableBalance;
    this.userStakedBalance = userStakedBalance;
    this.userTotalBalance = userTotalBalance;
    this.poolStats = poolStats;
    this.cleanPoolName = poolStats.name.replace(" ", "").replace(/[0-9]/g, '');
    this.quoteAssetName = poolStats.name.replace(" ", "").split("/")[1];
    const splitString = poolStats.name.replace(" ", "").split("/");
    this.prettyName = splitString[0] + " / " + splitString[1];
    const splitString2 = this.poolStats.name.replace(" ", "").replace(/[0-9]/g, '').toLowerCase().split("/");
    this.pairClassName = splitString2[0] + "-" + splitString2[1];
  }
}
