import {AssetTag, CollateralAssetTag} from "./Asset";
import BigNumber from "bignumber.js";
import {OmmError} from "../../core/errors/OmmError";

export class AllReservesData {
  USDS: ReserveData;
  ICX: ReserveData;
  USDC: ReserveData;
  bnUSD: ReserveData;
  BALN: ReserveData;
  OMM: ReserveData;

  constructor(USDb: ReserveData, sICX: ReserveData, USDC: ReserveData, bnUSD: ReserveData, BALN: ReserveData,
              OMM: ReserveData) {
    this.USDS = USDb;
    this.ICX = sICX;
    this.USDC = USDC;
    this.bnUSD = bnUSD;
    this.BALN = BALN;
    this.OMM = OMM;
  }

  public getReserveData(assetTag: AssetTag | CollateralAssetTag): ReserveData {
    switch (assetTag) {
      case AssetTag.ICX:
        return this.ICX;
      case AssetTag.USDS:
        return this.USDS;
      case AssetTag.USDC:
        return this.USDC;
      case AssetTag.bnUSD:
        return this.bnUSD;
      case AssetTag.BALN:
        return this.BALN;
      case AssetTag.OMM:
        return this.OMM;
      case CollateralAssetTag.sICX:
        return this.ICX;
      case CollateralAssetTag.USDS:
        return this.USDS;
      case CollateralAssetTag.USDC:
        return this.USDC;
      case CollateralAssetTag.bnUSD:
        return this.bnUSD;
      case CollateralAssetTag.BALN:
        return this.BALN;
      case CollateralAssetTag.OMM:
        return this.OMM;
      default:
        throw new OmmError(`AllReserves.getReserveData: Unsupported parameter = ${assetTag}`);
    }
  }

  public setReserveData(assetTag: AssetTag, reserveData: ReserveData): void {
    switch (assetTag) {
      case AssetTag.ICX:
        this.ICX = reserveData;
        break;
      case AssetTag.USDS:
        this.USDS = reserveData;
        break;
      case AssetTag.USDC:
        this.USDC = reserveData;
        break;
      case AssetTag.bnUSD:
        this.bnUSD = reserveData;
        break;
      case AssetTag.BALN:
        this.BALN = reserveData;
        break;
      case AssetTag.OMM:
        this.OMM = reserveData;
        break;
      default:
        throw new OmmError(`AllReserves.setReserveData: Unsupported parameter = ${assetTag}`);
    }
  }
}

export class ReserveData {
  totalLiquidity: BigNumber;
  availableLiquidity: BigNumber;
  totalLiquidityUSD: BigNumber;
  availableLiquidityUSD: BigNumber;
  totalBorrows: BigNumber;
  totalBorrowsUSD: BigNumber;
  liquidityRate: BigNumber;
  borrowRate: BigNumber;
  oTokenAddress: string;
  exchangePrice: BigNumber;
  lastUpdateTimestamp: BigNumber;
  baseLTVasCollateral: BigNumber;
  borrowCumulativeIndex: BigNumber;
  borrowingEnabled: BigNumber;
  decimals: BigNumber;
  isActive: BigNumber;
  isFreezed: BigNumber;
  liquidationBonus: BigNumber;
  liquidationThreshold: BigNumber;
  liquidityCumulativeIndex: BigNumber;
  reserveAddress: string;
  sICXRate: BigNumber;
  usageAsCollateralEnabled: boolean;
  rewardPercentage: BigNumber;
  lendingPercentage: BigNumber;
  borrowingPercentage: BigNumber;
  availableBorrows: BigNumber;
  borrowThreshold: BigNumber;


  constructor(totalLiquidity: BigNumber, availableLiquidity: BigNumber, totalLiquidityUSD: BigNumber, availableLiquidityUSD: BigNumber,
              totalBorrows: BigNumber, totalBorrowsUSD: BigNumber, liquidityRate: BigNumber, borrowRate: BigNumber, oTokenAddress: string,
              exchangePrice: BigNumber, lastUpdateTimestamp: BigNumber, baseLTVasCollateral: BigNumber, borrowCumulativeIndex: BigNumber,
              borrowingEnabled: BigNumber, decimals: BigNumber, isActive: BigNumber, isFreezed: BigNumber, liquidationBonus: BigNumber,
              liquidationThreshold: BigNumber, liquidityCumulativeIndex: BigNumber, reserveAddress: string, sICXRate: BigNumber,
              usageAsCollateralEnabled: boolean, rewardPercentage: BigNumber, lendingPercentage: BigNumber,
              borrowingPercentage: BigNumber, availableBorrows: BigNumber, borrowThreshold: BigNumber) {
    this.totalLiquidity = totalLiquidity;
    this.availableLiquidity = availableLiquidity;
    this.totalLiquidityUSD = totalLiquidityUSD;
    this.availableLiquidityUSD = availableLiquidityUSD;
    this.totalBorrows = totalBorrows;
    this.totalBorrowsUSD = totalBorrowsUSD;
    this.liquidityRate = liquidityRate;
    this.borrowRate = borrowRate;
    this.oTokenAddress = oTokenAddress;
    this.exchangePrice = exchangePrice;
    this.lastUpdateTimestamp = lastUpdateTimestamp;
    this.baseLTVasCollateral = baseLTVasCollateral;
    this.borrowCumulativeIndex = borrowCumulativeIndex;
    this.borrowingEnabled = borrowingEnabled;
    this.decimals = decimals;
    this.isActive = isActive;
    this.isFreezed = isFreezed;
    this.liquidationBonus = liquidationBonus;
    this.liquidationThreshold = liquidationThreshold;
    this.liquidityCumulativeIndex = liquidityCumulativeIndex;
    this.reserveAddress = reserveAddress;
    this.sICXRate = sICXRate;
    this.usageAsCollateralEnabled = usageAsCollateralEnabled;
    this.rewardPercentage = rewardPercentage;
    this.lendingPercentage = lendingPercentage;
    this.borrowingPercentage = borrowingPercentage;
    this.availableBorrows = availableBorrows;
    this.borrowThreshold = borrowThreshold;
  }
}

// Example
// availableLiquidity: "0x8848ec5632c44e279"
// availableLiquidityUSD: "0x4424762b19622713d"
// baseLTVasCollateral: "0x6f05b59d3b20000"
// borrowCumulativeIndex: "0xde0b6b3a7640000"
// borrowRate: "0x0"
// borrowingEnabled: "0x1"
// decimals: "0x12"
// exchangePrice: "0x6f05b59d3b20000"
// isActive: "0x1"
// isFreezed: "0x0"
// lastUpdateTimestamp: "0x5b9aa7dcd49c3"
// liquidationBonus: "0x16345785d8a0000"
// liquidationThreshold: "0x905438e60010000"
// liquidityCumulativeIndex: "0xde0b6b3a7640000"
// liquidityRate: "0x0"
// oTokenAddress: "cx7dcf7232084a085507bf2685f785589ebb0b52a1"
// reserveAddress: "cxb7eda227d9ed9c6fc2a74aa5dd7e9a3913f6c281"
// totalBorrows: "0x0"
// totalBorrowsUSD: "0x0"
// totalLiquidity: "0x8848ec5632c44e279"
// totalLiquidityUSD: "0x4424762b19622713d"
// usageAsCollateralEnabled: "0x1"
// rewardPercentage: "0x2c68af0bb140000",
// lendingPercentage: "0xc7d713b49da0000",
// borrowingPercentage: "0x2c68af0bb140000"




