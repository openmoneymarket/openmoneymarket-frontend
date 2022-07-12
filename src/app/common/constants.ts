/** Modal constants */
import BigNumber from "bignumber.js";
import {LockDate} from "../models/enums/LockDate";

export const BORROW = "Borrow";
export const SUPPLY = "Supply";
export const REPAY = "Repay";
export const WITHDRAW = "Withdraw";

export const defaultPrepLogoUrl = "assets/img/icon/profile.svg";

export const ommForumDomain = "forum.omm.finance";

export const ommBannerExitKey = "omm-bnr-closed1";

export const contributorsMap = new Map([
  ["hxfba37e91ccc13ec1dab115811f73e429cde44d48", true], // ICX_Station
  ["hx28c08b299995a88756af64374e13db2240bc3142", true], // PARROT9
  ["hx231a795d1c719b9edf35c46b9daa4e0b5a1e83aa", true], // iBriz - ICONOsphere
  ["hx2bbb1b0300f5dc0caa0e1a3ba1701a22e7590763", true] //  Protokol7
]);

// how much ICX should be left when user is supplying
export const ICX_SUPPLY_BUFFER = 2;

export const DEFAULT_SLIDER_MAX = 0.01;

// notification timeout
export const NOTIFICATION_TIMEOUT = 5000; // ms

// Regexes
export const BORROW_MAX_ERROR_REGEX = new RegExp('amount\\s+requested.*is\\s+more\\s+than\\s+the.*');

export class Times {
  /** Class containing times (seconds, minutes, ..) in seconds, milliseconds and methods to retrieve arbitrary time in it */
  public static readonly SECOND_IN_MILLISECONDS = 1000;
  public static readonly MINUTE_IN_MILLISECONDS = 60000;
  public static readonly HOUR_IN_MILLISECONDS = 3600000;
  public static readonly DAY_IN_MILLISECONDS = 86400000;
  public static readonly WEEK_IN_MILLISECONDS = new BigNumber("604800000");
  public static readonly MONTH_IN_MILLISECONDS = new BigNumber("2592000000");
  public static readonly YEAR_IN_MILLISECONDS = new BigNumber("31536000000");
  public static readonly TWO_YEARS_IN_MILLISECONDS = new BigNumber("63072000000");
  public static readonly FOUR_YEARS_IN_MILLISECONDS = new BigNumber("126144000000");

  public static readonly MINUTE_IN_SECONDS = 60;
  public static readonly HOUR_IN_SECONDS = 3600;
  public static readonly DAY_IN_SECONDS = 86400;

  public static secondsInMilliseconds(seconds: number): number {
    return seconds * Times.SECOND_IN_MILLISECONDS;
  }

  public static minutesInMilliseconds(minutes: number): number {
    return minutes * Times.MINUTE_IN_MILLISECONDS;
  }

  public static minutesInSeconds(minutes: number): number {
    return minutes * Times.MINUTE_IN_SECONDS;
  }

  public static daysInSeconds(days: number): number {
    return days * Times.DAY_IN_SECONDS;
  }
}

export const lockedUntilDateOptions = [LockDate.WEEK, LockDate.MONTH, LockDate.MONTH_3, LockDate.MONTH_6, LockDate.YEAR, LockDate.TWO_YEARS,
  LockDate.FOUR_YEARS];

export const lockedDatesToMilliseconds = new Map([
  [LockDate.WEEK, Times.WEEK_IN_MILLISECONDS],
  [LockDate.MONTH, Times.MONTH_IN_MILLISECONDS],
  [LockDate.MONTH_3, Times.MONTH_IN_MILLISECONDS.multipliedBy(3)],
  [LockDate.MONTH_6, Times.MONTH_IN_MILLISECONDS.multipliedBy(6)],
  [LockDate.YEAR, Times.YEAR_IN_MILLISECONDS],
  [LockDate.TWO_YEARS, Times.TWO_YEARS_IN_MILLISECONDS],
  [LockDate.FOUR_YEARS, Times.FOUR_YEARS_IN_MILLISECONDS],
]);

export function lockedDateTobOmmPerOmm(lockDate: LockDate): BigNumber {
  switch (lockDate) {
    case LockDate.WEEK:
      return new BigNumber("0.0048");
    case LockDate.MONTH:
      return new BigNumber("0.0208333");
    case LockDate.MONTH_3:
      return new BigNumber("0.0625");
    case LockDate.MONTH_6:
      return new BigNumber("0.125");
    case LockDate.YEAR:
      return new BigNumber("0.25");
    case LockDate.TWO_YEARS:
      return new BigNumber("0.5");
    case LockDate.FOUR_YEARS:
      return new BigNumber("1");
  }
}

export function getLockDateFromMilliseconds(milliseconds: BigNumber): LockDate {
  if (milliseconds.lte(Times.WEEK_IN_MILLISECONDS)) { return LockDate.WEEK; }
  else if (milliseconds.lte(Times.MONTH_IN_MILLISECONDS)) { return LockDate.MONTH; }
  else if (milliseconds.lte(Times.MONTH_IN_MILLISECONDS.multipliedBy(3))) { return LockDate.MONTH_3; }
  else if (milliseconds.lte(Times.MONTH_IN_MILLISECONDS.multipliedBy(6))) { return LockDate.MONTH_6; }
  else if (milliseconds.lte(Times.YEAR_IN_MILLISECONDS)) { return LockDate.YEAR; }
  else if (milliseconds.lte(Times.TWO_YEARS_IN_MILLISECONDS)) { return LockDate.TWO_YEARS; }
  else { return LockDate.FOUR_YEARS; }
}

// 1 week = 0.0048 veOMM per 1 OMM staked
// 1 month = 0.0208333 veOMM per 1 OMM staked
// 3 months = 0.0625 veOMM per 1 OMM staked
// 6 months lockup = 0.125 veOMM per 1 OMM staked
// 1 year lockup = 0.25 veOMM per 1 OMM staked
// 2 year lockup = 0.5 veOMM per 1 OMM staked
// 4 year lockup = 1 veOMM per 1 OMM staked
