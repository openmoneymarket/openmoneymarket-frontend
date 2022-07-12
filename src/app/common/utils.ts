import IconService from 'icon-sdk-js';
import {BigNumber} from "bignumber.js";
import {AssetTag} from "../models/classes/Asset";
import {BridgeWidgetAction} from "../models/Interfaces/BridgeWidgetAction";
import log from "loglevel";
import {lockedDatesToMilliseconds, Times} from "./constants";
import {LockDate} from "../models/enums/LockDate";

export class Utils {

  public static ZERO = new BigNumber("0");


  public static getAvailableLockPeriods(currentLockPeriodEndInMilliseconds: BigNumber): LockDate[] | undefined {
    const lockDates = Object.values(LockDate);
    const lockPeriods = [];

    for (const lockDate of lockDates) {
      const lockDateInMilli = lockedDatesToMilliseconds.get(lockDate)!;
      const currentLockPeriod = currentLockPeriodEndInMilliseconds.minus(Utils.timestampNowMilliseconds());

      // if current lock period is smaller than lock date
      if (lockDateInMilli.gt(currentLockPeriod)) {
        lockPeriods.push(lockDate);
      }
    }

    return lockPeriods.length > 0 ? lockPeriods : undefined;
  }

  public static handleSmallDecimal(num: BigNumber): string {
    if (num.isGreaterThanOrEqualTo(new BigNumber("0.005"))) {
      //  Round 0.005% and above up to 0.01%
      return "<0.01%";
    } else {
      // Round value below 0.005% to 0
      return "0%";
    }
  }

  // Returns number divided by the 10^decimals
  public static hexToNormalisedNumber(value: BigNumber | string, decimals: BigNumber = new BigNumber("18")): BigNumber {
    if (!value || !(new BigNumber(value).isFinite())) {
      return new BigNumber("0");
    } else if (typeof value === "string") {
      return new BigNumber(value, 16).dividedBy(new BigNumber("10").pow(decimals));
    } else {
      return value.dividedBy(new BigNumber("10").pow(decimals));
    }
  }

  public static hexToNumber(value: string | BigNumber): BigNumber {
    if (!value || !(new BigNumber(value).isFinite())) {
      return new BigNumber("0");
    } else if (typeof value === "string") {
      return new BigNumber(value, 16);
    } else {
      return new BigNumber(value);
    }
  }

  public static hexToBoolean(value: any): boolean {
    if (typeof value === "string") {
      return value !== "0x0";
    } else if (value instanceof BigNumber) {
      return value.isEqualTo(1);
    } else {
      return value;
    }
  }

  public static numberToPercent(value: BigNumber | string | number): BigNumber {
    if (value instanceof BigNumber) {
      return value.multipliedBy(new BigNumber("100"));
    }

    return new BigNumber(value).multipliedBy(new BigNumber("100"));
  }

  // Returns true if the address is valid EOA address, false otherwise
  public static isEoaAddress(address: string): boolean {
    if (!address) { return false; }
    return IconService.IconValidator.isEoaAddress(address);
  }

