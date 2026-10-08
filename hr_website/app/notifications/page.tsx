"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Loader2,
  RefreshCw,
  Settings2,
  X,
} from "lucide-react";

import { asArray, asArrayField } from "@/lib/asArray";
import type {
  Notification,
  PaginatedNotifications,
} from "@/lib/domain/entities/Notification";
import type { NotificationSetting } from "@/lib/domain/entities/NotificationSetting";

const PAGE_SIZE = 20;

const CHANNEL_LABELS: Record<string, string> = {
  in_app: "Trong ứng dụng",
  email: "Email",
  push: "Thông báo đẩy (mobile)",
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  REQUEST: FileText,
  REVENUE: CircleDollarSign,
  ATTENDANCE: ClipboardCheck,
};

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(parsed);
}

function statusMessage(status: number, serverMessage?: string): string {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 404) {
    return "Thông báo này không còn tồn tại.";
  }

  return serverMessage ?? "Không thực hiện được thao tác. Vui lòng thử lại.";
}

type ChannelToggle = { channel: string; enabled: boolean };

/** The channels the settings drawer always shows, whether or not a row exists yet. */
const KNOWN_CHANNELS = ["in_app", "email", "push"];

function mergeChannels(rows: NotificationSetting[]): ChannelToggle[] {
  return KNOWN_CHANNELS.map((channel) => ({
    channel,
    enabled: rows.find((row) => row.channel === channel)?.enabled ?? false,
  }));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [channels, setChannels] = useState<ChannelToggle[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<{
      data: Notification[];
      total: number;
      error: string | null;
    }> {
      const response = await fetch(
        `/api/notifications?page=${page}&page_size=${PAGE_SIZE}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        return {
          data: [],
          total: 0,
          error: statusMessage(response.status, data?.error),
        };
      }

      // The page endpoint answers `{ data, total, page, page_size }`; read it defensively so a shape
      // change shows an empty state instead of crashing the feed.
      const payload = (await response.json()) as PaginatedNotifications;

      return {
        data: asArrayField<Notification>(payload, "data"),
        total: typeof payload.total === "number" ? payload.total : 0,
        error: null,
      };
    }

    load()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setNotifications(result.data);
        setTotal(result.total);
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setNotifications([]);
        setTotal(0);
        setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  function refresh() {
    setLoading(true);
    setPageError("");
    setReloadToken((token) => token + 1);
  }

  function openSettings() {
    setSettingsOpen(true);
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSaved(false);
  }

  // The drawer loads its own data on open; the async body keeps setState out of the effect body.
  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    let cancelled = false;

    async function load(): Promise<{
      settings: NotificationSetting[];
      error: string | null;
    }> {
      const response = await fetch("/api/notifications/settings", {
        cache: "no-store",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        return {
          settings: [],
          error: statusMessage(response.status, data?.error),
        };
      }

      const data = (await response.json()) as NotificationSetting[];

      return { settings: asArray<NotificationSetting>(data), error: null };
    }

    load()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setChannels(mergeChannels(result.settings));
        setSettingsError(result.error ?? "");
        setSettingsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSettingsError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setSettingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [settingsOpen]);

  async function markRead(notification: Notification) {
    if (notification.is_read || busyId) {
      return;
    }

    setBusyId(notification.id);
    setPageError("");

    try {
      const response = await fetch(
        `/api/notifications/${notification.id}/read`,
        { method: "PATCH" },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(statusMessage(response.status, data?.error));
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((item) => !item.is_read);

    if (markingAll || unread.length === 0) {
      return;
    }

    setMarkingAll(true);
    setPageError("");

    try {
      // There is no bulk endpoint, so this is one request per unread notification of the current
      // page. Marking read is idempotent, so a retry is harmless.
      const responses = await Promise.all(
        unread.map((item) =>
          fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" }),
        ),
      );
      const failed = responses.filter((response) => !response.ok).length;

      if (failed > 0) {
        setPageError(
          `Chỉ đánh dấu được ${unread.length - failed}/${unread.length} thông báo. Vui lòng thử lại.`,
        );
      }

      refresh();
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function toggleChannel(notificationChannel: string, enabled: boolean) {
    const next = channels.map((item) =>
      item.channel === notificationChannel ? { ...item, enabled } : item,
    );

    setChannels(next);
    setSettingsError("");
    setSettingsSaved(false);

    try {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: next }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setSettingsError(statusMessage(response.status, data?.error));
        return;
      }

      setSettingsSaved(true);
    } catch {
      setSettingsError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const visible = notifications.filter((item) =>
    tab === "all" ? true : tab === "unread" ? !item.is_read : item.is_read,
  );
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-surface p-5 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Hệ thống / SCRUM-48
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thông báo</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Thông báo trong ứng dụng của chính tài khoản đang đăng nhập: đơn từ, doanh thu và chấm
            công. Tổng {total} thông báo, trong đó {unreadCount} chưa đọc trên trang này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Tải lại
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings2 size={14} /> Cài đặt kênh nhận
          </button>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Đánh dấu trang này đã đọc
          </button>
        </div>
      </section>

      {pageError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={16} />
          {pageError}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          {(
            [
              { value: "all", label: "Tất cả" },
              { value: "unread", label: "Chưa đọc" },
              { value: "read", label: "Đã đọc" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTab(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === option.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-500">
            Trang {page}/{lastPage} · bộ lọc chỉ áp dụng trên trang hiện tại
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Đang tải thông báo...
          </div>
        ) : visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-xs text-slate-400">
            {notifications.length === 0
              ? "Chưa có thông báo nào. Thông báo được tạo khi có đơn từ cần duyệt, ca được chốt doanh thu hoặc chấm công cần xác minh."
              : "Không có thông báo nào khớp với bộ lọc này trên trang hiện tại."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((item) => {
              const Icon = TYPE_ICONS[item.type] ?? Bell;

              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${
                    item.is_read ? "" : "bg-blue-50/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      item.is_read
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-50 text-primary"
                    }`}
                  >
                    <Icon size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-xs text-slate-600">
                      {item.body}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDateTime(item.created_at)} · {item.type}
                    </p>
                  </div>

                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={() => void markRead(item)}
                      disabled={busyId === item.id}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {busyId === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Đã đọc
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-[10px] text-slate-500">
            {total === 0
              ? "Không có thông báo"
              : `Hiển thị ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + notifications.length} trên tổng ${total}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={page <= 1 || loading}
              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              ‹ Trước
            </button>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.min(lastPage, current + 1));
              }}
              disabled={page >= lastPage || loading}
              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Sau ›
            </button>
          </div>
        </div>
      </section>

      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt kênh nhận thông báo"
        >
          <div className="flex h-full w-full max-w-sm flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kênh nhận thông báo</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Áp dụng cho tài khoản đang đăng nhập.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {settingsLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải cài đặt...
                </div>
              ) : (
                channels.map((item) => (
                  <label
                    key={item.channel}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <span>
                      <span className="block text-xs font-semibold text-slate-800">
                        {CHANNEL_LABELS[item.channel] ?? item.channel}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        Bật/tắt sẽ tạo hoặc cập nhật cấu hình cho kênh này.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) =>
                        void toggleChannel(item.channel, event.target.checked)
                      }
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))
              )}

              {settingsError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  <AlertTriangle size={14} />
                  {settingsError}
                </div>
              )}

              {settingsSaved && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                  <Check size={14} />
                  Đã lưu cài đặt kênh nhận.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-500">
              Thay đổi được lưu ngay khi gạt công tắc. Các kênh này quyết định nơi hệ thống gửi
              thông báo cho bạn.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}