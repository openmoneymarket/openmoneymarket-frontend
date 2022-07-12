import BigNumber from "bignumber.js";

export class AllAssetDistPercentages {
  OMMLocking: OmmLockingDistPercent;
  daoFund: DaoFundDistPercent;
  liquidity?: LiquidityDistPercent;
  staking?: StakingDistPercent;
  reserve: ReserveAllAsset;
  total: BigNumber;

  constructor(reserve: ReserveAllAsset, total: BigNumber, OMMLocking: OmmLockingDistPercent, daoFund: DaoFundDistPercent,
              liquidity?: LiquidityDistPercent, staking?: StakingDistPercent) {
    this.OMMLocking = OMMLocking;
    this.daoFund = daoFund;
    this.liquidity = liquidity;
    this.staking = staking;
    this.reserve = reserve;
    this.total = total;
  }

  public getClone(): AllAssetDistPercentages {
    return new AllAssetDistPercentages(this.reserve, this.total, this.OMMLocking, this.daoFund, this.liquidity, this.staking);
  }
}

export class OmmLockingDistPercent {
  bOMM: BigNumber;
  total: BigNumber;

  constructor(bOMM: BigNumber, total: BigNumber) {
    this.bOMM = bOMM;
    this.total = total;
  }
}

export class DaoFundDistPercent {
  daoFund: BigNumber;
  total: BigNumber;

  constructor(daoFund: BigNumber, total: BigNumber) {
    this.daoFund = daoFund;
    this.total = total;
  }
}

export class LiquidityDistPercent {
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

export class StakingDistPercent {
  OMM: BigNumber;
  total: BigNumber;

  constructor(OMM: BigNumber, total: BigNumber) {
    this.OMM = OMM;
    this.total = total;
  }
}

export class ReserveAllAsset {
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
//   bOMM: "0xb1a2bc2ec50000"
//   total: "0xb1a2bc2ec50000"
//
// daoFund:
//   daoFund: "0x58d15e176280000"
//   total: "0x58d15e176280000"
//
// liquidity:
//   OMM/IUSDC: "0xb1a2bc2ec50000"
//   OMM/USDS: "0xb1a2bc2ec50000"
//   OMM/sICX: "0xb1a2bc2ec50000"
//   total: "0x214e8348c4f0000"
//
// reserve:
//   dBALN: "0x0"
//   dICX: "0x3ff2e795f50000"
//   dIUSDC: "0x2386f26fc10000"
//   dOMM: "0x0"
//   dUSDS: "0x354a6ba7a18000"
//   dbnUSD: "0x470de4df820000"
//   oBALN: "0x0"
//   oICX: "0x3ff2e795f50000"
//   oIUSDC: "0x2386f26fc10000"
//   oOMM: "0xe35fa931a0000"
//   oUSDS: "0x11c37937e08000"
//   obnUSD: "0x0"
//   total: "0x16345785d8a0000"
//
// total: "0xde0b6b3a7640000"
// workerToken:
//   total: "0x429d069189e0000"
//   workerToken: "0x429d069189e0000"


