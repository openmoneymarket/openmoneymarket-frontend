import BigNumber from "bignumber.js";

export interface TotalPoolInterface {
  poolID: BigNumber;
  totalStakedBalance: BigNumber;
}

export interface UserPoolDataInterface {
  poolID: BigNumber;
  totalStakedBalance: BigNumber;
  userAvailableBalance: BigNumber;
  userStakedBalance: BigNumber;
  userTotalBalance: BigNumber;
}
