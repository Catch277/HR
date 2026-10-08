"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Radar,
  RefreshCw,
  Search,
  UserX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  manager_id: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance_radius: number;
  created_at: string;
  updated_at: string;
};

type BranchForm = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  attendanceRadius: string;
};

type ModalState = { mode: "create" } | { mode: "edit"; branch: Branch } | null;

type LoadResult = { branches: Branch[]; error: string | null };

const EMPTY_FORM: BranchForm = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  attendanceRadius: "50",
};

const PAGE_SIZE = 8;

// Mirrors MIN_ATTENDANCE_RADIUS / MAX_ATTENDANCE_RADIUS in
// app/api/branches/_lib/branchRequest.ts.
const MIN_RADIUS = 10;
const MAX_RADIUS = 2000;

const radiusFormatter = new Intl.NumberFormat("vi-VN");

function hasGeofence(branch: Branch): boolean {
  return branch.latitude !== null && branch.longitude !== null;
}

function formatGps(latitude: number | null, longitude: number | null): string {
  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return "Chưa cấu hình";
  }

  const latitudeLabel = `${Math.abs(latitude).toFixed(6)}° ${latitude >= 0 ? "N" : "S"}`;
  const longitudeLabel = `${Math.abs(longitude).toFixed(6)}° ${longitude >= 0 ? "E" : "W"}`;

  return `${latitudeLabel}, ${longitudeLabel}`;
}

