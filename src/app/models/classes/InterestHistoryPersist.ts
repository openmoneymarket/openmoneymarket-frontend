import {InterestHistory} from "./InterestHistory";

export class InterestHistoryPersist {
  from: string;
  to: string;
  data: InterestHistory[];

  constructor(from: string, to: string, data: InterestHistory[]) {
    this.from = from;
    this.to = to;
    this.data = data;
  }
}
