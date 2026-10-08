"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageSearch,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  FACILITY_CATEGORIES,
  FACILITY_CONDITIONS,
  type Facility,
  type FacilityCategory,
  type FacilityCondition,
} from "@/lib/domain/entities/Facility";

type Branch = { id: string; name: string };

type FacilityForm = {
  branchId: string;
  name: string;
  code: string;
  category: FacilityCategory;
  quantity: string;
  condition: FacilityCondition;
  lastCheckedAt: string;
  note: string;
};

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; facility: Facility }
  | null;

type LoadResult = {
  facilities: Facility[];
  branches: Branch[];
  error: string | null;
};

const CATEGORY_LABELS: Record<FacilityCategory, string> = {
  KITCHEN: "Khu pha chế",
  COLD_STORAGE: "Bảo quản lạnh",
  FURNITURE: "Nội thất",
  ELECTRICAL: "Thiết bị điện",
  CLEANING: "Vệ sinh",
  OTHER: "Khác",
};

const CONDITION_LABELS: Record<FacilityCondition, string> = {
  GOOD: "Hoạt động tốt",
  FAIR: "Cần theo dõi",
  MAINTENANCE: "Đang sửa chữa",
  BROKEN: "Hỏng, chờ xử lý",
};

const CONDITION_BADGES: Record<FacilityCondition, string> = {
  GOOD: "bg-emerald-50 text-emerald-700",
  FAIR: "bg-amber-50 text-amber-700",
  MAINTENANCE: "bg-blue-50 text-blue-700",
  BROKEN: "bg-rose-50 text-rose-700",
};

/** Values whose `condition` needs a maintenance action (SCRUM-46). */
const ATTENTION_CONDITIONS: FacilityCondition[] = ["MAINTENANCE", "BROKEN"];

const ALL = "all";
const PAGE_SIZE = 8;

