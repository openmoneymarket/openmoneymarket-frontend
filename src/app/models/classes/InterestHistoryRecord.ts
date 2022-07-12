export class InterestHistoryRecord {
  supplyApy: number;
  borrowApr: number;

  constructor(time: Date, supplyApy: number, borrowApr: number) {
    this.supplyApy = supplyApy;
    this.borrowApr = borrowApr;
  }
}
