import BigNumber from "bignumber.js";

export class ManageStakedIcxAction {
  amount: BigNumber;
  lockingTime: BigNumber; // in milliseconds


  constructor(amount: BigNumber, lockingTime: BigNumber) {
    this.amount = amount;
    this.lockingTime = lockingTime;
  }
}
