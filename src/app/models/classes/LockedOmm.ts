import BigNumber from "bignumber.js";

export class LockedOmm {
  amount: BigNumber; // number of omm Tokens locked
  end: BigNumber; // End represents when the locking period will be over in microseconds

  constructor(amount: BigNumber, end: BigNumber) {
    this.amount = amount;
    this.end = end;
  }
}
