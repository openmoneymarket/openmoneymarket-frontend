import {Asset, AssetTag, CollateralAssetTag, supportedAssetsMap} from "../classes/Asset";
import BigNumber from "bignumber.js";

export abstract class Wallet {
  address = "";
  balances: Map<AssetTag, BigNumber>;
  // collateral assets balances differentiates by ICX -> sICX
  collateralBalances: Map<CollateralAssetTag, BigNumber>;
  type: WalletType;

  protected constructor(type: WalletType, address?: string) {
    this.address = address ?? "";
    this.type = type;
    this.balances = new Map<AssetTag, BigNumber>();
    this.collateralBalances = new Map<CollateralAssetTag, BigNumber>();

    // init asset balances
    supportedAssetsMap.forEach((value: Asset, key: AssetTag) => {
      this.balances.set(key, new BigNumber("0"));
    });

    // init collateral asset balances
    Object.values(CollateralAssetTag).forEach((assetTag: CollateralAssetTag) => {
      this.collateralBalances.set(assetTag, new BigNumber("0"));
    });
  }
}

export enum WalletType {
  ICONEX,
  BRIDGE,
  LEDGER
}
