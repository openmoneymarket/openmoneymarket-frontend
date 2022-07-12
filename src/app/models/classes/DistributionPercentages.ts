import BigNumber from "bignumber.js";

export class DistributionPercentages {
  daoFund: BigNumber;
  liquidityProvider: BigNumber;
  lendingBorrow: BigNumber;
  worker: BigNumber;

  constructor(daoFund: BigNumber, lp: BigNumber, lendingBorrow: BigNumber, worker: BigNumber) {
    this.daoFund = daoFund;
    this.liquidityProvider = lp;
    this.lendingBorrow = lendingBorrow;
    this.worker = worker;
  }
}
