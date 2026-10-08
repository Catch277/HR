import type { PaginatedNotifications } from "@/lib/domain/entities/Notification";
import type {
  NotificationSetting,
  UpdateNotificationSettingInput,
} from "@/lib/domain/entities/NotificationSetting";
import { NotificationNotFoundError } from "@/lib/domain/errors/NotificationNotFoundError";
import type { INotificationRepository } from "@/lib/domain/repositories/INotificationRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

export class SupabaseNotificationRepository
  implements INotificationRepository
{
  async findByUserId(
    userId: string,
    page: number,
    pageSize: number,
    unreadOnly = false,
  ): Promise<PaginatedNotifications> {
    const supabase = await createSupabaseServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("notifications")
      .select(
        "id, user_id, title, body, type, is_read, related_entity_type, related_entity_id, created_at",
        { count: "exact" },
      )
      .eq("user_id", userId);

    if (unreadOnly) {
      // Counting only the unread rows is what makes the header badge exact: with `unread=true`
      // and `page_size=1`, `count` is the unread total rather than the newest page's tally.
      query = query.eq("is_read", false);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Unable to load notifications: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      page_size: pageSize,
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to mark notification as read: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotificationNotFoundError();
    }
  }

  async getSettings(userId: string): Promise<NotificationSetting[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("notification_settings")
      .select("id, user_id, channel, enabled, updated_at")
      .eq("user_id", userId)
      .order("channel", { ascending: true });

    if (error) {
      throw new Error(
        `Unable to load notification settings: ${error.message}`,
      );
    }

    return data ?? [];
  }

  async upsertSettings(
    userId: string,
    settings: UpdateNotificationSettingInput[],
  ): Promise<NotificationSetting[]> {
    const supabase = await createSupabaseServerClient();

    const rows = settings.map((s) => ({
      user_id: userId,
      channel: s.channel,
      enabled: s.enabled,
    }));

    const { data, error } = await supabase
      .from("notification_settings")
      .upsert(rows, { onConflict: "user_id,channel" })
      .select("id, user_id, channel, enabled, updated_at");

    if (error) {
      throw new Error(
        `Unable to update notification settings: ${error.message}`,
      );
    }

    return data ?? [];
  }
}
