"use client";

import {
  Building2,
  CalendarOff,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  SHIFT_ASSIGNMENT_STATUSES,
  type Shift,
  type ShiftAssignment,
  type ShiftAssignmentStatus,
} from "@/lib/domain/entities/Shift";

type Branch = { id: string; name: string };

type EmployeeResult = { id: string; full_name: string; role: string };

type ScheduleForm = {
  employeeId: string;
  branchId: string;
  shiftId: string;
  workDate: string;
  status: ShiftAssignmentStatus;
  note: string;
};

type ModalState =
  | { mode: "create"; workDate: string }
  | { mode: "edit"; assignment: ShiftAssignment }
  | null;

type LoadResult = {
  assignments: ShiftAssignment[];
  shifts: Shift[];
  branches: Branch[];
  error: string | null;
};

const STATUS_LABELS: Record<ShiftAssignmentStatus, string> = {
  SCHEDULED: "Đi làm",
  LEAVE: "Nghỉ phép",
  CANCELLED: "Đã huỷ",
};

const STATUS_BADGES: Record<ShiftAssignmentStatus, string> = {
  SCHEDULED: "bg-emerald-50 text-emerald-700",
  LEAVE: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const WEEKDAYS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

const ALL = "all";

const inputClassName =
  "mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-blue-500";

/** Business day in Asia/Bangkok (UTC+7, no DST); `en-CA` formats as YYYY-MM-DD. */
function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(
    new Date(),
  );
}

/** Calendar arithmetic on the date string — never on a local `Date`, so no timezone shifts it. */
function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));

  return shifted.toISOString().slice(0, 10);
}

/** Monday of the week containing `date` (the schedule is read Monday → Sunday). */
function startOfWeek(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const offset = (weekday + 6) % 7;

  return addDays(date, -offset);
}

function formatDay(date: string): string {
  const [, month, day] = date.split("-");

  return `${day}/${month}`;
}

function formatWeekRange(weekStart: string): string {
  return `${formatDay(weekStart)} – ${formatDay(addDays(weekStart, 6))}`;
}

function weekdayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  // getUTCDay(): 0 = Sunday, so Monday (index 0 of WEEKDAYS) is (weekday + 6) % 7.
  return WEEKDAYS[(weekday + 6) % 7];
}

function formatHours(time: string | null): string {
  return time ? time.slice(0, 5) : "--:--";
}

/** Two-letter avatar for the schedule rows; falls back to "--" for a hidden profile. */
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

