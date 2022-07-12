export class NotificationAction {
  message = "";
  type: NotificationType = NotificationType.DEFAULT;


  constructor(message: string, type: NotificationType) {
    this.message = message;
    this.type = type;
  }
}

export enum NotificationType {
  DEFAULT
}
