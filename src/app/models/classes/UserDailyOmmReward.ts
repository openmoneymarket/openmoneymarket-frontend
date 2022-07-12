import BigNumber from "bignumber.js";
import {AssetTag} from "./Asset";

export class UserDailyOmmReward {
  "OMM/IUSDC": BigNumber;
  "OMM/USDS": BigNumber;
  "OMM/sICX": BigNumber;
  bOMM: BigNumber;
  dBALN: BigNumber;
  dICX: BigNumber;
  dIUSDC: BigNumber;
  dOMM: BigNumber;
  dUSDS: BigNumber;
  dbnUSD: BigNumber;
  oBALN: BigNumber;
  oICX: BigNumber;
  oIUSDC: BigNumber;
  oOMM: BigNumber;
  oUSDS: BigNumber;
  obnUSD: BigNumber;


  constructor(OmmIusdc: BigNumber, OmmUsds: BigNumber, OmmSicx: BigNumber, bOMM: BigNumber, dBALN: BigNumber, dICX: BigNumber,
              dIUSDC: BigNumber, dOMM: BigNumber, dUSDS: BigNumber, dbnUSD: BigNumber, oBALN: BigNumber, oICX: BigNumber,
              oIUSDC: BigNumber, oOMM: BigNumber, oUSDS: BigNumber, obnUSD: BigNumber) {
    this["OMM/IUSDC"] = OmmIusdc;
    this["OMM/USDS"] = OmmUsds;
    this["OMM/sICX"] = OmmSicx;
    this.bOMM = bOMM;
    this.dBALN = dBALN;
    this.dICX = dICX;
    this.dIUSDC = dIUSDC;
    this.dOMM = dOMM;
    this.dUSDS = dUSDS;
    this.dbnUSD = dbnUSD;
    this.oBALN = oBALN;
    this.oICX = oICX;
    this.oIUSDC = oIUSDC;
    this.oOMM = oOMM;
    this.oUSDS = oUSDS;
    this.obnUSD = obnUSD;
  }

  getSupplyRewardForAsset(assetTag: AssetTag): BigNumber {
    switch (assetTag) {
      case AssetTag.OMM:
        return this.oOMM;
      case AssetTag.BALN:
        return this.oBALN;
      case AssetTag.bnUSD:
        return this.obnUSD;
      case AssetTag.USDC:
        return this.oIUSDC;
      case AssetTag.USDS:
        return this.oUSDS;
      case AssetTag.ICX:
        return this.oICX;
      default:
        return new BigNumber(0);
    }
  }

  getBorrowRewardForAsset(assetTag: AssetTag): BigNumber {
    switch (assetTag) {
      case AssetTag.OMM:
        return this.dOMM;
      case AssetTag.BALN:
        return this.dBALN;
      case AssetTag.bnUSD:
        return this.dbnUSD;
      case AssetTag.USDC:
        return this.dIUSDC;
      case AssetTag.USDS:
        return this.dUSDS;
      case AssetTag.ICX:
        return this.dICX;
      default:
        return new BigNumber(0);
    }
  }

}
