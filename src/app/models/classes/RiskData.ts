import BigNumber from "bignumber.js";

export class RiskData {
  riskTotal: BigNumber;

  constructor(riskTotal: BigNumber) {
    this.riskTotal = riskTotal;
  }
}
