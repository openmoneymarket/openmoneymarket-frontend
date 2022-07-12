import BigNumber from "bignumber.js";

export class OmmTokenBalanceDetails {
  totalBalance: BigNumber;
  availableBalance: BigNumber;
  stakedBalance: BigNumber;
  unstakingBalance: BigNumber;
  unstakingTimeInMills: BigNumber;


  constructor(totalBalance: BigNumber, availableBalance: BigNumber, stakedBalance: BigNumber, unstakingBalance: BigNumber,
              unstakingTimeInMills: BigNumber) {
    this.totalBalance = totalBalance;
    this.availableBalance = availableBalance;
    this.stakedBalance = stakedBalance;
    this.unstakingBalance = unstakingBalance;
    this.unstakingTimeInMills = unstakingTimeInMills;
  }

  public getClone(): OmmTokenBalanceDetails {
    return new OmmTokenBalanceDetails(
      this.totalBalance.dp(0),
      this.availableBalance.dp(0),
      this.stakedBalance.dp(0),
      this.unstakingBalance.dp(0),
      this.unstakingTimeInMills
    );
  }

}

// Example response
// {
//   "totalBalance": 20000000000000000000,
//   "availableBalance": 0,
//   "stakedBalance": 20000000000000000000,
//   "unstakingBalance": 0,
//   "unstakingTimeInMills": 1613385764000
//
// }
