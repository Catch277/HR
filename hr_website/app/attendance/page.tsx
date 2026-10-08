"use client";

import {
  AlertTriangle,
  Check,
  Clock3,
  Loader2,
  MapPin,
  MessageSquareWarning,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ATTENDANCE_STATUSES,
  type Attendance,
  type AttendanceStatus,
} from "@/lib/domain/entities/Attendance";

type Branch = { id: string; name: string };

type LoadResult = {
  records: Attendance[];
  branches: Branch[];
  error: string | null;
};

type ComplaintTarget = {
  id: string;
  label: string;
  existing: string | null;
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  ON_TIME: "Đúng giờ",
  LATE: "Đi muộn",
  EARLY_LEAVE: "Về sớm",
  ABSENT: "Vắng mặt",
  INCOMPLETE: "Thiếu giờ ra",
};

const STATUS_BADGES: Record<AttendanceStatus, string> = {
  ON_TIME: "bg-emerald-50 text-emerald-700",
  LATE: "bg-amber-50 text-amber-700",
  EARLY_LEAVE: "bg-orange-50 text-orange-700",
  ABSENT: "bg-rose-50 text-rose-700",
  INCOMPLETE: "bg-slate-100 text-slate-600",
};

const ALL = "all";

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string | null): string {
  if (!value) {
    return "--:--";
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? "--:--" : timeFormatter.format(parsed);
}

/** `YYYY-MM-DD` → `DD/MM`, without going through `Date` so no timezone shifts the day. */
function formatDayDate(value: string): string {
  const [, month, day] = value.split("-");

  return `${day}/${month}`;
}

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function weekdayShort(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return WEEKDAY_SHORT[weekday];
}

/** Hours between check-in and check-out, one decimal; null while the shift is still open. */
function workedHours(record: Attendance): number | null {
  if (!record.check_in_at || !record.check_out_at) {
    return null;
  }

  const start = new Date(record.check_in_at).getTime();
  const end = new Date(record.check_out_at).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }

  return Math.round(((end - start) / 3_600_000) * 10) / 10;
}

type GeofenceVerdict = "INSIDE" | "OUTSIDE" | "UNKNOWN";

/**
 * The geofence verdict of SCRUM-22: a check-in point is valid when it lies within the branch's
 * allowed radius. A missing distance, or a branch without coordinates, cannot be judged.
 */
function geofenceVerdict(record: Attendance): GeofenceVerdict {
  if (record.check_in_distance_m === null || !record.branch) {
    return "UNKNOWN";
  }

  if (record.branch.latitude === null || record.branch.longitude === null) {
    return "UNKNOWN";
  }

  return record.check_in_distance_m <= record.branch.attendance_radius
    ? "INSIDE"
    : "OUTSIDE";
}

const GEOFENCE_LABELS: Record<GeofenceVerdict, string> = {
  INSIDE: "Trong vùng",
  OUTSIDE: "Ngoài vùng",
  UNKNOWN: "Thiếu toạ độ",
};

const GEOFENCE_BADGES: Record<GeofenceVerdict, string> = {
  INSIDE: "bg-emerald-50 text-emerald-700",
  OUTSIDE: "bg-rose-50 text-rose-700",
  UNKNOWN: "bg-slate-100 text-slate-600",
};

/** Records a manager still has to look at: outside the geofence, complained about, or unverified. */
function needsAttention(record: Attendance): boolean {
  return (
    geofenceVerdict(record) === "OUTSIDE" ||
    Boolean(record.complaint) ||
    !record.verified_at
  );
}

