import {AssetTag} from "./Asset";
import BigNumber from "bignumber.js";

export class UserReserveData {
  borrowRate: BigNumber;
  currentBorrowBalance: BigNumber;
  currentBorrowBalanceUSD: BigNumber;
  currentOTokenBalance: BigNumber;
  currentOTokenBalanceUSD: BigNumber;
  exchangeRate: BigNumber;
  lastUpdateTimestamp: BigNumber;
  liquidityRate: BigNumber;
  originationFee: BigNumber;
  principalBorrowBalance: BigNumber;
  principalBorrowBalanceUSD: BigNumber;
  principalOTokenBalance: BigNumber;
  principalOTokenBalanceUSD: BigNumber;
  userBorrowCumulativeIndex: BigNumber;
  userLiquidityIndex: BigNumber;

  constructor(borrowRate: BigNumber, currentBorrowBalance: BigNumber, currentBorrowBalanceUSD: BigNumber, currentOTokenBalance: BigNumber,
              currentOTokenBalanceUSD: BigNumber, exchangeRate: BigNumber, lastUpdateTimestamp: BigNumber, liquidityRate: BigNumber,
              originationFee: BigNumber, principalBorrowBalance: BigNumber, principalBorrowBalanceUSD: BigNumber,
              principalOTokenBalance: BigNumber, principalOTokenBalanceUSD: BigNumber,
              userBorrowCumulativeIndex: BigNumber, userLiquidityIndex: BigNumber) {
    this.borrowRate = borrowRate;
    this.currentBorrowBalance = currentBorrowBalance;
    this.currentBorrowBalanceUSD = currentBorrowBalanceUSD;
    this.currentOTokenBalance = currentOTokenBalance;
    this.currentOTokenBalanceUSD = currentOTokenBalanceUSD;
    this.exchangeRate = exchangeRate;
    this.lastUpdateTimestamp = lastUpdateTimestamp;
    this.liquidityRate = liquidityRate;
    this.originationFee = originationFee;
    this.principalBorrowBalance = principalBorrowBalance;
    this.principalBorrowBalanceUSD = principalBorrowBalanceUSD;
    this.principalOTokenBalance = principalOTokenBalance;
    this.principalOTokenBalanceUSD = principalOTokenBalanceUSD;
    this.userBorrowCumulativeIndex = userBorrowCumulativeIndex;
    this.userLiquidityIndex = userLiquidityIndex;
  }
}

export class UserReserves {
  public reserveMap: Map<AssetTag, UserReserveData | undefined> = new Map([
    [AssetTag.USDS, undefined],
    [AssetTag.ICX, undefined],
    [AssetTag.USDC, undefined],
    [AssetTag.bnUSD, undefined],
    [AssetTag.BALN, undefined],
    [AssetTag.OMM, undefined],
  ]);
}

export class UserAllReservesData {
  USDS: UserReserveData;
  ICX: UserReserveData;
  USDC: UserReserveData;
  bnUSD: UserReserveData;
  BALN: UserReserveData;
  OMM: UserReserveData;

  constructor(USDS: UserReserveData, ICX: UserReserveData, USDC: UserReserveData, bnUSD: UserReserveData,
              BALN: UserReserveData, OMM: UserReserveData) {
    this.USDS = USDS;
    this.ICX = ICX;
    this.USDC = USDC;
    this.bnUSD = bnUSD;
    this.BALN = BALN;
    this.OMM = OMM;
  }
}

// EXAMPLE
// borrowRate: "0x0"
// currentBorrowBalance: "0x0"
// currentBorrowBalanceUSD: "0x0"
// currentOTokenBalance: "0x8ac9cdca719e6c3d"
// currentOTokenBalanceUSD: "0x45e9ee9edbbd4e5a"
// exchangeRate: "0x6fda8aaf22cd54d"
// lastUpdateTimestamp: "0x0"
// liquidityRate: "0x0"
// originationFee: "0x0"
// principalBorrowBalance: "0x0"
// principalBorrowBalanceUSD: "0x0"
// principalOTokenBalance: "0x8ac9cdca719e6c3d"
// principalOTokenBalanceUSD: "0x45e9ee9edbbd4e5a"
// useAsCollateral: "0x1"
// userBorrowCumulativeIndex: "0x0"
// userLiquidityIndex: null
