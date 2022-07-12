import BigNumber from "bignumber.js";

export class YourPrepVote {
  address: string;
  name: string;
  percentage: BigNumber;

  constructor(address: string, name: string, percentage: BigNumber) {
    this.address = address;
    this.name = name;
    this.percentage = percentage;
  }
}
