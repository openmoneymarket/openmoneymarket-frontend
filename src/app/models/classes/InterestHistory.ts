import {InterestHistoryData} from "./InterestHistoryData";

export class InterestHistory {
  date: Date;
  data: InterestHistoryData;

  constructor(date: Date, data: InterestHistoryData) {
    this.date = date;
    this.data = data;
  }
}
