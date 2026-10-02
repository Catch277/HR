import type { PaginatedNotifications } from "@/lib/domain/entities/Notification";
import type { INotificationRepository } from "@/lib/domain/repositories/INotificationRepository";

export class GetUserNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedNotifications> {
    return this.notificationRepository.findByUserId(userId, page, pageSize);
  }
}
