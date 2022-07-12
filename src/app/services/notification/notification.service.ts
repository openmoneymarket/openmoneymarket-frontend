import {Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {NotificationAction, NotificationType} from "../../models/classes/NotificationAction";
import log from "loglevel";
import {NOTIFICATION_TIMEOUT} from "../../common/constants";

declare var classie: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private activeNotificationChange: Subject<NotificationAction> = new Subject<NotificationAction>();
  activeNotificationChange$ = this.activeNotificationChange.asObservable();

  public activeNotification?: HTMLElement;
  public notificationMessageToShow?: string;

  constructor() { }

  showNewNotification(message: string, type: NotificationType = NotificationType.DEFAULT): void {
    this.activeNotificationChange.next(new NotificationAction(message, type));
  }

  showNotificationToShow(): void {
    if (this.notificationMessageToShow) {
      this.activeNotificationChange.next(new NotificationAction(this.notificationMessageToShow, NotificationType.DEFAULT));
    }
  }

  hideActiveNotification(): void {
    if (this.activeNotification) {
      log.debug(`Hiding notification: ${this.activeNotification}`);
      classie.remove( this.activeNotification, 'active' );
      this.activeNotification = undefined;
    }
  }

  showNotification(notification?: HTMLElement): void {
    if (notification) {
      log.debug(`Showing notification: ${notification}`);
      classie.add(notification, 'active');
      this.activeNotification = notification;

      setTimeout(() => this.hideActiveNotification(), NOTIFICATION_TIMEOUT);
    }
  }

  setNotificationToShow(message: string): void {
    this.notificationMessageToShow = message;
  }
}