function toForm(branch: Branch): BranchForm {
  return {
    name: branch.name,
    address: branch.address ?? "",
    latitude: branch.latitude === null ? "" : String(branch.latitude),
    longitude: branch.longitude === null ? "" : String(branch.longitude),
    attendanceRadius: String(branch.attendance_radius),
  };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Bumping the token re-runs the effect below; keeping the fetch inside the effect (instead
  // of a callback the effect calls) avoids setting state synchronously during render.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/branches", { cache: "no-store" })
      .then(async (response): Promise<LoadResult> => {
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          return {
            branches: [],
            error: data?.error ?? "Không thể tải danh sách chi nhánh.",
          };
        }

        return { branches: (await response.json()) as Branch[], error: null };
      })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setBranches(result.branches);
        setPageError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

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

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return branches;
    }

    return branches.filter((branch) =>
      `${branch.name} ${branch.address ?? ""}`.toLowerCase().includes(keyword),
    );
  }, [branches, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleBranches = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = (currentPage - 1) * PAGE_SIZE + visibleBranches.length;

  const geofenceBranches = branches.filter(hasGeofence);
  const unassignedCount = branches.filter((branch) => !branch.manager_id).length;
  const averageRadius =
    geofenceBranches.length === 0
      ? 0
      : Math.round(
          geofenceBranches.reduce(
            (total, branch) => total + branch.attendance_radius,
            0,
          ) / geofenceBranches.length,
        );

  const previewRadius = Number(form.attendanceRadius);
  const previewLatitude = form.latitude.trim() === "" ? null : Number(form.latitude);
  const previewLongitude =
    form.longitude.trim() === "" ? null : Number(form.longitude);
  const previewDiameter =
    Number.isFinite(previewRadius) && previewRadius > 0
      ? Math.min(140, Math.max(26, 26 + (previewRadius / MAX_RADIUS) * 114))
      : 26;

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setModal({ mode: "create" });
  }

  function openEdit(branch: Branch) {
    setForm(toForm(branch));
    setFormError("");
    setModal({ mode: "edit", branch });
  }

  function closeModal() {
    setModal(null);
    setFormError("");
  }

  function applyCurrentLocation() {
    if (!navigator.geolocation) {
      setFormError("Thiết bị không hỗ trợ lấy vị trí GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        setForm((value) => ({
          ...value,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        })),
      () => setFormError("Không lấy được vị trí hiện tại. Vui lòng nhập tay."),
    );
  }

  async function submit() {
    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên chi nhánh.");
      return;
    }

    const latitude = form.latitude.trim() === "" ? null : Number(form.latitude);
    const longitude =
      form.longitude.trim() === "" ? null : Number(form.longitude);
    const radius = Number(form.attendanceRadius);

    if (latitude !== null && (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) {
      setFormError("Vĩ độ phải là số trong khoảng -90 đến 90.");
      return;
    }

    if (
      longitude !== null &&
      (!Number.isFinite(longitude) || Math.abs(longitude) > 180)
    ) {
      setFormError("Kinh độ phải là số trong khoảng -180 đến 180.");
      return;
    }

    if ((latitude === null) !== (longitude === null)) {
      setFormError("Cần nhập đủ cả vĩ độ và kinh độ để tạo vùng chấm công.");
      return;
    }

    if (!Number.isInteger(radius) || radius < MIN_RADIUS || radius > MAX_RADIUS) {
      setFormError(
        `Bán kính chấm công phải là số nguyên từ ${MIN_RADIUS} đến ${MAX_RADIUS} mét.`,
      );
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const isEdit = modal?.mode === "edit";
      const response = await fetch(
        isEdit ? `/api/branches/${modal.branch.id}` : "/api/branches",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            address: form.address.trim() || null,
            latitude,
            longitude,
            attendance_radius: radius,
          }),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFormError(data?.error ?? "Không thể lưu thông tin chi nhánh.");
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Cơ sở hạ tầng / SCRUM-47
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý chi nhánh
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Cấu hình thông tin cơ sở và vùng bán kính chấm công định vị GPS.
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
            <Plus size={14} /> Thêm chi nhánh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-blue-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Tổng số chi nhánh
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
              <Building2 size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {branches.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Đang quản lý trên hệ thống
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Đã cấu hình vùng GPS
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MapPin size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {geofenceBranches.length}/{branches.length}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">
            Sẵn sàng cho chấm công định vị
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-teal-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Bán kính chấm công TB
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Radar size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {radiusFormatter.format(averageRadius)} m
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Áp dụng cho các chi nhánh có GPS
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/80 border-b-2 border-b-amber-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
              Chưa gán chi nhánh trưởng
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UserX size={16} />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {unassignedCount}
          </p>
          <p className="mt-1 text-[10px] text-amber-600">
            Cần bổ sung quản lý phụ trách
          </p>
        </article>
      </div>

      {pageError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {pageError}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#F8F9FF] px-3 py-2 text-xs md:w-80">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              aria-label="Tìm chi nhánh"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên, địa chỉ chi nhánh, địa bàn"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <p className="text-[10px] text-slate-400">
            Hiển thị {rangeStart} – {rangeEnd} trên tổng số {filtered.length} chi
            nhánh
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Chi nhánh trưởng</th>
                <th className="px-4 py-3">Toạ độ GPS</th>
                <th className="px-4 py-3 text-right">Bán kính chấm công</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t border-slate-100">
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#0C66E4]" />
                      Đang tải danh sách chi nhánh...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && visibleBranches.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    {query ? "Không tìm thấy kết quả nào" : "Chưa có chi nhánh nào"}
                  </td>
                </tr>
              )}

              {!loading &&
                visibleBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                          <Building2 size={16} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {branch.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {branch.address ?? "Chưa cập nhật địa chỉ"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {branch.manager_id ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          Đã gán
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          Chưa gán
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">
                      {formatGps(branch.latitude, branch.longitude)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-slate-700">
                      {radiusFormatter.format(branch.attendance_radius)} m
                    </td>
                    <td className="px-4 py-4">
                      {hasGeofence(branch) ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Sẵn sàng chấm công
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          Thiếu toạ độ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(branch)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Pencil size={13} /> Chỉnh sửa
                      </button>
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
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                      number === currentPage
                        ? "bg-[#0C66E4] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {number}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="Trang sau"
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
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
                  <Building2 size={18} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">
                    {modal.mode === "create"
                      ? "Thêm mới Chi nhánh hoạt động"
                      : "Cập nhật Chi nhánh"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Cấu hình thông tin cơ sở và vùng bán kính chấm công định vị
                    tinh GPS.
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Đóng" onClick={closeModal}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-slate-600">
                Tên chi nhánh <span className="text-rose-500">*</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, name: event.target.value }))
                  }
                  maxLength={120}
                  placeholder="Chi nhánh Quận 1 - Flagship Bến Thành"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                Địa chỉ đầy đủ
                <input
                  value={form.address}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      address: event.target.value,
                    }))
                  }
                  maxLength={300}
                  placeholder="128 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">
                    Toạ độ định vị GPS <span className="text-rose-500">*</span>
                  </p>
                  <button
                    type="button"
                    onClick={applyCurrentLocation}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0C66E4]"
                  >
                    <MapPin size={12} /> Lấy vị trí hiện tại
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Vĩ độ (Lat)
                    <input
                      value={form.latitude}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          latitude: event.target.value,
                        }))
                      }
                      inputMode="decimal"
                      placeholder="10.772500"
                      className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal tabular-nums text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kinh độ (Long)
                    <input
                      value={form.longitude}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          longitude: event.target.value,
                        }))
                      }
                      inputMode="decimal"
                      placeholder="106.698000"
                      className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal tabular-nums text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">
                    Bán kính chấm công cho phép (Geo-Fence)
                  </p>
                  <p className="text-[11px] font-semibold text-[#0C66E4]">
                    {radiusFormatter.format(
                      Number.isFinite(previewRadius) ? previewRadius : 0,
                    )}{" "}
                    mét
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    aria-label="Bán kính chấm công (mét)"
                    min={MIN_RADIUS}
                    max={MAX_RADIUS}
                    step={10}
                    value={form.attendanceRadius}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        attendanceRadius: event.target.value,
                      }))
                    }
                    className="w-24 rounded-lg border border-slate-200 p-2.5 text-sm tabular-nums outline-none focus:border-blue-500"
                  />
                  <input
                    type="range"
                    aria-label="Bán kính chấm công"
                    min={MIN_RADIUS}
                    max={MAX_RADIUS}
                    step={10}
                    value={
                      Number.isFinite(previewRadius) ? previewRadius : MIN_RADIUS
                    }
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        attendanceRadius: event.target.value,
                      }))
                    }
                    className="h-1.5 flex-1 accent-[#0C66E4]"
                  />
                </div>
                <p className="mt-2 rounded-lg border border-slate-100 bg-[#F8F9FF] p-2.5 text-[11px] text-slate-500">
                  Ngoài bán kính{" "}
                  {radiusFormatter.format(
                    Number.isFinite(previewRadius) ? previewRadius : 0,
                  )}
                  m tính từ tâm chi nhánh, hệ thống sẽ không ghi nhận chấm công
                  GPS.
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">
                  Mô phỏng vùng chấm công (Geo-Fence Preview)
                </p>
                <div className="relative h-40 overflow-hidden rounded-lg border border-slate-200 bg-[#F3F6FC]">
                  <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0C66E4]/50 bg-[#0C66E4]/10"
                    style={{ width: previewDiameter, height: previewDiameter }}
                  />
                  <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0C66E4] shadow-sm">
                    <MapPin size={16} />
                  </span>
                  <span className="absolute bottom-2 left-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold tabular-nums text-slate-600 shadow-sm">
                    {formatGps(previewLatitude, previewLongitude)}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#0C66E4] shadow-sm">
                    Bán kính R ={" "}
                    {radiusFormatter.format(
                      Number.isFinite(previewRadius) ? previewRadius : 0,
                    )}
                    m
                  </span>
                </div>
              </div>

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
                {saving ? "Đang lưu..." : "Lưu thông tin chi nhánh"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

