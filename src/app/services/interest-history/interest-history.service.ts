import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {InterestHistoryResult} from "../../models/classes/InterestHistoryResult";
import {InterestHistoryRecord} from "../../models/classes/InterestHistoryRecord";
import {environment} from "../../../environments/environment";
import {LocalStorageService} from "../local-storage/local-storage.service";
import log from "loglevel";
import {InterestHistory} from "../../models/classes/InterestHistory";
import {InterestHistoryPersist} from "../../models/classes/InterestHistoryPersist";
import {Utils} from "../../common/utils";

@Injectable({
  providedIn: 'root'
})
export class InterestHistoryService {

  private interestHistoryKey = "int.hist";

  constructor(private httpClient: HttpClient,
              private localStorageService: LocalStorageService) { }

  // if updateData = true existing interest history is updated with new entries
  persistInterestHistoryInLocalStorage(interestHistory: InterestHistory[], updateData = false): void {
    if (interestHistory.length > 0) {
      if (updateData) {
        // interestHistory contains array of new dates from the last existing ones
        const interestHistoryPersisted = this.getInterestHistoryFromLocalStorage();
        const interestHistoryOld = interestHistoryPersisted!.data;

        interestHistory.forEach(el => {
          // push new date on end
          interestHistoryOld.push(el);
        });

        interestHistory = interestHistoryOld;
        log.debug(`After interest history data = `, interestHistory);
      }

      const interestHistoryPersist = new InterestHistoryPersist(
        Utils.dateToDateOnlyIsoString(interestHistory[0].date),
        Utils.dateToDateOnlyIsoString(interestHistory[interestHistory.length - 1].date),
        interestHistory
      );

      this.localStorageService.set(this.interestHistoryKey, interestHistoryPersist);
    }
  }

  getInterestHistoryFromLocalStorage(): InterestHistoryPersist | undefined {
    try {
      const interestHistory: InterestHistoryPersist | undefined = this.localStorageService.get(this.interestHistoryKey);
      log.debug("getInterestHistoryFromLocalStorage:");
      log.debug(interestHistory);
      return interestHistory !== undefined ? new InterestHistoryPersist(
        interestHistory.from,
        interestHistory.to,
        interestHistory.data.map(el => new InterestHistory(
          new Date(el.date),
          el.data
        )
        )
      ) : undefined;
    } catch (e) {
      log.error("Error in getInterestHistoryFromLocalStorage...");
      log.error(e);
      return undefined;
    }
  }

  public getInterestHistory(): Promise<InterestHistoryResult> {
    return this.httpClient.get<InterestHistoryResult>(environment.ommRestApi + "/interest-history").toPromise();
  }

  public getInterestHistoryFromTo(from: string, to: string): Promise<InterestHistoryResult> {
    return this.httpClient.get<InterestHistoryResult>(environment.ommRestApi + "/interest-history/dates/between", {
      params: new HttpParams({
        fromObject: { from, to }
      })
    }).toPromise();
  }

  public getAverageInterests(interestHistoryRecord: InterestHistoryRecord[]): {supplyApy: number, borrowApr: number} {
    let supplyApySum = 0;
    let borrowAprSum = 0;
    let counter = 0;

    interestHistoryRecord.forEach(record => {
      counter++;
      supplyApySum += record.supplyApy;
      borrowAprSum += record.borrowApr;
    });

    return { supplyApy: supplyApySum / counter, borrowApr: borrowAprSum / counter};
  }
}
