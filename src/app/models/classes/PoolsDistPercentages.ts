import {Utils} from "../../common/utils";
import log from "loglevel";
import BigNumber from "bignumber.js";

export class PoolsDistPercentages {
  liquidity: any;


  constructor(liquidity: any) {
    this.liquidity = liquidity;
  }

  getDistPercentageForPool(poolId: BigNumber): BigNumber {
    const hexDistPercentage = this.liquidity[poolId.toString()];

    if (!hexDistPercentage) {
      log.warn("Failed to retrieve distribution percentage for pool " + poolId);
      return new BigNumber("0");
    }

    return Utils.hexToNormalisedNumber(this.liquidity[poolId.toString()]);
  }
}
