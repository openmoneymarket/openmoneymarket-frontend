import BigNumber from "bignumber.js";

export class ReserveConfigData {
  baseLTVasCollateral: BigNumber;
  borrowingEnabled: BigNumber;
  decimals: BigNumber;
  isActive: BigNumber;
  liquidationBonus: BigNumber;
  liquidationThreshold: BigNumber;
  usageAsCollateralEnabled: BigNumber;


  constructor(baseLTVasCollateral: BigNumber, decimals: BigNumber, liquidationThreshold: BigNumber, liquidationBonus: BigNumber,
              usageAsCollateralEnabled: BigNumber, borrowingEnabled: BigNumber, isActive: BigNumber) {
    this.baseLTVasCollateral = baseLTVasCollateral;
    this.decimals = decimals;
    this.liquidationThreshold = liquidationThreshold;
    this.liquidationBonus = liquidationBonus;
    this.usageAsCollateralEnabled = usageAsCollateralEnabled;
    this.borrowingEnabled = borrowingEnabled;
    this.isActive = isActive;
  }
}

// Example
// baseLTVasCollateral: "0x6f05b59d3b20000"
// borrowingEnabled: "0x1"
// decimals: "0x12"
// isActive: "0x1"
// liquidationBonus: "0x16345785d8a0000"
// liquidationThreshold: "0x905438e60010000"
// usageAsCollateralEnabled: "0x1"
