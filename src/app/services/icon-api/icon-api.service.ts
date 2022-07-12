import { Injectable } from "@angular/core";
import {Utils} from "../../common/utils";
import IconService, {IconBuilder, IconAmount, IconConverter} from 'icon-sdk-js';
const { CallBuilder, CallTransactionBuilder, IcxTransactionBuilder,  } = IconBuilder;
import {environment} from "../../../environments/environment";
import {IconTransactionType} from "../../models/enums/IconTransactionType";
import log from "loglevel";
import {HttpClient} from "@angular/common/http";
import BigNumber from "bignumber.js";


@Injectable({
  providedIn: "root"
})
export class IconApiService {

  public httpProvider;
  public iconService;

  public stepCost = 30000000;

  constructor(private http: HttpClient) {
    this.httpProvider = new IconService.HttpProvider(environment.iconRpcUrl);
    this.iconService = new IconService(this.httpProvider);
  }

  async getIcxBalance(address: string): Promise<BigNumber> {
    if (!address) {
      throw new Error("getIcxBalance -> address empty or null!");
    }
    const icxBalance = await this.iconService.getBalance(address).execute();
    return Utils.hexToNormalisedNumber(icxBalance);
  }

  public async getTxResult(txHash: string): Promise<any> {
      return await this.iconService.getTransactionResult(txHash).execute();
  }

  public convertNumberToHex(value: BigNumber): string {
    return IconConverter.toHex((IconConverter.toBigNumber(value)));
  }


  public buildTransaction(from: string, to: string, method: string, params: any, transactionType: IconTransactionType,
                          value?: BigNumber): any {
    let tx = null;
    const timestamp = (new Date()).getTime() * 1000;
    const nonce = IconConverter.toHex(IconConverter.toBigNumber(1));
    const stepLimit = IconConverter.toHex((IconConverter.toBigNumber(this.stepCost)));
    const version = IconConverter.toHex((IconConverter.toBigNumber(3)));
    const nid = IconConverter.toHex(IconConverter.toBigNumber(environment.NID));
    value = value ? IconConverter.toHex(IconAmount.of(value, IconAmount.Unit.ICX).toLoop()) : "0x0";

    switch (transactionType) {
      case IconTransactionType.WRITE:
        /* Build `CallTransaction` instance for executing SCORE function. */
        tx = new CallTransactionBuilder()
          .from(from)
          .to(to)
          .stepLimit(stepLimit)
          .nid(nid)
          .value(value)
          .nonce(nonce)
          .version(version)
          .timestamp(timestamp)
          .method(method)
          .params(params)
          .build();
        break;
      case IconTransactionType.READ:
        /* Build `Call` instance for calling external i.e. read methods . */
        tx = new CallBuilder()
          .to(to)
          .method(method)
          .params(params)
          .build();
        break;
      case IconTransactionType.TRANSFER:
        /* Build `IcxTransaction` instance for sending ICX. */
        tx = new IcxTransactionBuilder()
          .from(from)
          .to(to)
          .value(value)
          .stepLimit(stepLimit)
          .nid(nid)
          .nonce(nonce)
          .version(version)
          .timestamp(timestamp)
          .build();
        break;
      default:
        break;
    }

    return tx;
  }

  public async estimateStepCost(tx: any): Promise<BigNumber | undefined> {
    const estimateStepCostPromise =  this.http.post<number>(environment.iconDebugRpcUrl, {
      jsonrpc: "2.0",
      method: "debug_estimateStep",
      id: 1234,
      params: tx
    }).toPromise();

    try {
      const res: any = await estimateStepCostPromise;
      const estimatedStepCost = Utils.hexToNumber(res.result);
      log.debug(`estimatedStepCost = ${estimatedStepCost}`);
      return estimatedStepCost;
    } catch (e) {
      log.error("estimateStepCost error:");
      log.error(e);
      return undefined;
    }
  }

  public async sendTransaction(signedTx: any): Promise<string> {
    try {
      log.debug("Sending transaction: ", signedTx);
      const txHash = await this.iconService.sendTransaction(signedTx).execute();
      log.debug("Tx hash ", txHash);
      return txHash;
    } catch (e) {
      throw e;
    }
  }
}
