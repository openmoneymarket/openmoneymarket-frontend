import {AssetTag} from "./Asset";
import BigNumber from "bignumber.js";

export class DailyRewardsAllReservesPools {
  OMMLocking: OmmLockingDailyRewards;
  daoFund: DaoFundDailyRewards;
  day: BigNumber;
  liquidity?: LiquidityDailyRewards;
  reserve: ReserveDailyRewards;
  total: BigNumber;
  workerToken?: WorkerTokenDailyRewards;

  constructor(reserve: ReserveDailyRewards, total: BigNumber, day: BigNumber, daoFund: DaoFundDailyRewards,
              OMMLocking: OmmLockingDailyRewards, liquidity?: LiquidityDailyRewards, workerTokens?: WorkerTokenDailyRewards) {
    this.liquidity = liquidity;
    this.workerToken = workerTokens;
    this.reserve = reserve;
    this.total = total;
    this.day = day;
    this.daoFund = daoFund;
    this.OMMLocking = OMMLocking;
  }

  public getClone(): DailyRewardsAllReservesPools {
    return new DailyRewardsAllReservesPools(this.reserve, this.total, this.day, this.daoFund, this.OMMLocking, this.liquidity,
      this.workerToken);
  }
}

export class OmmLockingDailyRewards {
  bOMM: BigNumber;
  total: BigNumber;

  constructor(bOMM: BigNumber, total: BigNumber) {
    this.bOMM = bOMM;
    this.total = total;
  }
}

export class DaoFundDailyRewards {
  daoFund: BigNumber;
  total: BigNumber;

  constructor(daoFund: BigNumber, total: BigNumber) {
    this.daoFund = daoFund;
    this.total = total;
  }
}

export class LiquidityDailyRewards {
  "OMM/sICX": BigNumber;
  "OMM/USDS": BigNumber;
  "OMM/IUSDC": BigNumber;
  total: BigNumber;

  constructor(ommSicx: BigNumber, ommUsds: BigNumber, ommIusdc: BigNumber, total: BigNumber) {
    this["OMM/sICX"] = ommSicx;
    this["OMM/USDS"] = ommUsds;
    this["OMM/IUSDC"] = ommIusdc;
    this.total = total;
  }

  getDailyRewardsForLp(poolTag: string): BigNumber {
    switch (poolTag) {
      case "OMM/sICX":
        return this["OMM/sICX"];
      case "OMM/USDS":
        return this["OMM/USDS"];
      case "OMM/IUSDC":
        return this["OMM/IUSDC"];
      default:
        return new BigNumber(0);
    }
  }
}

export class WorkerTokenDailyRewards {
  workerToken: BigNumber;
  total: BigNumber;

  constructor(OMM: BigNumber, total: BigNumber) {
    this.workerToken = OMM;
    this.total = total;
  }
}

export class ReserveDailyRewards {
  oUSDS: BigNumber;
  dUSDS: BigNumber;
  dICX: BigNumber;
  oICX: BigNumber;
  oIUSDC: BigNumber;
  dIUSDC: BigNumber;
  obnUSD: BigNumber;
  dbnUSD: BigNumber;
  oBALN: BigNumber;
  dBALN: BigNumber;
  oOMM: BigNumber;
  dOMM: BigNumber;
  total: BigNumber;

  constructor(oUSDS: BigNumber, dUSDS: BigNumber, dICX: BigNumber, oICX: BigNumber, oIUSDC: BigNumber, dIUSDC: BigNumber,
              obnUSD: BigNumber, dbnUSD: BigNumber, oBALN: BigNumber, dBALN: BigNumber, oOMM: BigNumber,
              dOMM: BigNumber, total: BigNumber) {
    this.oUSDS = oUSDS;
    this.dUSDS = dUSDS;
    this.dICX = dICX;
    this.oICX = oICX;
    this.oIUSDC = oIUSDC;
    this.dIUSDC = dIUSDC;
    this.obnUSD = obnUSD;
    this.dbnUSD = dbnUSD;
    this.oBALN = oBALN;
    this.dBALN = dBALN;
    this.oOMM = oOMM;
    this.dOMM = dOMM;
    this.total = total;
  }

  getDailySupplyRewardsForReserve(assetTag: AssetTag): BigNumber {
    switch (assetTag) {
      case AssetTag.ICX:
        return this.oICX;
      case AssetTag.USDS:
        return this.oUSDS;
      case AssetTag.USDC:
        return this.oIUSDC;
      case AssetTag.bnUSD:
        return this.obnUSD;
      case AssetTag.BALN:
        return this.oBALN;
      case AssetTag.OMM:
        return this.oOMM;
      default:
        return new BigNumber("0");
    }
  }

  getDailyBorrowRewardsForReserve(assetTag: AssetTag): BigNumber {
    switch (assetTag) {
      case AssetTag.ICX:
        return this.dICX;
      case AssetTag.USDS:
        return this.dUSDS;
      case AssetTag.USDC:
        return this.dIUSDC;
      case AssetTag.bnUSD:
        return this.dbnUSD;
      case AssetTag.BALN:
        return this.dBALN;
      case AssetTag.OMM:
        return this.dOMM;
      default:
        return new BigNumber("0");
    }
  }
}

// New example response
// OMMLocking:
//   bOMM: "0x21e19e0c9bab2400000"
//   total: "0x21e19e0c9bab2400000"
//
// daoFund:
//   daoFund: "0x10f0cf064dd592000000"
//   total: "0x10f0cf064dd592000000"
//
// day: "0x2f3"
// liquidity:
//   OMM/IUSDC: "0x21e19e0c9bab2404e20"
//   OMM/USDS: "0x21e19e0c9bab23fd8f0"
//   OMM/sICX: "0x21e19e0c9bab23fd8f0"
//   total: "0x65a4da25d3016c00000"
//
// reserve:
//   dBALN: "0x0"
//   dICX: "0xc328093e61ee400000"
//   dIUSDC: "0x6c6b935b8bbd400000"
//   dOMM: "0x0"
//   dUSDS: "0xa2a15d09519be00000"
//   dbnUSD: "0xd8d726b7177a800000"
//   oBALN: "0x0"
//   oICX: "0xc328093e61ee400000"
//   oIUSDC: "0x6c6b935b8bbd400000"
//   oOMM: "0x2b5e3af16b18800000"
//   oUSDS: "0x3635c9adc5dea00000"
//   obnUSD: "0x0"
//   total: "0x43c33c1937564800000"
//
// total: "0x2a5a058fc295ed000000"
// workerToken:
//   total: "0xcb49b44ba602d800000"
//   workerToken: "0xcb49b44ba602d800000"

