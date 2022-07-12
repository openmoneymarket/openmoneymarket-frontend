import {Wallet, WalletType} from "./Wallet";
import {AssetTag} from "../classes/Asset";
import BigNumber from "bignumber.js";

export class IconexWallet extends Wallet{

  constructor(address: string, balances?: Map<AssetTag, BigNumber>) {
    super(WalletType.ICONEX);
    this.address = address;
    if (balances) {
      this.balances = balances;
    }
  }

}
