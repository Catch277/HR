import type { PaginatedNotifications } from "@/lib/domain/entities/Notification";
import type {
  NotificationSetting,
  UpdateNotificationSettingInput,
} from "@/lib/domain/entities/NotificationSetting";

export interface INotificationRepository {
  findByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedNotifications>;

  markAsRead(id: string, userId: string): Promise<void>;

  getSettings(userId: string): Promise<NotificationSetting[]>;

  upsertSettings(
    userId: string,
    settings: UpdateNotificationSettingInput[],
  ): Promise<NotificationSetting[]>;
}