const EMPTY_FORM: FacilityForm = {
  branchId: "",
  name: "",
  code: "",
  category: "KITCHEN",
  quantity: "1",
  condition: "GOOD",
  lastCheckedAt: "",
  note: "",
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-blue-500";

/** Formats the `date` column (`YYYY-MM-DD`) without going through `Date`, so no timezone shifts it. */
function formatCheckedAt(value: string | null): string {
  if (!value) {
    return "Chưa kiểm tra";
  }

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function categoryOf(facility: Facility): string {
  return CATEGORY_LABELS[facility.category] ?? facility.category;
}

function toForm(facility: Facility): FacilityForm {
  return {
    branchId: facility.branch_id,
    name: facility.name,
    code: facility.code ?? "",
    category: facility.category,
    quantity: String(facility.quantity),
    condition: facility.condition,
    lastCheckedAt: facility.last_checked_at ?? "",
    note: facility.note ?? "",
  };
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState<FacilityCategory | typeof ALL>(ALL);
  const [conditionFilter, setConditionFilter] = useState<FacilityCondition | typeof ALL>(ALL);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<FacilityForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // Bumping the token re-runs the effect below; keeping the fetch inside the effect (instead
  // of a callback the effect calls) avoids setting state synchronously during render.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<LoadResult> {
      // The branch list feeds the "Chi nhánh" column and the modal picker.
      const [facilitiesResponse, branchesResponse] = await Promise.all([
        fetch("/api/facilities", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
      ]);

      if (!facilitiesResponse.ok) {
        const data = (await facilitiesResponse.json().catch(() => null)) as {
          error?: string;
        } | null;

        return {
          facilities: [],
          branches: [],
          error: data?.error ?? "Không thể tải danh sách cơ sở vật chất.",
        };
      }

      return {
        facilities: (await facilitiesResponse.json()) as Facility[],
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

        setFacilities(result.facilities);
        setBranches(result.branches);
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setFacilities([]);
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

    return facilities.filter((facility) => {
      if (branchFilter !== ALL && facility.branch_id !== branchFilter) {
        return false;
      }

      if (categoryFilter !== ALL && facility.category !== categoryFilter) {
        return false;
      }

      if (conditionFilter !== ALL && facility.condition !== conditionFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return `${facility.name} ${facility.code ?? ""} ${categoryOf(facility)}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [facilities, query, branchFilter, categoryFilter, conditionFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleFacilities = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = (currentPage - 1) * PAGE_SIZE + visibleFacilities.length;

  const totalQuantity = facilities.reduce(
    (total, facility) => total + facility.quantity,
    0,
  );
  const attentionCount = facilities.filter((facility) =>
    ATTENTION_CONDITIONS.includes(facility.condition),
  ).length;
  const maintenanceCount = facilities.filter(
    (facility) => facility.condition === "MAINTENANCE",
  ).length;
  const goodCount = facilities.filter(
    (facility) => facility.condition === "GOOD",
  ).length;
  const branchCount = new Set(
    facilities.map((facility) => facility.branch_id),
  ).size;

  function openCreate() {
    setForm({ ...EMPTY_FORM, branchId: branches[0]?.id ?? "" });
    setFormError("");
    setModal({ mode: "create" });
  }

  function openEdit(facility: Facility) {
    setForm(toForm(facility));
    setFormError("");
    setModal({ mode: "edit", facility });
  }

  function closeModal() {
    setModal(null);
    setFormError("");
  }

  async function submit() {
    if (!form.branchId) {
      setFormError("Vui lòng chọn chi nhánh.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên thiết bị.");
      return;
    }

    const quantity = Number(form.quantity);
    const isEdit = modal?.mode === "edit";

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
      setFormError("Số lượng phải là số nguyên từ 1 đến 9999.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        isEdit ? `/api/facilities/${modal.facility.id}` : "/api/facilities",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch_id: form.branchId,
            name: form.name.trim(),
            code: form.code.trim() || null,
            category: form.category,
            quantity,
            condition: form.condition,
            last_checked_at: form.lastCheckedAt || null,
            note: form.note.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFormError(data?.error ?? "Không thể lưu thông tin thiết bị.");
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

  async function remove(facility: Facility) {
    if (
      !window.confirm(
        `Xoá "${facility.name}" khỏi danh sách cơ sở vật chất? Thao tác này không thể hoàn tác.`,
      )
    ) {
      return;
    }

    setDeletingId(facility.id);
    setPageError("");

    try {
      const response = await fetch(`/api/facilities/${facility.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPageError(data?.error ?? "Không thể xoá thiết bị.");
        return;
      }

      refresh();
    } catch {
      setPageError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Cơ sở hạ tầng / SCRUM-45
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cơ sở vật chất
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Danh mục thiết bị theo từng chi nhánh kèm tình trạng và ngày kiểm tra gần
            nhất.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0C66E4] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus size={14} /> Thêm thiết bị
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-blue-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Tổng thiết bị đang quản lý
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
              <PackageSearch size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {totalQuantity}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {goodCount} hạng mục hoạt động tốt
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Hạng mục cần xử lý
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <TriangleAlert size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {attentionCount}
          </p>
          <p className="mt-1 text-[10px] text-rose-600">
            Đang sửa chữa hoặc hỏng
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-amber-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Đang sửa chữa
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Wrench size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {maintenanceCount}
          </p>
          <p className="mt-1 text-[10px] text-amber-600">
            Theo dõi tiến độ bảo trì
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Chi nhánh có thiết bị
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {branchCount}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">
            Trên tổng số {branches.length} chi nhánh
          </p>
        </article>
      </div>

      {pageError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {pageError}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#F8F9FF] px-3 py-2 text-xs xl:w-96">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              aria-label="Tìm thiết bị"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên thiết bị, mã tài sản, nhóm thiết bị"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo chi nhánh"
              value={branchFilter}
              onChange={(event) => {
                setBranchFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0C66E4]"
            >
              <option value={ALL}>Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo nhóm thiết bị"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(
                  event.target.value as FacilityCategory | typeof ALL,
                );
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0C66E4]"
            >
              <option value={ALL}>Tất cả nhóm thiết bị</option>
              {FACILITY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setConditionFilter(ALL);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              conditionFilter === ALL
                ? "bg-blue-50 text-[#0C66E4]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Tất cả tình trạng
          </button>
          {FACILITY_CONDITIONS.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() => {
                setConditionFilter(condition);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                conditionFilter === condition
                  ? CONDITION_BADGES[condition]
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {CONDITION_LABELS[condition]}
            </button>
          ))}
          <p className="ml-auto text-[10px] text-slate-400">
            Hiển thị {rangeStart} – {rangeEnd} trên tổng số {filtered.length} hạng mục
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Thiết bị</th>
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Nhóm</th>
                <th className="px-4 py-3 text-right">Số lượng</th>
                <th className="px-4 py-3">Tình trạng</th>
                <th className="px-4 py-3">Kiểm tra gần nhất</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#0C66E4]" />
                      Đang tải danh sách thiết bị...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && visibleFacilities.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    {query ||
                    branchFilter !== ALL ||
                    categoryFilter !== ALL ||
                    conditionFilter !== ALL
                      ? "Không tìm thấy thiết bị phù hợp"
                      : "Chưa có thiết bị nào được đăng ký"}
                  </td>
                </tr>
              )}

              {!loading &&
                visibleFacilities.map((facility) => (
                  <tr
                    key={facility.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                          <PackageSearch size={16} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {facility.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {facility.code ?? "Chưa gắn mã tài sản"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {branchNames.get(facility.branch_id) ?? "Chi nhánh đã xoá"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {categoryOf(facility)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-slate-700">
                      {facility.quantity}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          CONDITION_BADGES[facility.condition]
                        }`}
                      >
                        {CONDITION_LABELS[facility.condition]}
                      </span>
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">
                      {formatCheckedAt(facility.last_checked_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(facility)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Pencil size={13} /> Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(facility)}
                          disabled={deletingId === facility.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === facility.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-[10px] text-slate-400">
              Trang {currentPage} / {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Trang trước"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Trước
              </button>
              <button
                type="button"
                aria-label="Trang sau"
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Sau <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                  <PackageSearch size={18} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">
                    {modal.mode === "create"
                      ? "Thêm thiết bị vào chi nhánh"
                      : "Cập nhật thiết bị"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Thiết bị luôn thuộc một chi nhánh để phục vụ kiểm kê và bảo trì.
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Đóng" onClick={closeModal}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-slate-600">
                Chi nhánh <span className="text-rose-500">*</span>
                <select
                  value={form.branchId}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, branchId: event.target.value }))
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
                Tên thiết bị <span className="text-rose-500">*</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, name: event.target.value }))
                  }
                  maxLength={120}
                  placeholder="Máy pha cà phê Breville"
                  className={inputClassName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Mã tài sản
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setForm((value) => ({ ...value, code: event.target.value }))
                    }
                    maxLength={60}
                    placeholder="CF-0012"
                    className={inputClassName}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Nhóm thiết bị
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        category: event.target.value as FacilityCategory,
                      }))
                    }
                    className={inputClassName}
                  >
                    {FACILITY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Số lượng
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        quantity: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Tình trạng
                  <select
                    value={form.condition}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        condition: event.target.value as FacilityCondition,
                      }))
                    }
                    className={inputClassName}
                  >
                    {FACILITY_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {CONDITION_LABELS[condition]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-600">
                Ngày kiểm tra gần nhất
                <input
                  type="date"
                  value={form.lastCheckedAt}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      lastCheckedAt: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                Ghi chú
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, note: event.target.value }))
                  }
                  maxLength={500}
                  rows={3}
                  placeholder="Ví dụ: gioăng cao su yếu, cần thay trong tháng này"
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
                className="inline-flex items-center gap-2 rounded-lg bg-[#0C66E4] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? "Đang lưu..." : "Lưu thiết bị"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
