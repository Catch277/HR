import type { PaginatedNotifications } from "@/lib/domain/entities/Notification";
import type { INotificationRepository } from "@/lib/domain/repositories/INotificationRepository";

export class GetUserNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  /**
   * @param unreadOnly Khi `true`, chỉ đếm/trả về thông báo chưa đọc. Header dùng
   *   `pageSize = 1` + cờ này để lấy con số chưa đọc chính xác cho badge trên chuông.
   */
  async execute(
    userId: string,
    page: number,
    pageSize: number,
    unreadOnly = false,
  ): Promise<PaginatedNotifications> {
    return this.notificationRepository.findByUserId(
      userId,
      page,
      pageSize,
      unreadOnly,
    );
  }
}
