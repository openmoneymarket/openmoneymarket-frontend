import BigNumber from "bignumber.js";

export class LockingAction {
  before: BigNumber;
  after: BigNumber;
  amount: BigNumber;
  lockingTime: BigNumber; // in milliseconds
  payload: any;

  constructor(before: BigNumber, after: BigNumber, amount: BigNumber, lockingTime: BigNumber, payload?: any) {
    this.before = before;
    this.after = after;
    this.amount = amount;
    this.lockingTime = lockingTime;
    this.payload = payload;
  }
}
