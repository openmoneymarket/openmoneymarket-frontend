import BigNumber from "bignumber.js";

export class DelegationPreference {
  "_address": string;
  "_votes_in_per": BigNumber;

  constructor(address: string, votesInPer: BigNumber) {
    this._address = address;
    this._votes_in_per = votesInPer;
  }
}
