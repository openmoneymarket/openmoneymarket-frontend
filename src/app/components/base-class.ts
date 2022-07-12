import {Utils} from "../common/utils";
import {Asset, AssetTag, supportedAssetsMap} from "../models/classes/Asset";
import {BigNumber} from "bignumber.js";
import {PersistenceService} from "../services/persistence/persistence.service";
import {environment} from "../../environments/environment";


/*
* Base class to be used as extension in component in order to inherit useful methods
*/
export class BaseClass {

  constructor(public persistenceService: PersistenceService) {
  }

  public supportedAssetsMap = supportedAssetsMap;
  public AssetTag = AssetTag;
  public supportedAssets: Asset[] = Array.from(supportedAssetsMap.values());
  public ZERO = new BigNumber("0");

  public delay = (() => {
    let timer: any;
    return (callback: any, ms: any) => {
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
    };
  })();

  public tooUSLocaleString(num?: BigNumber | string, defaultZero = false): string {
    return Utils.tooUSLocaleString(num, defaultZero);
  }

  public to2DecimalRndOffPercString(num?: BigNumber | string, defaultZero = false): string {
    return Utils.to2DecimalRndOffPercString(num, defaultZero);
  }

  public to0DecimalRoundedDownPercentString(num?: BigNumber | string, defaultZero = false): string {
    return Utils.to0DecimalRoundedDownPercentString(num, defaultZero);
  }

  public hideElement(hide: boolean): any {
    return {display: hide ? 'none' : null};
  }

  public hideElementOrDisplayContents(hide: boolean): any {
    return {display: hide ? 'none' : 'contents'};
  }

  public displayAsBlockOrHide(show: boolean): any {
    return {display: show ? 'block' : 'none'};
  }

  public convertFromICXTosICX(ICXvalue: BigNumber | undefined): BigNumber {
    if (!ICXvalue || !(new BigNumber(ICXvalue).isFinite())) { return new BigNumber("0"); }
    return ICXvalue.dividedBy(this.persistenceService.sIcxToIcxRate());
  }

  public convertSICXToICX(sICXvalue: BigNumber): BigNumber {
    return sICXvalue.multipliedBy(this.persistenceService.sIcxToIcxRate());
  }

  public listIsNotNullOrEmpty(list?: any[]): boolean {
    return (list != null && list.length > 0);
  }

  public userLoggedIn(): boolean {
    return this.persistenceService.userLoggedIn();
  }

  formatIconAddressToShort(address: string): string {
    return Utils.formatIconAddressToShort(address);
  }

  addClass(htmlElement: any, className: string): void {
    htmlElement.classList.add(className);
  }

  removeClass(htmlElement: any, className: string): void {
    htmlElement.classList.remove(className);
  }

  setText(htmlElement: any, text: string): void {
    if (htmlElement) {
      htmlElement.textContent = text;
    }
  }

  getText(htmlElement: any): string {
    return htmlElement.textContent ?? "";
  }

  toZeroIfDash(dash: string): string {
    return dash === "-" ? "0" : dash;
  }

  makeAbsolute(value: BigNumber): BigNumber {
    return value.abs();
  }

  isNegative(value: BigNumber): boolean {
    return value.isNegative();
  }

  isProduction(): boolean {
    return environment.production;
  }

  public timestampInMillisecondsToPrettyDate(timestamp?: BigNumber): string {
    if (!timestamp) { return ""; }
    return Utils.timestampInMillisecondsToPrettyDate(timestamp);
  }

  public addTimestampToNowToPrettyDate(timestamp?: BigNumber): string {
    if (!timestamp) { return ""; }
    return this.timestampInMillisecondsToPrettyDate(Utils.timestampNowMilliseconds().plus(timestamp));
  }

}
