import BigNumber from "bignumber.js";

export class StakingAction{
  before: BigNumber;
  after: BigNumber;
  amount: BigNumber;
  payload: any;

  constructor(before: BigNumber, after: BigNumber, amount: BigNumber, payload?: any) {
    this.before = before;
    this.after = after;
    this.amount = amount;
    this.payload = payload;
  }
}
