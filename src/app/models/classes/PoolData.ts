import {PoolStats} from "./PoolStats";
import BigNumber from "bignumber.js";

export class PoolData {
  poolId: BigNumber;
  totalStakedBalance: BigNumber;
  poolStats: PoolStats;
  prettyName: string;
  pairClassName: string; // used for css, e.g. OMM/USDS -> omm-usds
  quoteAssetName: string;

  constructor(poolId: BigNumber, totalStakedBalance: BigNumber, poolStats: PoolStats) {
    this.poolId = poolId;
    this.totalStakedBalance = totalStakedBalance;
    this.poolStats = poolStats;
    const splitString = poolStats.name?.replace(" ", "").split("/") ?? ["", ""];
    this.prettyName = splitString[0] + " / " + splitString[1];
    const splitString2 = this.poolStats.name?.replace(" ", "").replace(/[0-9]/g, '')
      .toLowerCase().split("/") ?? ["", ""];
    this.pairClassName = splitString2[0] + "-" + splitString2[1];
    this.quoteAssetName = poolStats.name?.replace(" ", "").split("/")[1] ?? "";
  }
}
