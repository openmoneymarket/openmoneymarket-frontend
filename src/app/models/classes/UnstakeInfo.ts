import BigNumber from "bignumber.js";

export class UnstakeInfo {
  totalAmount: BigNumber;
  details: UnstakeIcxData[];

  constructor(totalAmount: BigNumber, details: UnstakeIcxData[]) {
    this.totalAmount = totalAmount;
    this.details = details;
  }
}

export class UnstakeIcxData {
  amount: BigNumber;
  unstakingBlockHeight: BigNumber;

  constructor(amount: BigNumber, unstakingBlockHeight: BigNumber) {
    this.amount = amount;
    this.unstakingBlockHeight = unstakingBlockHeight;
  }
}
