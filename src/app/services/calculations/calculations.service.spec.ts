import { TestBed } from '@angular/core/testing';

import { CalculationsService } from './calculations.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ReserveData} from "../../models/AllReservesData";

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
    const borrowRate = 0.0575;
    const ommPriceUSD = 2;
    const ommTokenDistribution = 1000000;
    const totalInterestOverAYear = 825000;
    const lendingBorrowingPortion = 0.1;

    const reserveData = {
      rewardPercentage: 0.4,
      borrowingPercentage: 0.5,
      exchangePrice: 1,
      totalBorrows: 5000000
    };

    expect(service.borrowOmmApyFormula(lendingBorrowingPortion, borrowRate, totalInterestOverAYear, ommTokenDistribution, ommPriceUSD,
      reserveData as ReserveData)).toBeCloseTo(2.920, 2);
  });

  it('Test supplyOmmApyFormula USDS', () => {
    const supplyRate = 0.0259;
    const ommPriceUSD = 2;
    const ommTokenDistribution = 1000000;
    const totalInterestOverAYear = 825000;
    const lendingBorrowingPortion = 0.1;

    const reserveData = {
      rewardPercentage: 0.4,
      lendingPercentage: 0.5,
      exchangePrice: 1,
      totalLiquidity: 10000000
    };

    expect(service.supplyOmmApyFormula(lendingBorrowingPortion, supplyRate, totalInterestOverAYear, ommTokenDistribution, ommPriceUSD,
      reserveData as ReserveData)).toBeCloseTo(1.46, 2);
  });
});
