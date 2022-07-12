import {UserAction} from "../enums/UserAction";
import {AssetTag} from "./Asset";
import BigNumber from "bignumber.js";

export class RiskCalculationData {
  assetTag: AssetTag;
  amount: BigNumber;
  action: UserAction;

  constructor(assetTag: AssetTag, amount: BigNumber, action: UserAction) {
    this.assetTag = assetTag;
    this.amount = amount;
    this.action = action;
  }
}
