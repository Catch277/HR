"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { asArray, asArrayField } from "@/lib/asArray";
import type { Attendance } from "@/lib/domain/entities/Attendance";
import type { EmployeeStatus } from "@/lib/domain/entities/EmployeeStatus";
import type { RequestEntity } from "@/lib/domain/entities/RequestEntity";
import type {
  RevenueReportPoint,
  RevenueReportResult,
} from "@/lib/domain/entities/RevenueReport";
import { getBusinessDay } from "@/lib/usecases/businessDay";

const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const REQUEST_STATUS_TONES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

const currency = new Intl.NumberFormat("vi-VN");

function formatCurrency(value: number): string {
  return `${currency.format(Math.round(value))} ₫`;
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "chưa có kỳ so sánh";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(parsed);
}

/** `/api/employee-status` answers the snapshot the giám sát screen polls, not a bare array. */
type EmployeeStatusSnapshot = {
  updated_at: string;
  work_date: string;
  data: EmployeeStatus[];
};

type DashboardData = {
  roster: EmployeeStatus[];
  /** The business day the API answered for (Asia/Bangkok); empty when that call failed. */
  workDate: string;
  requests: RequestEntity[];
  attendance: Attendance[];
  report: RevenueReportResult | null;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    roster: [],
    workDate: "",
    requests: [],
    attendance: [],
    report: null,
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // `getBusinessDay` is a pure Asia/Bangkok helper, so the client computes the same business day the
  // API filters by; the browser/server clock would report the previous day between 00:00 and 07:00.
  const today = getBusinessDay(new Date());

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<DashboardData & { error: string | null }> {
      const [rosterResponse, requestsResponse, attendanceResponse, reportResponse] =
        await Promise.all([
          fetch("/api/employee-status", { cache: "no-store" }),
          fetch("/api/requests?status=all", { cache: "no-store" }),
          fetch(`/api/attendance?start_date=${today}`, { cache: "no-store" }),
          fetch("/api/revenue/report?period=month", { cache: "no-store" }),
        ]);

      // The dashboard is a summary, so one failing tile must not blank the page: every response is
      // read on its own and the note names the part that is missing.
      const failed = [
        rosterResponse.ok ? "" : "tình trạng nhân viên",
        requestsResponse.ok ? "" : "đơn từ",
        attendanceResponse.ok ? "" : "bảng công hôm nay",
      ].filter(Boolean);

      // `/api/employee-status` answers `{ updated_at, work_date, data }`; the other three answer bare
      // arrays. `asArray`/`asArrayField` keep a surprise body from throwing while the page renders.
      const snapshot = rosterResponse.ok
        ? ((await rosterResponse.json()) as EmployeeStatusSnapshot)
        : null;

      return {
        roster: asArrayField<EmployeeStatus>(snapshot, "data"),
        workDate: snapshot?.work_date ?? "",
        requests: requestsResponse.ok
          ? asArray<RequestEntity>(await requestsResponse.json())
          : [],
        attendance: attendanceResponse.ok
          ? asArray<Attendance>(await attendanceResponse.json())
          : [],
        report: reportResponse.ok
          ? ((await reportResponse.json()) as RevenueReportResult)
          : null,
        error:
          failed.length > 0
            ? `Không tải được: ${failed.join(", ")}.`
            : reportResponse.ok
              ? ""
              : "Không tải được báo cáo doanh thu.",
      };
    }

    load()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setData({
          roster: result.roster,
          workDate: result.workDate,
          requests: result.requests,
          attendance: result.attendance,
          report: result.report,
        });
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [today, reloadToken]);

  function refresh() {
    setLoading(true);
    setPageError("");
    setReloadToken((token) => token + 1);
  }

  const workingCount = data.roster.filter((row) => row.status === "WORKING").length;
  const pendingRequests = data.requests.filter((row) => row.status === "PENDING");
  const onTimeCount = data.attendance.filter((row) => row.status === "ON_TIME").length;
  const lateCount = data.attendance.filter((row) => row.status === "LATE").length;
  const recentRequests = data.requests.slice(0, 6);
  const series = asArray<RevenueReportPoint>(data.report?.series);
  const maxRevenue = series.reduce(
    (max, point) => Math.max(max, point.total_revenue_amount),
    0,
  );
  // Read the summary through a local: `data.report?.summary.total_revenue_amount` would throw if the
  // report body ever came back as something other than the documented object.
  const summary = data.report?.summary ?? null;
  const monthRevenue = summary?.total_revenue_amount ?? 0;
  const comparison = data.report?.comparison ?? null;
  // Prefer the business day the API answered for; the local computation is the fallback when that
  // call failed, so the header always names a date.
  const businessDate = data.workDate || today;

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Humora HR
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan</h1>
          <p className="mt-1 text-xs text-slate-500">
            Ngày làm việc {businessDate} (giờ Việt Nam) — số liệu lấy trực tiếp từ bảng công, đơn
            từ và doanh thu.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Tải lại
        </button>
      </section>

      {pageError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={16} />
          {pageError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Nhân sự trong ngày
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {data.roster.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {workingCount} đang trong ca
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Doanh thu tháng
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CircleDollarSign size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {formatCurrency(monthRevenue)}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-[10px] ${
              (comparison?.percentage_change ?? 0) < 0
                ? "text-rose-600"
                : "text-emerald-600"
            }`}
          >
            <TrendingUp size={11} />
            {formatPercent(comparison?.percentage_change ?? null)} so với kỳ trước
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Đơn chờ duyệt
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarDays size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {pendingRequests.length}
          </p>
          <p className="mt-1 text-[10px] text-amber-600">
            trên tổng {data.requests.length} đơn
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Chấm công hôm nay
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarCheck size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {data.attendance.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {onTimeCount} đúng giờ · <span className="text-amber-600">{lateCount} đi muộn</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Đơn từ gần đây</h2>
            <a
              href="/requests"
              className="text-[11px] font-semibold text-[#0C66E4] hover:underline"
            >
              Xem tất cả
            </a>
          </div>

          {recentRequests.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-12 text-center text-xs text-slate-400">
              Chưa có đơn nào được gửi.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recentRequests.map((request) => (
                <li key={request.id} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-[#0C66E4]">
                    {(request.requester?.full_name ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {request.title ?? request.request_type}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {request.requester?.full_name ?? "Không xem được tên"} ·{" "}
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
                      REQUEST_STATUS_TONES[request.status] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {REQUEST_STATUS_LABELS[request.status] ?? request.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Doanh thu theo ngày (tháng này)
            </h2>
            <span className="text-[11px] font-semibold tabular-nums text-slate-600">
              {formatCurrency(monthRevenue)}
            </span>
          </div>

          {series.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-12 text-center text-xs text-slate-400">
              Chưa có ca nào được chốt trong tháng này.
            </p>
          ) : (
            <>
              <div className="mt-4 flex h-40 items-end gap-1">
                {series.map((point) => {
                  const height =
                    maxRevenue > 0
                      ? Math.max(
                          2,
                          Math.round(
                            (point.total_revenue_amount / maxRevenue) * 100,
                          ),
                        )
                      : 2;

                  return (
                    <div
                      key={point.bucket_start}
                      title={`${point.bucket_start}: ${formatCurrency(point.total_revenue_amount)} (${point.record_count} ca)`}
                      className="flex-1 rounded-t bg-[#0C66E4]/80 transition-colors hover:bg-[#0C66E4]"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>{series[0]?.bucket_start}</span>
                <span>
                  {series.length} ngày có doanh thu ·{" "}
                  {summary?.record_count ?? 0} ca đã chốt
                </span>
                <span>{series[series.length - 1]?.bucket_start}</span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