  public static formatNumberToNdigits(num: number, digits: number = 2): string {
    const si = [
      { value: 1, symbol: "" },
      { value: 1E3, symbol: "K" },
      { value: 1E6, symbol: "M" },
      { value: 1E9, symbol: "G" },
      { value: 1E12, symbol: "T" },
      { value: 1E15, symbol: "P" },
      { value: 1E18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let i;
    for (i = si.length - 1; i > 0; i--) {
      if (num >= si[i].value) {
        break;
      }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
  }

  public static formatNumberToUSLocaleString(num: BigNumber): string {
    return num.toNumber().toLocaleString('en-US');
  }

  public static normalisedAmountToBaseAmountString(amount: BigNumber, decimals: BigNumber = new BigNumber("18")): string {
    return amount.multipliedBy(new BigNumber("10").pow(decimals)).toFixed();
  }

  public static roundOffTo2Decimals(value: BigNumber | string | number): string {
    if (value instanceof BigNumber) {
      return value.toFixed(2, BigNumber.ROUND_HALF_CEIL);
    } else {
      return (new BigNumber(value).toFixed(2, BigNumber.ROUND_HALF_CEIL));
    }
  }

  public static roundOffTo0Decimals(value: BigNumber | string): string {
    if (value instanceof BigNumber) {
      return value.toFixed(0, BigNumber.ROUND_HALF_CEIL);
    } else {
      return (new BigNumber(value).toFixed(0, BigNumber.ROUND_HALF_CEIL));
    }
  }

  public static roundDownTo2Decimals(value: BigNumber | number | string | undefined): string {
    if (!value || !(new BigNumber(value).isFinite())) {
      return "0";
    } else if (value instanceof BigNumber) {
      return value.toFixed(2, BigNumber.ROUND_DOWN);
    } else {
      return new BigNumber(value).toFixed(2, BigNumber.ROUND_DOWN);
    }
  }

  public static to2DecimalRndOffPercString(num?: BigNumber | string, defaultZero = false): string {
    if (!num || !(new BigNumber(num).isFinite()) || (+num) <= 0) { return defaultZero ? "0%" : "-"; }

    // convert in to percentage
    num = new BigNumber(num).multipliedBy(new BigNumber("100"));

    // handle values smaller than 0.01%
    if (num.isLessThan(new BigNumber("0.01"))) {
      return Utils.handleSmallDecimal(num);
    }

    return `${(this.tooUSLocaleString(Utils.roundOffTo2Decimals(num)))}%`;
  }

  public static to0DecimalRoundedDownPercentString(num?: BigNumber | string, defaultZero = false): string {
    if (!num || !(new BigNumber(num).isFinite()) || (+num) <= 0) { return defaultZero ? "0%" : "-"; }

    // convert in to percentage
    num = new BigNumber(num).multipliedBy(new BigNumber("100"));

    if (num.isLessThan(1)) {
      return defaultZero ? "0%" : "-";
    }

    return `${(this.tooUSLocaleString(Utils.roundDownToZeroDecimals(num)))}%`;
  }

  public static tooUSLocaleString(num?: BigNumber | string, defaultZero = false): string {
    if (!num || !(new BigNumber(num).isFinite()) || (+num) <= 0) { return defaultZero ? "0" : "-"; }
    if (typeof num === 'string') {
      return Utils.formatNumberToUSLocaleString(new BigNumber(num));
    } else {
      return Utils.formatNumberToUSLocaleString(num);
    }
  }

  public static toDollarUSLocaleString(num?: BigNumber | string, defaultZero = false): string {
    if (!num || !(new BigNumber(num).isFinite()) || (+num) <= 0) { return defaultZero ? "0" : "-"; }
    return `$${this.tooUSLocaleString(num)}`;
  }

  public static roundUpTo2Decimals(value: BigNumber | string): BigNumber {
    if (value instanceof BigNumber) {
      return new BigNumber(value.toFixed(2, BigNumber.ROUND_UP));
    } else {
      return new BigNumber(new BigNumber(value).toFixed(2, BigNumber.ROUND_UP));
    }
  }

  public static roundDownToZeroDecimals(value: BigNumber | string): string {
    if (value instanceof BigNumber) {
      return value.toFixed(0, BigNumber.ROUND_DOWN);
    } else {
      return new BigNumber(value).toFixed(0, BigNumber.ROUND_DOWN);
    }
  }

  public static convertICXTosICX(value: BigNumber, todayRate: BigNumber): BigNumber {
    return value.dividedBy(todayRate);
  }

  public static convertICXToSICXPrice(icxPrice: BigNumber, sICXRate: BigNumber = new BigNumber("0")): BigNumber {
    return icxPrice.multipliedBy(sICXRate);
  }

  public static convertSICXToICX(sICXvalue: BigNumber, sIcxToIcxRate: BigNumber): BigNumber {
    return sICXvalue.multipliedBy(sIcxToIcxRate);
  }

  public static convertIfICXTosICX(value: BigNumber, todayRate: BigNumber, assetTag: AssetTag): BigNumber {
    if (assetTag === AssetTag.ICX) {
      return value.dividedBy(todayRate);
    } else {
      return value;
    }
  }

  public static convertIfSICXToICX(value: BigNumber, sIcxToIcxRate: BigNumber, assetTag: AssetTag): BigNumber {
    if (assetTag === AssetTag.ICX) {
      return value.multipliedBy(sIcxToIcxRate);
    } else {
      return value;
    }
  }

  public static subtract(val1: BigNumber, val2: BigNumber): BigNumber {
    return val1.minus(val2);
  }

  public static add(val1: BigNumber, val2: BigNumber): BigNumber {
    return val1.plus(val2);
  }

  public static divide(val1: BigNumber, val2: BigNumber): BigNumber {
    return val1.dividedBy(val2);
  }

  public static multiply(val1: BigNumber, val2: BigNumber): BigNumber {
    return val1.multipliedBy(val2);
  }

  public static formatIconAddressToShort(address: string): string {
    const length = address.length;
    return address.substring(0, 7) + "..." + address.substring(length - 7, length);
  }

  public static getNumberOfDaysInCurrentMonth(): number {
    const tmp = new Date();
    const d = new Date(tmp.getFullYear(), tmp.getMonth() + 1, 0);
    return d.getDate();
  }

  public static extractTxFailureMessage(tx: any): string {
    return tx?.failure?.message ?? "";
  }

  public static dispatchBridgeWidgetAction(action: BridgeWidgetAction): void {
    const event = new CustomEvent('bri.widget', {
      detail: {
        action: action.valueOf()
      }
    });
    log.debug("Dispatched Bridge event: ", event);
    window.dispatchEvent(event);
  }

  public static toNegative(value: BigNumber | string): BigNumber {
    const bigNum = new BigNumber(value);
    if (bigNum.isZero() || !bigNum.isFinite()) {
      return new BigNumber("0");
    }

    if (typeof value === "string") {
      return (new BigNumber(value)).abs().negated();
    } else {
      return value.abs().negated();
    }
  }

  public static isUndefinedOrZero(value?: number | BigNumber): boolean {
    if (!value) {
      return false;
    } else if (value instanceof BigNumber) {
      return value.isZero();
    } else {
      return value === 0;
    }
  }

  public static countDecimals(value: number): number {
    if (!value) {
      return 0;
    }

    if (Math.floor(value) === value) {
      return 0;
    }

    const split = value.toString().split(".");
    if (!split || !split[1]) {
      return 0;
    }

    return split[1].length || 0;
  }

  public static debounce(fn: any, delay: number): any {
    let timeout: NodeJS.Timeout;

    return () => {
      const context = this;
      const args = arguments;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fn.apply(context, args);
      }, delay || 250);
    };
  }

  public static timestampNowMilliseconds(): BigNumber {
    return new BigNumber(Date.now());
  }

  public static timestampNowMicroseconds(): BigNumber {
    return new BigNumber(Date.now()).multipliedBy(new BigNumber("1000"));
  }

  public static addDaysToTimestamp(timestamp: BigNumber, days: number): BigNumber {
    const dayInMilliSeconds = new BigNumber("86400000000");
    return timestamp.plus(dayInMilliSeconds.multipliedBy(days));
  }

  public static addSecondsToTimestamp(timestamp: BigNumber, seconds: number): BigNumber {
    const microSecond = new BigNumber("1000000");
    return timestamp.plus(microSecond.multipliedBy(seconds));
  }

  /**
   * @description Return converted timestamp in date as dd mon yyyy format (e.g. 12 Mar 2022)
   */
  public static timestampInMillisecondsToPrettyDate(timestamp: BigNumber): string {
    const date = new Date(timestamp.toNumber());
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  public static textContainsDomain(domain: string, text: string): boolean {
    const regExp = new RegExp('^(?:https?:\\/\\/)?(?:[^@\\/\\n]+@)?(?:www\\.)?([^:\\/?\\n]+)');
    const res = regExp.exec(text);
    return res ? res[0].includes(domain) : false;
  }

  public static getVoteDurationTime(voteDurationMicro: BigNumber): string {
    const secondsUntilStart = (voteDurationMicro).dividedBy(new BigNumber("1000000"))
      .dp(2);
    const daysUntilStart = secondsUntilStart.dividedBy(Times.DAY_IN_SECONDS).dp(0);

    if (daysUntilStart.isZero()) {
      const hoursUntilStart = secondsUntilStart.dividedBy(Times.HOUR_IN_SECONDS).dp(0);
      if (hoursUntilStart.isZero()) {
        const minutesUntilStart = secondsUntilStart.dividedBy(Times.MINUTE_IN_SECONDS).dp(0);
        return minutesUntilStart.isEqualTo(1) ? `${minutesUntilStart} minute` : `${minutesUntilStart} minutes`;
      } else {
        return hoursUntilStart.isEqualTo(1) ? `${hoursUntilStart} hour` : `${hoursUntilStart} hours`;
      }
    } else {
      return daysUntilStart.isEqualTo(1) ? `${daysUntilStart} day` : `${daysUntilStart} days`;
    }
  }

  public static uriDecodeIfEncodedUri(uri: string): string {
    uri = uri || '';

    let isStringUriEncoded;
    try {
      isStringUriEncoded =  uri !== decodeURIComponent(uri);
    } catch {
      isStringUriEncoded = false;
    }

    if (isStringUriEncoded) {
      return decodeURIComponent(uri);
    } else {
      return uri;
    }
  }

  public static dateToDateOnlyIsoString(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
