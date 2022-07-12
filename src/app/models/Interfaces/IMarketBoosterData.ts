import BigNumber from "bignumber.js";
import {AssetTag} from "../classes/Asset";

export interface IMarketBoosterData {
  from: BigNumber;
  to: BigNumber;
  supplyBoosterMap: Map<AssetTag, BigNumber>;
  borrowBoosterMap: Map<AssetTag, BigNumber>;
}

