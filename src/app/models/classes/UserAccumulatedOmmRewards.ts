import BigNumber from "bignumber.js";

export class UserAccumulatedOmmRewards {
  liquidity?: Liquidity;
  OMMLocking?: Locking;
  reserve: Reserve;
  total: BigNumber;
  now: BigNumber;

  constructor(reserve: Reserve, total: BigNumber, now: BigNumber, liquidity?: Liquidity, OMMLocking?: Locking) {
    this.liquidity = liquidity;
    this.OMMLocking = OMMLocking;
    this.reserve = reserve;
    this.total = total;
    this.now = now;
  }

  public getClone(): UserAccumulatedOmmRewards {
    return new UserAccumulatedOmmRewards(this.reserve, this.total, this.now, this.liquidity, this.OMMLocking);
  }
}

export class Liquidity {
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
}

export class Locking {
  bOMM: BigNumber;
  total: BigNumber;

  constructor(OMM: BigNumber, total: BigNumber) {
    this.bOMM = OMM;
    this.total = total;
  }
}

export class Reserve {
  oUSDS: BigNumber;
  dUSDS: BigNumber;
  dICX: BigNumber;
  oICX: BigNumber;
  oIUSDC: BigNumber;
  dIUSDC: BigNumber;
  total: BigNumber;

  constructor(oUSDS: BigNumber, dUSDS: BigNumber, dICX: BigNumber, oICX: BigNumber, oIUSDC: BigNumber, dIUSDC: BigNumber,
              total: BigNumber) {
    this.oUSDS = oUSDS;
    this.dUSDS = dUSDS;
    this.dICX = dICX;
    this.oICX = oICX;
    this.oIUSDC = oIUSDC;
    this.dIUSDC = dIUSDC;
    this.total = total;
  }
}

// Example response
// OMMLocking:
//   bOMM: "0x0"
//   total: "0x0"
//
// liquidity:
//   OMM/IUSDC: "0x0"
//   OMM/USDS: "0x0"
//   OMM/sICX: "0x0"
//   total: "0x0"
//
// now: "0x622bc44b"
// reserve:
//   dBALN: "0x0"
//   dICX: "0x0"
//   dIUSDC: "0x0"
//   dOMM: "0x0"
//   dUSDS: "0x0"
//   dbnUSD: "0x0"
//   oBALN: "0x0"
//   oICX: "0x0"
//   oIUSDC: "0x0"
//   oOMM: "0x0"
//   oUSDS: "0x0"
//   obnUSD: "0x0"
//   total: "0x0"
//
// total: "0x0"

