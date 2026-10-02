"use client";

import {
  AlarmClock,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Lightbulb,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState } from "react";

const mockNotifications = [
  {
    id: 1,
    title: "Thay đổi ca làm việc ngày mai",
    category: "Ca làm việc",
    message:
      "Bạn đã được phân công hỗ trợ ca tối từ 18:00 – 23:00 tại chi nhánh Quận 1 thay thế cho nhân viên vắng đột xuất.",
    time: "25 phút trước",
    read: false,
    type: "schedule",
    action: "Xem lịch chi tiết",
  },
  {
    id: 2,
    title: "Đơn xin nghỉ phép đã được duyệt",
    category: "Đơn từ",
    message:
      "Quản lý Nguyễn Thu Trang đã phê duyệt đơn nghỉ phép #HR-1049 (Kỳ nghỉ phép năm: 2 ngày, 28/10 – 29/10).",
    time: "2 giờ trước",
    read: false,
    type: "request",
    action: "Tải giấy phép số",
  },
  {
    id: 3,
    title: "Cảnh báo chênh lệch quỹ tại ca tối",
    category: "Cảnh báo kiểm quỹ",
    message:
      "Bàn giao két ca tối ngày 24/10 tại Quầy POS-02 ghi nhận lệch thực tế: -150.000 ₫ so với doanh thu phần mềm. Vui lòng đối soát lại biên bản kiểm đếm.",
    time: "2 ngày trước",
    read: false,
    type: "alert",
    action: "Đối soát biên bản ngay",
  },
  {
    id: 4,
    title: "Bảng lương T10/2026 đã được lập",
    category: "Kế toán / Lương",
    message:
      "Phiếu lương chi tiết kỳ 2 đã sẵn sàng để đối soát. Hạn chót gửi khiếu nại định mức giờ công và thưởng KPI là 17:00 ngày 30/10/2026.",
    time: "1 ngày trước",
    read: true,
    type: "salary",
    action: "Tra cứu phiếu lương",
  },
  {
    id: 5,
    title: "Xác nhận tăng ca ngày Chủ Nhật",
    category: "Tăng ca",
    message:
      "Bạn đã đăng ký thành công 3,5 giờ tăng ca (hệ số 2.0) trong sự kiện Flash Sale cuối tuần tại Chi nhánh Q.1.",
    time: "3 ngày trước",
    read: true,
    type: "schedule",
    action: "Chi tiết bảng chấm công",
  },
  {
    id: 6,
    title: "Hướng dẫn quy trình vệ sinh & đóng quầy mới",
    category: "Nội bộ",
    message:
      "Quy chuẩn 55 kiểm kê tồn mặt và bàn giao ca đêm mới sẽ được áp dụng chính thức từ ngày 01/11/2026.",
    time: "5 ngày trước",
    read: true,
    type: "request",
    action: "Tải cẩm nang quy trình",
  },
];

