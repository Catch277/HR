"use client";

import { Check, Clock3, Loader2, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RequestEntity = {
  id: string;
  branch_id: string;
  user_id: string;
  request_type: string;
  title: string | null;
  content: string | null;
  status: string;
  reject_reason: string | null;
  approver_id: string | null;
  created_at: string;
  updated_at: string;
  requester: { id: string; full_name: string } | null;
};

type Branch = { id: string; name: string };

type LoadResult = {
  requests: RequestEntity[];
  branches: Branch[];
  error: string | null;
};

type RejectTarget = { id: string; label: string };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
];

/** The reasons the team actually uses, offered as one-tap pills in the reject dialog. */
const REJECT_REASONS = [
  "Trùng lịch",
  "Hết phép năm có lương",
  "Nhân sự ca chưa đủ",
  "Nộp đơn muộn so với quy định",
];

const ALL = "all";

// Timestamps are stored and served in UTC while the business timezone is Asia/Bangkok, so the
// formatter pins the zone instead of using the browser default (see AGENTS.md).
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Bangkok",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? "—" : dateTimeFormatter.format(parsed);
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function statusBadge(status: string): string {
  return STATUS_BADGES[status] ?? "bg-slate-100 text-slate-500";
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

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [tab, setTab] = useState(ALL);
  const [branchFilter, setBranchFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [reason, setReason] = useState("");
  const [reviewingId, setReviewingId] = useState("");

  // Bumping the token re-runs the effect below; keeping the fetch inside the effect (instead
  // of a callback the effect calls) avoids setting state synchronously during render.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<LoadResult> {
      // The whole queue is fetched once and filtered in the browser: the KPI counters must stay
      // global, and the queue of one coffee chain fits comfortably in memory. `/api/requests`
      // still accepts `status`/`branch_id` for other clients.
      const [requestsResponse, branchesResponse] = await Promise.all([
        fetch("/api/requests", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
      ]);

      if (!requestsResponse.ok) {
        const data = (await requestsResponse.json().catch(() => null)) as {
          error?: string;
        } | null;

        return {
          requests: [],
          branches: [],
          error: data?.error ?? "Không thể tải danh sách đơn từ.",
        };
      }

      return {
        requests: (await requestsResponse.json()) as RequestEntity[],
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

        setRequests(result.requests);
        setBranches(result.branches);
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRequests([]);
        setBranches([]);
        setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function refresh() {
    setLoading(true);
    setPageError("");
    setReloadToken((token) => token + 1);
  }

  const branchNames = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((branch) => map.set(branch.id, branch.name));

    return map;
  }, [branches]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return requests.filter((item) => {
      if (tab !== ALL && item.status !== tab) {
        return false;
      }

      if (branchFilter !== ALL && item.branch_id !== branchFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const requester = item.requester?.full_name ?? "";

      return `${requester} ${item.request_type} ${item.title ?? ""} ${
        item.content ?? ""
      }`
        .toLowerCase()
        .includes(keyword);
    });
  }, [requests, tab, branchFilter, query]);

  const pendingCount = requests.filter((item) => item.status === "PENDING").length;
  const approvedCount = requests.filter(
    (item) => item.status === "APPROVED",
  ).length;
  const rejectedCount = requests.filter(
    (item) => item.status === "REJECTED",
  ).length;

  function reviewErrorMessage(
    status: number,
    data: { error?: string } | null,
  ): string {
    if (status === 401) {
      return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
    }

    if (status === 403) {
      return "Tài khoản của bạn không có quyền duyệt đơn (chỉ OWNER hoặc CHU).";
    }

    if (status === 404) {
      return "Không tìm thấy đơn cần duyệt. Có thể đơn đã bị xoá.";
    }

    return data?.error ?? "Không thể cập nhật đơn. Vui lòng thử lại.";
  }

  async function review(
    id: string,
    status: "APPROVED" | "REJECTED",
    rejectReason?: string,
  ) {
    setReviewingId(id);
    setPageError("");

    try {
      const response = await fetch(`/api/requests/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reject_reason: rejectReason?.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(reviewErrorMessage(response.status, data));
        return;
      }

      setRejectTarget(null);
      setReason("");
      refresh();
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setReviewingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Nhân sự / SCRUM-41
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý duyệt đơn
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Duyệt hoặc từ chối đơn nghỉ phép, đổi ca và điều chỉnh công của nhân viên.
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
          <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
            Tổng đơn
          </p>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {requests.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Toàn bộ đơn trên hệ thống</p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-amber-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
            Chờ duyệt
          </p>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {pendingCount}
          </p>
          <p className="mt-1 text-[10px] text-amber-600">Cần quản lý xử lý</p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
            Đã duyệt
          </p>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {approvedCount}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">Đã ghi nhận vào lịch</p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-rose-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
            Từ chối
          </p>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {rejectedCount}
          </p>
          <p className="mt-1 text-[10px] text-rose-600">Kèm lý do cho nhân viên</p>
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
          <div className="flex flex-wrap gap-1" role="group" aria-label="Lọc theo trạng thái">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === item.key
                    ? "bg-[#0C66E4] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

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

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#F8F9FF] px-3 py-2 text-xs xl:w-72">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                aria-label="Tìm đơn từ"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm nhân viên, loại đơn, nội dung"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>

        <p className="border-b border-slate-100 px-4 py-2 text-[10px] text-slate-400">
          {filtered.length} đơn phù hợp bộ lọc hiện tại
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Nội dung đơn</th>
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t border-slate-100">
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#0C66E4]" />
                      Đang tải danh sách đơn...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    {requests.length === 0
                      ? "Chưa có đơn nào được gửi"
                      : "Không có đơn phù hợp bộ lọc hiện tại"}
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 align-top transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#0C66E4]">
                          {initials(item.requester?.full_name)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.requester?.full_name ??
                              `Nhân viên #${item.user_id.slice(0, 4)}`}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {item.request_type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-72 px-4 py-4">
                      <p className="font-medium text-slate-700">
                        {item.title ?? "Không có tiêu đề"}
                      </p>
                      {item.content && (
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.content}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {branchNames.get(item.branch_id) ?? "—"}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} className="text-slate-400" />
                        {formatDateTime(item.updated_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
                          item.status,
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                      {item.reject_reason && (
                        <p className="mt-1 max-w-48 text-[11px] text-rose-600">
                          {item.reject_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {item.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void review(item.id, "APPROVED")}
                            disabled={reviewingId === item.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {reviewingId === item.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectTarget({
                                id: item.id,
                                label:
                                  item.requester?.full_name ??
                                  `Nhân viên #${item.user_id.slice(0, 4)}`,
                              });
                              setReason("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                          >
                            <X size={13} />
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Từ chối đơn</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Đơn của {rejectTarget.label}. Lý do là bắt buộc theo yêu cầu nghiệp vụ và
                  sẽ được gửi tới nhân viên.
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setRejectTarget(null)}
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {REJECT_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    reason === preset
                      ? "border-blue-200 bg-blue-50 font-semibold text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Nhập lý do từ chối..."
              className="mt-4 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!reason.trim() || reviewingId === rejectTarget.id}
                onClick={() =>
                  void review(rejectTarget.id, "REJECTED", reason)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reviewingId === rejectTarget.id && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
