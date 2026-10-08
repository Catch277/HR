"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
  UserX,
} from "lucide-react";

import type { StaffRole } from "@/lib/domain/entities/StaffMember";
import { STAFF_ROLES } from "@/lib/domain/entities/StaffMember";

type StaffMemberRow = {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type StaffDraft = {
  role: StaffRole;
  isActive: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Chủ sở hữu",
  CHU: "Quản lý chi nhánh",
  EMPLOYEE: "Nhân viên",
};

const ROLE_SET: ReadonlySet<string> = new Set(STAFF_ROLES);

/** Mirrors the API contract: the role sent back must be one of the three known values. */
function toDraftRole(role: string): StaffRole {
  const upper = role.trim().toUpperCase();

  return (ROLE_SET.has(upper) ? upper : "EMPLOYEE") as StaffRole;
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role.trim().toUpperCase()] ?? role;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(parsed);
}

function actionErrorMessage(status: number, data: { error?: string } | null): string {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Chỉ chủ sở hữu (OWNER) hoặc quản lý chi nhánh (CHU) mới quản lý được nhân sự.";
  }

  if (status === 404) {
    return "Không tìm thấy tài khoản này.";
  }

  return data?.error ?? "Không thực hiện được thao tác. Vui lòng thử lại.";
}

export default function StaffPage() {
  const [members, setMembers] = useState<StaffMemberRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, StaffDraft>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<{
      members: StaffMemberRow[];
      error: string | null;
    }> {
      const response = await fetch("/api/users", { cache: "no-store" });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        return { members: [], error: actionErrorMessage(response.status, data) };
      }

      return {
        members: (await response.json()) as StaffMemberRow[],
        error: null,
      };
    }

    load()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setMembers(result.members);
        setDrafts(
          Object.fromEntries(
            result.members.map((member) => [
              member.id,
              { role: toDraftRole(member.role), isActive: member.is_active },
            ]),
          ),
        );
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setMembers([]);
        setDrafts({});
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

  const filteredMembers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return members;
    }

    return members.filter((member) =>
      `${member.full_name} ${roleLabel(member.role)}`.toLowerCase().includes(keyword),
    );
  }, [members, query]);

  const activeCount = members.filter((member) => member.is_active).length;

  function updateDraft(id: string, patch: Partial<StaffDraft>) {
    setDrafts((value) => {
      const current = value[id] ?? { role: "EMPLOYEE" as StaffRole, isActive: true };

      return { ...value, [id]: { ...current, ...patch } };
    });
  }

  /** A row shows a draft until it is saved, so the badge reflects what will be stored. */
  function draftOf(member: StaffMemberRow): StaffDraft {
    return (
      drafts[member.id] ?? {
        role: toDraftRole(member.role),
        isActive: member.is_active,
      }
    );
  }

  function isDirty(member: StaffMemberRow): boolean {
    const draft = draftOf(member);

    return (
      draft.role !== toDraftRole(member.role) || draft.isActive !== member.is_active
    );
  }

  async function save(member: StaffMemberRow) {
    const draft = draftOf(member);
    setSavingId(member.id);
    setPageError("");

    try {
      const response = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: draft.role, is_active: draft.isActive }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(actionErrorMessage(response.status, data));
        return;
      }

      const updated = (await response.json()) as StaffMemberRow;
      setMembers((value) =>
        value.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setDrafts((value) => ({
        ...value,
        [updated.id]: {
          role: toDraftRole(updated.role),
          isActive: updated.is_active,
        },
      }));
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Nhân sự / SCRUM-24
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cấp vai trò và cho nhân viên nghỉ việc — thay cho thao tác SQL thủ công trước đây.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tổng tài khoản
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{members.length}</p>
          <p className="mt-1 text-[10px] text-slate-500">Gồm cả tài khoản đã nghỉ việc</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Đang làm việc
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserRoundCheck size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{activeCount}</p>
          <p className="mt-1 text-[10px] text-emerald-600">
            Vẫn hiện trong bảng công và lịch làm việc
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Đã nghỉ việc
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <UserX size={16} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {members.length - activeCount}
          </p>
          <p className="mt-1 text-[10px] text-rose-600">
            Hiện là NGHỈ VIỆC ở trang trạng thái nhân viên
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-surface-accent p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
        <div className="text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Tài khoản do nhân viên tự đăng ký, vai trò do bạn cấp
          </p>
          <p className="mt-1">
            Nhân viên tự tạo tài khoản ở trang Đăng ký; khi họ đăng nhập lần đầu, hãy đổi vai
            trò ở đây thành <span className="font-medium">Quản lý chi nhánh</span> nếu cần
            duyệt đơn. Chỉ <span className="font-medium">chủ sở hữu</span> mới cấp hoặc thu
            hồi vai trò chủ sở hữu, và không ai tự sửa được vai trò của mình.
          </p>
        </div>
      </div>

      {pageError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={16} />
          {pageError}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search size={15} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc vai trò"
              className="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Tải lại
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Đang tải danh sách nhân sự...
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">
            Chưa có tài khoản nào để hiển thị. Nhân viên tự đăng ký ở trang Đăng ký.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nhân viên</th>
                  <th className="px-4 py-3 font-semibold">Vai trò</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const draft = draftOf(member);
                  const dirty = isDirty(member);

                  return (
                    <tr key={member.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {member.full_name || "Chưa đặt tên"}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {member.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={draft.role}
                          onChange={(event) =>
                            updateDraft(member.id, {
                              role: event.target.value as StaffRole,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                        >
                          {STAFF_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            draft.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {draft.isActive ? "Đang làm việc" : "Đã nghỉ việc"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft(member.id, { isActive: !draft.isActive })
                          }
                          className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <RotateCcw size={12} />
                          {draft.isActive ? "Cho nghỉ việc" : "Kích hoạt lại"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDateTime(member.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void save(member)}
                          disabled={!dirty || savingId === member.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                        >
                          {savingId === member.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Save size={13} />
                          )}
                          Lưu
                        </button>
                        {dirty && (
                          <p className="mt-1 text-[10px] text-amber-600">
                            Có thay đổi chưa lưu
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