function initials(fullName: string | undefined): string {
  if (!fullName) {
    return "--";
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [branchFilter, setBranchFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | typeof ALL>(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [query, setQuery] = useState("");
  const [complaintTarget, setComplaintTarget] = useState<ComplaintTarget | null>(null);
  const [complaintText, setComplaintText] = useState("");
  const [savingComplaint, setSavingComplaint] = useState(false);
  const [verifyingId, setVerifyingId] = useState("");

  // Bumping the token re-runs the effect below; keeping the fetch inside the effect (instead of
  // a callback the effect calls) avoids setting state synchronously during render.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<LoadResult> {
      // Branch, status and date range are filtered by the database because a timesheet grows by
      // one row per employee per shift; only the name search is client-side.
      const params = new URLSearchParams();

      if (branchFilter !== ALL) {
        params.set("branch_id", branchFilter);
      }

      if (statusFilter !== ALL) {
        params.set("status", statusFilter);
      }

      if (startDate) {
        params.set("start_date", startDate);
      }

      if (endDate) {
        params.set("end_date", endDate);
      }

      const queryString = params.toString();

      const [attendanceResponse, branchesResponse] = await Promise.all([
        fetch(`/api/attendance${queryString ? `?${queryString}` : ""}`, {
          cache: "no-store",
        }),
        fetch("/api/branches", { cache: "no-store" }),
      ]);

      if (!attendanceResponse.ok) {
        const data = (await attendanceResponse.json().catch(() => null)) as {
          error?: string;
        } | null;

        return {
          records: [],
          branches: [],
          error: data?.error ?? "Không thể tải bảng công.",
        };
      }

      return {
        records: (await attendanceResponse.json()) as Attendance[],
        branches: branchesResponse.ok
          ? ((await branchesResponse.json()) as Branch[])
          : [],
        error: null,
      };
    }

    load()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setRecords(result.records);
        setBranches(result.branches);
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRecords([]);
        setBranches([]);
        setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [branchFilter, statusFilter, startDate, endDate, reloadToken]);

  function refresh() {
    setLoading(true);
    setPageError("");
    setReloadToken((token) => token + 1);
  }

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return records;
    }

    return records.filter((record) =>
      (record.employee?.full_name ?? "").toLowerCase().includes(keyword),
    );
  }, [records, query]);

  const onTimeCount = records.filter((record) => record.status === "ON_TIME").length;
  const lateCount = records.filter((record) => record.status === "LATE").length;
  const outsideCount = records.filter(
    (record) => geofenceVerdict(record) === "OUTSIDE",
  ).length;
  const complaintCount = records.filter((record) => Boolean(record.complaint)).length;
  const attentionCount = records.filter(needsAttention).length;
  const totalHours =
    Math.round(
      records.reduce((total, record) => total + (workedHours(record) ?? 0), 0) * 10,
    ) / 10;

  function actionErrorMessage(
    status: number,
    data: { error?: string } | null,
  ): string {
    if (status === 401) {
      return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
    }

    if (status === 403) {
      return "Tài khoản của bạn không có quyền thực hiện thao tác này (chỉ OWNER hoặc CHU).";
    }

    if (status === 404) {
      return "Không tìm thấy bản ghi chấm công.";
    }

    return data?.error ?? "Không thể thực hiện thao tác. Vui lòng thử lại.";
  }

  async function verify(record: Attendance) {
    setVerifyingId(record.id);
    setPageError("");

    try {
      const response = await fetch(`/api/attendance/${record.id}/verify`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(actionErrorMessage(response.status, data));
        return;
      }

      refresh();
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setVerifyingId("");
    }
  }

  function openComplaint(record: Attendance) {
    setComplaintTarget({
      id: record.id,
      label: record.employee?.full_name ?? `Nhân viên #${record.employee_id.slice(0, 4)}`,
      existing: record.complaint,
    });
    setComplaintText(record.complaint ?? "");
    setPageError("");
  }

  function closeComplaint() {
    setComplaintTarget(null);
    setComplaintText("");
  }

  async function submitComplaint() {
    if (!complaintTarget) {
      return;
    }

    const complaint = complaintText.trim();

    if (!complaint) {
      setPageError("Vui lòng nhập nội dung khiếu nại trước khi gửi.");
      return;
    }

    setSavingComplaint(true);
    setPageError("");

    try {
      const response = await fetch("/api/attendance/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance_id: complaintTarget.id,
          complaint,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(actionErrorMessage(response.status, data));
        return;
      }

      closeComplaint();
      refresh();
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSavingComplaint(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Vận hành ca / SCRUM-21
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảng công
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Đối soát giờ vào/ra, kiểm tra vị trí chấm công theo bán kính chi nhánh và xử lý
            khiếu nại của nhân viên.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
          Làm mới
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-blue-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Bản ghi theo bộ lọc
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
              <Clock3 size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {records.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Tổng {totalHours} giờ đã ghi nhận
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Đúng giờ
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {onTimeCount}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">
            Vào ca trong khung giờ quy định
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-amber-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Đi muộn
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <MapPin size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {lateCount}
          </p>
          <p className="mt-1 text-[10px] text-amber-600">
            Cần đối chiếu với lịch làm việc
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Cần xử lý
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {attentionCount}
          </p>
          <p className="mt-1 text-[10px] text-rose-600">
            {outsideCount} ngoài vùng · {complaintCount} khiếu nại
          </p>
        </article>
      </div>

      {pageError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          {pageError}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#F8F9FF] px-3 py-2 text-xs xl:w-72">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              aria-label="Tìm nhân viên trong bảng công"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên nhân viên"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo chi nhánh"
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0C66E4]"
            >
              <option value={ALL}>Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Từ ngày
              <input
                type="date"
                aria-label="Từ ngày"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="text-xs font-normal normal-case tracking-normal outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Đến ngày
              <input
                type="date"
                aria-label="Đến ngày"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="text-xs font-normal normal-case tracking-normal outline-none"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => setStatusFilter(ALL)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              statusFilter === ALL
                ? "bg-blue-50 text-[#0C66E4]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Tất cả trạng thái
          </button>
          {ATTENDANCE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                statusFilter === status
                  ? STATUS_BADGES[status]
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
          <p className="ml-auto text-[10px] text-slate-400">
            {filtered.length} bản ghi hiển thị
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Ngày · Ca</th>
                <th className="px-4 py-3">Giờ vào / ra</th>
                <th className="px-4 py-3 text-right">Giờ làm</th>
                <th className="px-4 py-3">Vị trí chấm công</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#0C66E4]" />
                      Đang tải bảng công...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    {records.length === 0
                      ? "Chưa có bản ghi chấm công nào trong khoảng thời gian này"
                      : "Không có bản ghi phù hợp từ khoá tìm kiếm"}
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((record) => {
                  const verdict = geofenceVerdict(record);
                  const hours = workedHours(record);

                  return (
                    <tr
                      key={record.id}
                      className="border-t border-slate-100 align-top transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#0C66E4]">
                            {initials(record.employee?.full_name)}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {record.employee?.full_name ??
                                `Nhân viên #${record.employee_id.slice(0, 4)}`}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {record.branch?.name ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-700">
                          {weekdayShort(record.work_date)}{" "}
                          {formatDayDate(record.work_date)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {record.shift?.name ?? "Ngoài lịch"}
                        </p>
                      </td>
                      <td className="px-4 py-4 tabular-nums text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} className="text-slate-400" />
                          {formatTime(record.check_in_at)} →{" "}
                          {formatTime(record.check_out_at)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-700">
                        {hours === null ? "—" : `${hours} h`}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            GEOFENCE_BADGES[verdict]
                          }`}
                        >
                          <MapPin size={12} />
                          {GEOFENCE_LABELS[verdict]}
                        </span>
                        {record.check_in_distance_m !== null && record.branch && (
                          <p className="mt-1 text-[10px] text-slate-500">
                            {record.check_in_distance_m} m / bán kính{" "}
                            {record.branch.attendance_radius} m
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              STATUS_BADGES[record.status]
                            }`}
                          >
                            {STATUS_LABELS[record.status]}
                          </span>
                          {record.verified_at && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                              title={`Xác minh lúc ${formatTime(record.verified_at)}`}
                            >
                              <ShieldCheck size={12} />
                              Đã xác minh
                            </span>
                          )}
                        </div>
                        {record.complaint && (
                          <p className="mt-1 max-w-56 text-[11px] text-rose-600">
                            {record.complaint}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {!record.verified_at && (
                            <button
                              type="button"
                              onClick={() => void verify(record)}
                              disabled={verifyingId === record.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {verifyingId === record.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              Xác nhận
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openComplaint(record)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <MessageSquareWarning size={13} />
                            {record.complaint ? "Sửa" : "Ghi"} khiếu nại
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {complaintTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Khiếu nại bảng công</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Bản ghi của {complaintTarget.label}. Nội dung khiếu nại được lưu kèm thời
                  điểm gửi để quản lý đối soát.
                </p>
              </div>
              <button type="button" aria-label="Đóng" onClick={closeComplaint}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {complaintTarget.existing && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                Khiếu nại hiện tại: {complaintTarget.existing}
              </p>
            )}

            <textarea
              value={complaintText}
              onChange={(event) => setComplaintText(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ví dụ: máy chấm công không nhận diện được khuôn mặt nên em vào ca muộn 10 phút."
              className="mt-4 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeComplaint}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void submitComplaint()}
                disabled={savingComplaint || !complaintText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0C66E4] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingComplaint && <Loader2 size={13} className="animate-spin" />}
                {savingComplaint ? "Đang lưu..." : "Lưu khiếu nại"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}