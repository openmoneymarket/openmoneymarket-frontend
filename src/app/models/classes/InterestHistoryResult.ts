import {Paginate} from "../Interfaces/Paginate";
import {InterestHistory} from "./InterestHistory";

export class InterestHistoryResult implements Paginate {
  docs: InterestHistory[];
  limit: number;
  page: number;
  pages: number;
  total: number;

  constructor(docs: InterestHistory[], limit: number, page: number, pages: number, total: number) {
    this.docs = docs;
    this.limit = limit;
    this.page = page;
    this.pages = pages;
    this.total = total;
  }
}