export default function SchedulesPage() {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayInBangkok()));
  const [branchFilter, setBranchFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState<ShiftAssignmentStatus | typeof ALL>(ALL);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<ScheduleForm>({
    employeeId: "",
    branchId: "",
    shiftId: "",
    workDate: "",
    status: "SCHEDULED",
    note: "",
  });
  const [employeeName, setEmployeeName] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeResults, setEmployeeResults] = useState<EmployeeResult[]>([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // Bumping the token re-runs the effect below; keeping the fetch inside the effect (instead
  // of a callback the effect calls) avoids setting state synchronously during render.
  const [reloadToken, setReloadToken] = useState(0);

  const weekEnd = addDays(weekStart, 6);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<LoadResult> {
      // The catalogue fills the shift picker; the branch list names the rows.
      const [scheduleResponse, shiftsResponse, branchesResponse] =
        await Promise.all([
          fetch(`/api/schedules?start_date=${weekStart}&end_date=${weekEnd}`, {
            cache: "no-store",
          }),
          fetch("/api/shifts", { cache: "no-store" }),
          fetch("/api/branches", { cache: "no-store" }),
        ]);

      if (!scheduleResponse.ok) {
        const data = (await scheduleResponse.json().catch(() => null)) as {
          error?: string;
        } | null;

        return {
          assignments: [],
          shifts: [],
          branches: [],
          error: data?.error ?? "Không thể tải lịch làm việc.",
        };
      }

      return {
        assignments: (await scheduleResponse.json()) as ShiftAssignment[],
        shifts: shiftsResponse.ok ? ((await shiftsResponse.json()) as Shift[]) : [],
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

        setAssignments(result.assignments);
        setShifts(result.shifts);
        setBranches(result.branches);
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setAssignments([]);
        setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd, reloadToken]);

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

    return assignments.filter((assignment) => {
      if (branchFilter !== ALL && assignment.branch_id !== branchFilter) {
        return false;
      }

      if (statusFilter !== ALL && assignment.status !== statusFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (assignment.employee?.full_name ?? "")
        .toLowerCase()
        .includes(keyword);
    });
  }, [assignments, branchFilter, statusFilter, query]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const assignmentsByDay = useMemo(() => {
    const grouped = new Map<string, ShiftAssignment[]>();

    weekDays.forEach((day) => grouped.set(day, []));

    filtered.forEach((assignment) => {
      const bucket = grouped.get(assignment.work_date);

      if (bucket) {
        bucket.push(assignment);
      }
    });

    // Inside a day, the earliest shift comes first.
    grouped.forEach((bucket) =>
      bucket.sort((first, second) =>
        formatHours(first.shift?.start_time ?? null).localeCompare(
          formatHours(second.shift?.start_time ?? null),
        ),
      ),
    );

    return grouped;
  }, [filtered, weekDays]);

  const scheduledCount = assignments.filter(
    (assignment) => assignment.status === "SCHEDULED",
  ).length;
  const leaveCount = assignments.filter(
    (assignment) => assignment.status === "LEAVE",
  ).length;
  const employeeCount = new Set(
    assignments.map((assignment) => assignment.employee_id),
  ).size;
  const branchCount = new Set(
    assignments.map((assignment) => assignment.branch_id),
  ).size;
  const isCurrentWeek = weekStart === startOfWeek(todayInBangkok());

  function openCreate(workDate: string) {
    const branchId = branchFilter !== ALL ? branchFilter : (branches[0]?.id ?? "");

    setForm({
      employeeId: "",
      branchId,
      shiftId: "",
      workDate,
      status: "SCHEDULED",
      note: "",
    });
    setEmployeeName("");
    setEmployeeQuery("");
    setEmployeeResults([]);
    setFormError("");
    setModal({ mode: "create", workDate });
  }

  function openEdit(assignment: ShiftAssignment) {
    setForm({
      employeeId: assignment.employee_id,
      branchId: assignment.branch_id,
      shiftId: assignment.shift_id,
      workDate: assignment.work_date,
      status: assignment.status,
      note: assignment.note ?? "",
    });
    setEmployeeName(assignment.employee?.full_name ?? "Nhân viên đã xoá");
    setEmployeeQuery("");
    setEmployeeResults([]);
    setFormError("");
    setModal({ mode: "edit", assignment });
  }

  function closeModal() {
    setModal(null);
    setFormError("");
  }

  /**
   * The staff list is a PII decision (`AGENTS.md`), so the picker searches the existing
   * `GET /api/search?type=users` endpoint instead of adding a staff-list endpoint.
   */
  async function searchEmployees() {
    const keyword = employeeQuery.trim();

    if (keyword.length < 2) {
      setFormError("Nhập ít nhất 2 ký tự để tìm nhân viên.");
      return;
    }

    setSearchingEmployees(true);
    setFormError("");

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}&type=users`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        setFormError("Không thể tìm nhân viên. Vui lòng thử lại.");
        return;
      }

      const data = (await response.json()) as { users?: EmployeeResult[] };
      setEmployeeResults(data.users ?? []);

      if ((data.users ?? []).length === 0) {
        setFormError("Không tìm thấy nhân viên phù hợp.");
      }
    } catch {
      setFormError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSearchingEmployees(false);
    }
  }

  async function submit() {
    if (!form.employeeId) {
      setFormError("Vui lòng chọn nhân viên được xếp ca.");
      return;
    }

    if (!form.branchId) {
      setFormError("Vui lòng chọn chi nhánh.");
      return;
    }

    if (!form.shiftId) {
      setFormError("Vui lòng chọn ca làm việc.");
      return;
    }

    if (!form.workDate) {
      setFormError("Vui lòng chọn ngày làm việc.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const isEdit = modal?.mode === "edit";
      const response = await fetch(
        isEdit ? `/api/schedules/${modal.assignment.id}` : "/api/schedules",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: form.employeeId,
            branch_id: form.branchId,
            shift_id: form.shiftId,
            work_date: form.workDate,
            status: form.status,
            note: form.note.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 409) {
          setFormError(
            "Nhân viên đã có ca trùng giờ trong ngày này. Chọn ca hoặc ngày khác.",
          );
          return;
        }

        if (response.status === 404) {
          setFormError("Không tìm thấy ca làm việc đã chọn. Tải lại trang và thử lại.");
          return;
        }

        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFormError(data?.error ?? "Không thể lưu ca làm việc.");
        return;
      }

      closeModal();
      refresh();
    } catch {
      setFormError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(assignment: ShiftAssignment) {
    const employeeLabel = assignment.employee?.full_name ?? "nhân viên này";

    if (
      !window.confirm(
        `Xoá ca "${assignment.shift?.name ?? "?"}" của ${employeeLabel} ngày ${formatDay(assignment.work_date)}?`,
      )
    ) {
      return;
    }

    setDeletingId(assignment.id);
    setPageError("");

    try {
      const response = await fetch(`/api/schedules/${assignment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(data?.error ?? "Không thể xoá ca làm việc.");
        return;
      }

      refresh();
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setDeletingId("");
    }
  }

  const selectableShifts = shifts.filter(
    (shift) => shift.branch_id === null || shift.branch_id === form.branchId,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Vận hành ca / SCRUM-30
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lịch làm việc
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Phân ca theo tuần cho từng chi nhánh, kiểm tra trùng giờ và theo dõi ngày nghỉ
            phép.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Tuần trước"
            className="rounded-lg border border-slate-200 bg-surface p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-semibold text-slate-700">
            Tuần {formatWeekRange(weekStart)}
            {isCurrentWeek && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Tuần này
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Tuần sau"
            className="rounded-lg border border-slate-200 bg-surface p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronRight size={14} />
          </button>
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(todayInBangkok()))}
              className="rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Về tuần này
            </button>
          )}
          <button
            type="button"
            onClick={() => openCreate(isCurrentWeek ? todayInBangkok() : weekStart)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong"
          >
            <UserPlus size={14} /> Xếp ca
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-blue-200 bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Ca đã xếp trong tuần
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <CalendarRange size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {scheduledCount}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Không tính ngày nghỉ và ca đã huỷ
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-emerald-200 bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Nhân viên được xếp
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {employeeCount}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">
            Có ít nhất một ca trong tuần
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-sky-200 bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Ngày nghỉ phép
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <CalendarOff size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {leaveCount}
          </p>
          <p className="mt-1 text-[10px] text-sky-600">
            Đã ghi nhận trong lịch tuần
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-teal-200 bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Chi nhánh có lịch
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Building2 size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {branchCount}
          </p>
          <p className="mt-1 text-[10px] text-teal-600">
            Trên tổng số {branches.length} chi nhánh
          </p>
        </article>
      </div>

      {pageError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {pageError}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-app px-3 py-2 text-xs xl:w-96">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              aria-label="Tìm nhân viên trong lịch"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên nhân viên"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            aria-label="Lọc theo chi nhánh"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
          >
            <option value={ALL}>Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => setStatusFilter(ALL)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              statusFilter === ALL
                ? "bg-blue-50 text-primary"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Tất cả trạng thái
          </button>
          {SHIFT_ASSIGNMENT_STATUSES.map((status) => (
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
            {filtered.length} ca trong tuần {formatWeekRange(weekStart)}
          </p>
        </div>

        {loading && (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-primary" />
            Đang tải lịch làm việc...
          </p>
        )}

        {!loading &&
          weekDays.map((day) => {
            const dayAssignments = assignmentsByDay.get(day) ?? [];

            return (
              <div key={day} className="border-t border-slate-100 first:border-t-0">
                <div className="flex items-center justify-between bg-app px-4 py-2">
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                    {weekdayLabel(day)} · {formatDay(day)}
                    {day === todayInBangkok() && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Hôm nay
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">
                      {dayAssignments.length} ca
                    </span>
                    <button
                      type="button"
                      onClick={() => openCreate(day)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-surface px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={12} /> Thêm ca
                    </button>
                  </div>
                </div>

                {dayAssignments.length === 0 ? (
                  <p className="px-4 py-3 text-[11px] text-slate-400">
                    Chưa có ca nào
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {dayAssignments.map((assignment) => (
                      <li
                        key={assignment.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-primary">
                          {initials(assignment.employee?.full_name)}
                        </span>
                        <div className="min-w-40">
                          <p className="text-xs font-semibold text-slate-900">
                            {assignment.employee?.full_name ?? "Nhân viên đã xoá"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {branchNames.get(assignment.branch_id) ??
                              "Chi nhánh đã xoá"}
                          </p>
                        </div>
                        <div className="min-w-32 text-[11px] text-slate-600">
                          <p className="font-medium text-slate-700">
                            {assignment.shift?.name ?? "Ca đã xoá"}
                          </p>
                          <p className="mt-0.5 tabular-nums">
                            {formatHours(assignment.shift?.start_time ?? null)} –{" "}
                            {formatHours(assignment.shift?.end_time ?? null)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            STATUS_BADGES[assignment.status]
                          }`}
                        >
                          {STATUS_LABELS[assignment.status]}
                        </span>
                        {assignment.note && (
                          <p
                            className="max-w-56 truncate text-[11px] text-slate-500"
                            title={assignment.note}
                          >
                            {assignment.note}
                          </p>
                        )}
                        <div className="ml-auto inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(assignment)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Pencil size={13} /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(assignment)}
                            disabled={deletingId === assignment.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === assignment.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Xoá
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                  <CalendarRange size={18} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">
                    {modal.mode === "create" ? "Xếp ca làm việc" : "Cập nhật ca"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Một nhân viên có thể có nhiều ca trong ngày, miễn là không trùng giờ.
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Đóng" onClick={closeModal}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Nhân viên <span className="text-rose-500">*</span>
                </p>

                {form.employeeId ? (
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-app px-3 py-2.5">
                    <span className="text-sm font-normal text-slate-700">
                      {employeeName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((value) => ({ ...value, employeeId: "" }));
                        setEmployeeName("");
                      }}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Đổi nhân viên
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={employeeQuery}
                        onChange={(event) => setEmployeeQuery(event.target.value)}
                        placeholder="Nhập tên nhân viên (ít nhất 2 ký tự)"
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => void searchEmployees()}
                        disabled={searchingEmployees}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {searchingEmployees ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Search size={13} />
                        )}
                        Tìm
                      </button>
                    </div>

                    {employeeResults.length > 0 && (
                      <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
                        {employeeResults.map((employee) => (
                          <li key={employee.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((value) => ({
                                  ...value,
                                  employeeId: employee.id,
                                }));
                                setEmployeeName(employee.full_name);
                                setEmployeeResults([]);
                                setEmployeeQuery("");
                                setFormError("");
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                            >
                              <span className="font-medium text-slate-800">
                                {employee.full_name}
                              </span>
                              <span className="text-[10px] uppercase text-slate-400">
                                {employee.role}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Chi nhánh <span className="text-rose-500">*</span>
                  <select
                    value={form.branchId}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        branchId: event.target.value,
                        // A branch-specific template may not belong to the new branch.
                        shiftId: "",
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Ca làm việc <span className="text-rose-500">*</span>
                  <select
                    value={form.shiftId}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        shiftId: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="">Chọn ca</option>
                    {selectableShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({formatHours(shift.start_time)} –{" "}
                        {formatHours(shift.end_time)})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Ngày làm việc <span className="text-rose-500">*</span>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        workDate: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Trạng thái
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        status: event.target.value as ShiftAssignmentStatus,
                      }))
                    }
                    className={inputClassName}
                  >
                    {SHIFT_ASSIGNMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-600">
                Ghi chú
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, note: event.target.value }))
                  }
                  maxLength={500}
                  rows={2}
                  placeholder="Ví dụ: hỗ trợ ca khai trương, đổi ca với chị Ngọc"
                  className={`${inputClassName} resize-none`}
                />
              </label>

              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? "Đang lưu..." : "Lưu ca làm việc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
