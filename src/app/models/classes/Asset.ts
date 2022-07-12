
export class Asset {
  className: AssetClass; // e.g. "usdb"
  name: AssetName; // e.g. "Bridge Dollars
  tag: AssetTag | CollateralAssetTag; // e.g. USDb

  constructor(className: AssetClass, name: AssetName, tag: AssetTag) {
    this.className = className;
    this.name = name;
    this.tag = tag;
  }

  public static getAdjustedAsset(collateralAsset: CollateralAssetTag, asset: Asset): Asset {
    if (collateralAsset === CollateralAssetTag.sICX) {
      return new Asset(AssetClass.sICX, AssetName.sICX , CollateralAssetTag.sICX);
    } else {
      return asset;
    }
  }
}

export enum AssetClass {
  ICX = "icx",
  USDS = "usds",
  sICX = "sicx",
  USDC = "usdc",
  bnUSD = "bnusd",
  BALN = "baln",
  OMM = "omm"
}

export enum AssetName {
  ICX = "ICON",
  USDS = "Stably USD",
  sICX = "ICON",
  USDC = "ICON USD Coin",
  bnUSD = "Balanced Dollars",
  BALN = "Balance Tokens",
  OMM = "Omm Tokens"
}

export class AssetTag {
  static ICX = "ICX";
  static USDS = "USDS";
  static USDC = "IUSDC";
  static bnUSD = "bnUSD";
  static BALN = "BALN";
  static OMM = "OMM";

  static fromString(value: string): AssetTag {
    if (value === "sICX") {
      value = "ICX";
    } else if (value === "IUSDC") {
      value = "USDC";
    }

    return AssetTag[value as keyof typeof AssetTag];
  }

  static toAdjustedString(asset: AssetTag): string {
    switch (asset) {
      case AssetTag.USDC:
        return "USDC";
      default:
        return asset.toString();
    }
  }

  /** construct AssetTag from pool name by parsing quote asset (base asset is always OMM) */
  static constructFromPoolPairName(name: string): AssetTag | undefined {
    const splitString = name?.replace(" ", "").replace(/[0-9]/g, '').split("/")
      ?? ["", ""];
    return this.fromString(splitString[1]);
  }
}

export class CollateralAssetTag {
  static USDS = "USDS";
  static sICX = "sICX";
  static USDC = "IUSDC";
  static bnUSD = "bnUSD";
  static BALN = "BALN";
  static OMM = "OMM";

  public static getPropertiesDifferentThanAssetTag(): CollateralAssetTag[] {
    return Object.values(CollateralAssetTag).filter(collateralAssetTag =>  !(Object.values(AssetTag).includes(collateralAssetTag)));
  }
}

export function assetToCollateralAssetTag(assetTag: AssetTag): CollateralAssetTag {
  switch (assetTag) {
    case AssetTag.ICX:
      return CollateralAssetTag.sICX;
    case AssetTag.USDC:
      return CollateralAssetTag.USDC;
    case AssetTag.USDS:
      return CollateralAssetTag.USDS;
    case AssetTag.bnUSD:
      return CollateralAssetTag.bnUSD;
    case AssetTag.BALN:
      return CollateralAssetTag.BALN;
    case AssetTag.OMM:
      return CollateralAssetTag.OMM;
    default:
      throw new Error("Invalid AssetTag provided to assetToCollateralAssetTag method!");
  }
}

export function collateralTagToAssetTag(assetTag: CollateralAssetTag): AssetTag {
  switch (assetTag) {
    case CollateralAssetTag.sICX:
      return AssetTag.ICX;
    case CollateralAssetTag.USDC:
      return AssetTag.USDC;
    case CollateralAssetTag.USDS:
      return AssetTag.USDS;
    case CollateralAssetTag.bnUSD:
      return AssetTag.bnUSD;
    case CollateralAssetTag.BALN:
      return AssetTag.BALN;
    case CollateralAssetTag.OMM:
      return AssetTag.OMM;
    default:
      throw new Error("Invalid CollateralAssetTag provided to collateralTagToAssetTag method!");
  }
}

export const supportedAssetsMap: Map<AssetTag, Asset> = new Map([
  [AssetTag.ICX, new Asset(AssetClass.ICX, AssetName.ICX , AssetTag.ICX)],
  [AssetTag.USDS, new Asset(AssetClass.USDS, AssetName.USDS, AssetTag.USDS)],
  [AssetTag.USDC, new Asset(AssetClass.USDC, AssetName.USDC , AssetTag.USDC)],
  [AssetTag.bnUSD, new Asset(AssetClass.bnUSD, AssetName.bnUSD , AssetTag.bnUSD)],
  [AssetTag.BALN, new Asset(AssetClass.BALN, AssetName.BALN , AssetTag.BALN)],
  [AssetTag.OMM, new Asset(AssetClass.OMM, AssetName.OMM , AssetTag.OMM)],
]);



