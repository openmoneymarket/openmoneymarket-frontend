import {AssetTag, CollateralAssetTag} from "./Asset";

export class AllAddresses {
  collateral: Collateral;
  oTokens: OTokens;
  dTokens: DTokens;
  systemContract: SystemContract;


  constructor(collateral: Collateral, oTokens: OTokens, dTokens: DTokens, systemContract: SystemContract) {
    this.collateral = collateral;
    this.oTokens = oTokens;
    this.dTokens = dTokens;
    this.systemContract = systemContract;
  }

  collateralAddress(assetTag: AssetTag | CollateralAssetTag): string {
    switch (assetTag) {
      case AssetTag.ICX:
        return this.collateral.sICX;
      case AssetTag.USDS:
        return this.collateral.USDS;
      case AssetTag.USDC:
        return this.collateral.IUSDC;
      case AssetTag.bnUSD:
        return this.collateral.bnUSD;
      case AssetTag.BALN:
        return this.collateral.BALN;
      case AssetTag.OMM:
        return this.collateral.OMM;
      case CollateralAssetTag.sICX:
        return this.collateral.sICX;
      case CollateralAssetTag.USDS:
        return this.collateral.USDS;
      case CollateralAssetTag.USDC:
        return this.collateral.IUSDC;
      case CollateralAssetTag.bnUSD:
        return this.collateral.bnUSD;
      case CollateralAssetTag.BALN:
        return this.collateral.BALN;
      case CollateralAssetTag.OMM:
        return this.collateral.OMM;
      default:
        return "";
    }
  }

  oTokenAddress(assetTag: AssetTag): string {
    switch (assetTag) {
      case AssetTag.ICX:
        return this.oTokens.oICX;
      case AssetTag.USDS:
        return this.oTokens.oUSDS;
      case AssetTag.USDC:
        return this.oTokens.oIUSDC;
      case AssetTag.bnUSD:
        return this.oTokens.obnUSD;
      case AssetTag.BALN:
        return this.oTokens.oBALN;
      case AssetTag.OMM:
        return this.oTokens.oOMM;
      default:
        return "";
    }
  }
}

interface Collateral {
  USDS: string;
  sICX: string;
  IUSDC: string;
  bnUSD: string;
  BALN: string;
  OMM: string;
}

interface OTokens {
  oUSDS: string;
  oICX: string;
  oIUSDC: string;
  obnUSD: string;
  oBALN: string;
  oOMM: string;
}

interface DTokens {
  dUSDS: string;
  dICX: string;
  dIUSDC: string;
  dbnUSD: string;
  dBALN: string;
  dOMM: string;
}

interface SystemContract {
  DEX: string;
  Governance: string;
  LendingPool: string;
  LendingPoolDataProvider: string;
  Staking: string;
  Rewards: string;
  OmmToken: string;
  Delegation: string;
  PriceOracle: string;
  RewardWeightController: string;
  StakedLp: string;
  bOMM: string;
}
