import { TestBed } from '@angular/core/testing';

import { CalculationsService } from './calculations.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ReserveData} from "../../models/classes/AllReservesData";
import {AssetTag} from "../../models/classes/Asset";
import {UserReserveData} from "../../models/classes/UserReserveData";
import BigNumber from "bignumber.js";

describe('CalculationsService', () => {
  let service: CalculationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
    });
    service = TestBed.inject(CalculationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('Test borrowOmmApyFormula USDS', () => {
    const ommPriceUSD = new BigNumber("7.34");
    const dailyBorrowRewards = new BigNumber("8000");
    const usdsPrice = new BigNumber("1");

    const reserveData = {
      exchangePrice: usdsPrice,
      totalBorrows: new BigNumber("1032.86")
    };

    expect(service.borrowOmmApyFormula(dailyBorrowRewards, ommPriceUSD, reserveData as ReserveData, AssetTag.USDS).toNumber())
      .toBeCloseTo(new BigNumber("20750.92").toNumber(), 2);
  });

  it('Test borrowOmmApyFormula ICX', () => {
    const ommPriceUSD = new BigNumber("7.34");
    const dailyBorrowRewards = new BigNumber("800");
    const icxPrice = new BigNumber("1.06");
    const borrowAmount = new BigNumber("979.39");
    const sICXRate = new BigNumber("1.0377358491");

    const reserveData = {
      exchangePrice: icxPrice,
      totalBorrows: borrowAmount,
      sICXRate
    };

    expect(service.borrowOmmApyFormula(dailyBorrowRewards, ommPriceUSD, reserveData as ReserveData, AssetTag.ICX).toNumber())
      .toBeCloseTo(new BigNumber("1989.438695").toNumber(), 2);
  });

  it('Test supplyOmmApyFormula USDS', () => {
    const ommPriceUSD = new BigNumber("7.34");
    const dailySupplyRewards = new BigNumber("8000");
    const usdsPrice = new BigNumber("1");
    const supplyAmount =  new BigNumber("2159.46");

    const reserveData = {
      exchangePrice: usdsPrice,
      totalLiquidity: supplyAmount
    };

    expect(service.supplyOmmApyFormula(dailySupplyRewards, ommPriceUSD, reserveData as ReserveData, AssetTag.USDS).toNumber())
      .toBeCloseTo(new BigNumber("9925.073861057857").toNumber(), 2);
  });

  it('Test supplyOmmApyFormula ICX', () => {
    const ommPriceUSD = new BigNumber("7.34");
    const dailySupplyRewards = new BigNumber("7200");
    const icxPrice = new BigNumber("1.06");
    const supplyAmount = new BigNumber("16037.36");
    const sICXRate = new BigNumber("1.0377358491");

    const reserveData = {
      exchangePrice: icxPrice,
      totalLiquidity: supplyAmount,
      sICXRate
    };

    expect(service.supplyOmmApyFormula(dailySupplyRewards, ommPriceUSD, reserveData as ReserveData, AssetTag.USDS).toNumber())
      .toBeCloseTo(new BigNumber("1134.7042391864052").toNumber(), 2);
  });

  it('Test userSupplyOmmRewardsFormula sICX', () => {
    const dailySupplyRewards = new BigNumber("7200");
    const supplyAmount = new BigNumber("16037.36");
    const userSupplyAmount = new BigNumber("901.74");

    const reserveData = {
      totalLiquidity: supplyAmount,
    } as ReserveData;

    const userReserveData = {
      currentOTokenBalance: userSupplyAmount,
    } as UserReserveData;

    expect(service.userSupplyOmmRewardsFormula(dailySupplyRewards, reserveData, userReserveData).toNumber())
      .toBeCloseTo(new BigNumber("404.837704").toNumber(), 2);
  });

  it('Test calculateHealthFactor', () => {
    let totalCollateralUSD = new BigNumber("100.005");
    const totalBorrowUSD = new BigNumber("50");
    const totalFeeUSD = new BigNumber("0.05");
    const ltv = new BigNumber("0.65");
    totalCollateralUSD = (totalCollateralUSD.minus(totalFeeUSD)).multipliedBy(ltv);

    const healthFactor = service.calculateHealthFactor(totalCollateralUSD, totalBorrowUSD).toNumber();

    expect(healthFactor).toBeCloseTo(new BigNumber("1.299415").toNumber(), 2);
    expect(1 / healthFactor).toBeCloseTo(new BigNumber("0.7695770789").toNumber(), 4);
  });

  it('Test calculateHealthFactor2', () => {
    let totalLiquidityUSD = new BigNumber("9686");
    const totalBorrowUSD = new BigNumber("4214");
    const totalFeeUSD = new BigNumber("1.30");
    const ltv = new BigNumber("0.65");
    totalLiquidityUSD = (totalLiquidityUSD.minus(totalFeeUSD)).multipliedBy(ltv);

    const healthFactor = service.calculateHealthFactor(totalLiquidityUSD, totalBorrowUSD).toNumber();

    expect(healthFactor).toBeCloseTo(new BigNumber(" 1.4938431419079259").toNumber(), 2);
    expect(1 / healthFactor).toBeCloseTo(new BigNumber("0.6694").toNumber(), 2);
  });

});
