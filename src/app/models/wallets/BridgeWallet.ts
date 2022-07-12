// @ts-ignore
import {BridgeService} from "../../../../build/bridge.bundle";
import {Wallet, WalletType} from "./Wallet";
import {AssetTag} from "../classes/Asset";
import BigNumber from "bignumber.js";

export class BridgeWallet extends Wallet {
  email: string;
  bridgeInstance: BridgeService;

  constructor(address: string, email: string, bridgeInstance: BridgeService, balances?: Map<AssetTag, BigNumber>) {
    super(WalletType.BRIDGE);
    this.address = address;
    this.email = email;
    this.bridgeInstance = bridgeInstance;
    if (balances) {
      this.balances = balances;
    }
  }

}
