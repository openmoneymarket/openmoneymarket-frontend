import {Injectable} from '@angular/core';
// @ts-ignore
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import log from "loglevel";
import {LedgerIcxBaseData} from "../../interfaces/LedgerIcxBaseData";
import {Icx} from "../../libs/hw-app-icx/Icx";
import {NotificationService} from "../notification/notification.service";
import {environment} from "../../../environments/environment";
import {PersistenceService} from "../persistence/persistence.service";
import {LedgerWallet} from "../../models/wallets/LedgerWallet";
import {AssetTag} from "../../models/classes/Asset";
import {IconApiService} from "../icon-api/icon-api.service";
import {OmmError} from "../../core/errors/OmmError";


@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  private icx?: TransportWebHID;
  private transport: any;

  private LIST_NUM = 5;

  constructor(
    private notificationService: NotificationService,
    private persistenceService: PersistenceService,
    private iconApiService: IconApiService
    ) { }

  async signIn(): Promise<LedgerIcxBaseData | undefined> {

    if (!TransportWebHID.isSupported) {
      this.notificationService.showNewNotification("Unable to connect the ledger. WebUSB transport is not supported.");
    }

    try {
      await this.initialiseTransport();

      this.notificationService.showNewNotification("Waiting for the confirmation of address on Ledger device.. (60 seconds timeout)");

      // coin type: ICX(4801368), ICON testnet(1)
      return await this.icx.getAddress(environment.ledgerBip32Path, true, true);
    } catch (e) {
      this.notificationService.showNewNotification("Unable to connect the ledger." +
        " Make sure it is connected and try again in few moments.");
      log.error("Error in TransportWebUSB... :");
      log.error(e);
      return undefined;
    }
  }

  async getLedgerWallets(index: number): Promise<LedgerWallet[]> {
    try {
      const walletList = [];

      log.debug("getLedgerWallets initialiseTransport..");
      await this.initialiseTransport();

      for (let i = index * this.LIST_NUM; i < index * this.LIST_NUM + this.LIST_NUM; i++) {
        const path = `${environment.ledgerBip32Path}/${i}'`;
        const { address } = await this.icx.getAddress(path, false, true);

        const wallet = new LedgerWallet(address, path);
        const icxBalance = await this.iconApiService.getIcxBalance(address);
        wallet.balances.set(AssetTag.ICX, icxBalance);

        walletList.push(wallet);
      }

      return walletList;
    } catch (e) {
      log.error("getLedgerWallets error: ", e);
      throw e;
    }
  }

  // sign raw transaction and return signed transaction object
  async signTransaction(rawTransaction: any): Promise<any> {
    if (!(this.persistenceService.activeWallet instanceof LedgerWallet)) {
      throw new OmmError("Can not sign transaction with Ledger because Ledger wallet is not active!");
    }
    try {
      await this.initialiseTransport();

      this.notificationService.showNewNotification("Please confirm the transaction on your Ledger device.");

      const rawTx = { ...rawTransaction };
      const phraseToSign = this._generateHashKey(rawTx);
      log.debug("phraseToSign: ", phraseToSign);

      const signedData = await this.icx.signTransaction(this.persistenceService.activeWallet.path, phraseToSign);
      const { signedRawTxBase64 } = signedData;
      log.info("Ledger signTransaction result: ", signedData);

      return {
        ...rawTx,
        signature: signedRawTxBase64,
      };
    } catch (e) {
      this.notificationService.showNewNotification("Unable to sign the transaction with Ledger device." +
        " Make sure it is connected and try again in few moments.");
      log.error(e);
      throw e;
    }
  }

  async initialiseTransport(): Promise<void> {
    if (this.transport?.device?.opened) {
      this.transport.close();
      this.icx = undefined;
    }

    if (!this.icx) {
      this.transport = await TransportWebHID.create();
      if (this.transport.setDebugMode) {
        this.transport.setDebugMode(false);
      }

      this.icx = new Icx(this.transport);
    }
  }

  _generateHashKey(obj: any): any {
    let resultStrReplaced = "";
    const resultStr = this._objTraverse(obj);
    resultStrReplaced = resultStr.substring(1).slice(0, -1);
    return "icx_sendTransaction." + resultStrReplaced;
  }

  _objTraverse(obj: any): any {
    let result = "";
    result += "{";
    let keys;
    keys = Object.keys(obj);
    keys.sort();
    if (keys.length > 0) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = obj[key];
        switch (true) {
          case value === null: {
            result += `${key}.`;
            result += String.raw`\0`;
            break;
          }
          case typeof value === "string": {
            result += `${key}.`;
            result += this._escapeString(value);
            break;
          }
          case Array.isArray(value): {
            result += `${key}.`;
            result += this._arrTraverse(value);
            break;
          }
          case typeof value === "object": {
            result += `${key}.`;
            result += this._objTraverse(value);
            break;
          }
          default:
            break;
        }
        result += ".";
      }
      result = result.slice(0, -1);
      result += "}";
    } else {
      result += "}";
    }

    return result;
  }

  _arrTraverse(arr: any): any {
    let result = "";
    result += "[";
    // tslint:disable-next-line:prefer-for-of
    for (let j = 0; j < arr.length; j++) {
      const value = arr[j];
      switch (true) {
        case value === null: {
          result += String.raw`\0`;
          break;
        }
        case typeof value === "string": {
          result += this._escapeString(value);
          break;
        }
        case Array.isArray(value): {
          result += this._arrTraverse(value);
          break;
        }
        case typeof value === "object": {
          result += this._objTraverse(value);
          break;
        }
        default:
          break;
      }
      result += ".";
    }
    result = result.slice(0, -1);
    result += "]";
    return result;
  }

  _escapeString(value: any): any {
    let newString = String.raw`${value}`;
    newString = newString.split("\\").join("\\\\");
    newString = newString.split(".").join("\\.");
    newString = newString.split("{").join("\\{");
    newString = newString.split("}").join("\\}");
    newString = newString.split("[").join("\\[");
    newString = newString.split("]").join("\\]");
    return newString;
  }

}