const notificationTabs = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "schedule", label: "Lịch làm việc" },
  { id: "salary", label: "Lương & Thưởng" },
  { id: "request", label: "Đơn từ xét duyệt" },
  { id: "alert", label: "Cảnh báo" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    schedule: true,
    salary: true,
    requests: false,
  });

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  };

  const markAsRead = (id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Trung tâm điều hành thông báo / SCRUM-48
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Trung tâm Thông báo Hệ thống
          </h1>
          <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-800">
            {notifications.filter((notification) => !notification.read).length}{" "}
            thông báo chưa đọc
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#0C66E4] transition-colors hover:bg-blue-50"
          >
            <Check size={14} /> Đánh dấu tất cả đã đọc
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Cài đặt thông báo"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <label className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-[#F8F9FF] px-3 py-2">
                <Bell size={14} className="text-slate-400" />
                <input
                  aria-label="Tìm thông báo"
                  className="w-full bg-transparent text-[10px] outline-none placeholder:text-slate-400"
                  placeholder="Tìm theo tiêu đề, mã ca, số phiếu..."
                />
              </label>
              <div
                className="flex flex-1 gap-1 overflow-x-auto"
                role="tablist"
                aria-label="Phân loại thông báo"
              >
                {notificationTabs.map((tab) => {
                  const count =
                    tab.id === "all"
                      ? notifications.length
                      : tab.id === "unread"
                        ? notifications.filter(
                            (notification) => !notification.read,
                          ).length
                        : notifications.filter(
                            (notification) => notification.type === tab.id,
                          ).length;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 rounded-md px-2.5 py-2 text-[9px] font-medium transition-colors ${activeTab === tab.id ? "bg-[#0C66E4] text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {tab.label}{" "}
                      <span
                        className={
                          activeTab === tab.id
                            ? "ml-0.5 text-blue-100"
                            : "ml-0.5 text-slate-400"
                        }
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const Icon =
                notification.type === "schedule"
                  ? CalendarDays
                  : notification.type === "salary"
                    ? CircleDollarSign
                    : notification.type === "alert"
                      ? ShieldAlert
                      : FileText;
              const isAlert = notification.type === "alert";
              return (
                <li
                  key={notification.id}
                  className={`relative flex gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 ${!notification.read ? "bg-blue-50/35" : ""} ${isAlert && !notification.read ? "border-l-[3px] border-l-rose-600" : ""}`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isAlert ? "bg-rose-100 text-rose-700" : notification.read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-[#0C66E4]"}`}
                  >
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-semibold ${isAlert ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-800"}`}
                      >
                        {notification.category}
                      </span>
                      <h2
                        className={`text-xs font-bold ${isAlert ? "text-rose-800" : "text-slate-900"}`}
                      >
                        {notification.title}
                      </h2>
                    </div>
                    <p
                      className={`mt-1.5 text-[10px] leading-relaxed ${isAlert ? "text-rose-800" : "text-slate-600"}`}
                    >
                      {notification.message}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-[9px] text-slate-400">
                        <AlarmClock size={11} />
                        {notification.time}
                      </span>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`rounded-md px-2 py-1 text-[9px] font-semibold transition-colors ${isAlert ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-blue-50 text-[#0C66E4] hover:bg-blue-100"}`}
                      >
                        {notification.action}
                      </button>
                      {notification.type === "schedule" && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600 hover:bg-slate-200"
                        >
                          Phản hồi quản lý
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between">
                    <span className="whitespace-nowrap text-[9px] text-slate-400">
                      {notification.time}
                    </span>
                    {!notification.read && (
                      <span
                        className="mt-3 h-2 w-2 rounded-full bg-[#0C66E4]"
                        aria-label="Chưa đọc"
                      />
                    )}
                  </div>
                </li>
              );
            })}
            {filteredNotifications.length === 0 && (
              <li className="px-5 py-12 text-center text-xs text-slate-500">
                Không có thông báo trong mục này.
              </li>
            )}
          </ul>
          <div className="border-t border-slate-100 px-4 py-3 text-center">
            <button className="text-[10px] font-semibold text-[#0C66E4] hover:underline">
              Xem các thông báo cũ hơn{" "}
              <ChevronRight size={12} className="ml-1 inline" />
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Tình trạng tiếp nhận
              </h2>
              <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Kênh AI trực tuyến
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0C66E4]">
                NT
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Nguyễn Thu Trang
                </p>
                <p className="mt-0.5 truncate text-[9px] text-slate-500">
                  Trưởng nhóm Điều phối Nhân sự
                </p>
                <p className="mt-0.5 text-[9px] font-medium text-[#0C66E4]">
                  Khu vực: TP. Hồ Chí Minh
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-[#F3F6FC] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold text-slate-700">
                  Mật độ thông báo tuần
                </p>
                <span className="text-[9px] text-slate-500">38 sự kiện</span>
              </div>
              <div className="mt-3 flex h-16 items-end justify-between gap-1.5">
                {[
                  { day: "T2", height: 42 },
                  { day: "T3", height: 58 },
                  { day: "T4", height: 36 },
                  { day: "T5", height: 82 },
                  { day: "T6", height: 50 },
                  { day: "T7", height: 28 },
                  { day: "CN", height: 18 },
                ].map((item) => (
                  <div
                    key={item.day}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <div
                      className={`w-full max-w-5 rounded-t-sm ${item.day === "T5" ? "bg-[#0C66E4]" : "bg-blue-200"}`}
                      style={{ height: `${item.height}%` }}
                    />
                    <span
                      className={`text-[8px] ${item.day === "T5" ? "font-bold text-[#0C66E4]" : "text-slate-400"}`}
                    >
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Lightbulb size={15} className="text-amber-500" />
              Lời khuyên tác vụ
            </h2>
            <div className="mt-3 rounded-lg bg-emerald-50/80 p-3">
              <p className="text-[10px] font-semibold leading-relaxed text-emerald-900">
                Đơn xin phép và cảnh báo quỹ đang cần được ưu tiên.
              </p>
              <p className="mt-1.5 text-[9px] leading-relaxed text-slate-600">
                Có 8 đơn chờ duyệt và một thông báo chênh lệch cần đối soát. Xử
                lý trước khi kết thúc ca để tránh quá hạn.
              </p>
              <button className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-[#0C66E4]">
                Xem hướng dẫn xử lý <ChevronRight size={11} />
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
              <ShieldAlert
                size={14}
                className="mt-0.5 shrink-0 text-amber-700"
              />
              <p className="text-[9px] leading-relaxed text-slate-600">
                <b className="text-slate-800">Nhắc lịch:</b> Bảng lương tháng 10
                cần được đối soát trước 17:00 ngày 30/10.
              </p>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200/80 bg-[#F3F6FC] p-3">
            <p className="text-[9px] leading-relaxed text-slate-500">
              <Bell size={11} className="mr-1 inline text-[#0C66E4]" />
              Thông báo được đồng bộ tự động từ lịch làm việc, hệ thống đơn từ
              và đối soát doanh thu.
            </p>
          </section>
        </aside>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-settings"
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id="notification-settings"
                className="flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <Settings size={16} className="text-[#0C66E4]" />
                Cài đặt thông báo
              </h2>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Đóng cài đặt"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {(
                [
                  {
                    key: "schedule",
                    title: "Lịch làm việc",
                    detail: "Nhận thông báo khi có thay đổi lịch",
                    icon: CalendarDays,
                  },
                  {
                    key: "salary",
                    title: "Lương & thưởng",
                    detail: "Nhận thông báo phiếu lương hàng tháng",
                    icon: CircleDollarSign,
                  },
                  {
                    key: "requests",
                    title: "Đơn từ xét duyệt",
                    detail: "Nhận thông báo khi có đơn cần xử lý",
                    icon: FileText,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const enabled = settings[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[9px] text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={enabled}
                      aria-label={item.title}
                      onClick={() => toggleSetting(item.key)}
                      className={`h-6 w-11 shrink-0 rounded-full p-1 transition-colors ${enabled ? "bg-[#0C66E4]" : "bg-slate-300"}`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-[#F8F9FF] px-5 py-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg bg-[#0C66E4] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
