"use client";

import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

const mockRequests = [
  {
    id: 89,
    code: "HR-2024-089",
    name: "Lê Văn Tuấn",
    role: "Barista chính",
    type: "Nghỉ phép năm",
    date: "02/10/2026",
    range: "28/10 – 29/10",
    status: "pending",
    branch: "Chi nhánh Quận 1",
    submitted: "12 phút trước",
    avatar: "LT",
  },
  {
    id: 90,
    code: "HR-2024-090",
    name: "Trần Thị Bảo Ngọc",
    role: "Thu ngân",
    type: "Đổi ca",
    date: "02/10/2026",
    range: "Ca chiều · 04/10",
    status: "pending",
    branch: "Chi nhánh Quận 3",
    submitted: "38 phút trước",
    avatar: "TN",
  },
  {
    id: 91,
    code: "HR-2024-091",
    name: "Nguyễn Phương Linh",
    role: "Phục vụ",
    type: "Nghỉ phép năm",
    date: "01/10/2026",
    range: "10/10 – 11/10",
    status: "pending",
    branch: "Chi nhánh Quận 1",
    submitted: "1 giờ trước",
    avatar: "NL",
  },
  {
    id: 92,
    code: "HR-2024-092",
    name: "Lê Hoàng Long",
    role: "Pha chế",
    type: "Nghỉ ốm",
    date: "01/10/2026",
    range: "01/10",
    status: "approved",
    branch: "Chi nhánh Quận 1",
    submitted: "2 giờ trước",
    avatar: "LL",
  },
  {
    id: 93,
    code: "HR-2024-093",
    name: "Phạm Minh Châu",
    role: "Trưởng ca",
    type: "Điều chỉnh công",
    date: "30/09/2026",
    range: "Ca sáng · 29/09",
    status: "approved",
    branch: "Chi nhánh Quận 3",
    submitted: "Hôm qua",
    avatar: "PC",
  },
];

const quickReasons = [
  "Trùng lịch",
  "Hết phép năm có lương",
  "Nhân sự ca chưa đủ",
  "Nộp đơn muộn so với quy định",
];

export default function RequestsPage() {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const activeRequest = mockRequests.find(
    (request) => request.id === selectedRequest,
  );

  const handleApprove = (id: number) => {
    alert(`Đã duyệt đơn #${id}`);
    // Call PATCH /api/requests/[id]/review
  };

  const openRejectModal = (id: number) => {
    setSelectedRequest(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối");
    alert(`Đã từ chối đơn #${selectedRequest} với lý do: ${rejectReason}`);
    setRejectModalOpen(false);
    setRejectReason("");
    // Call PATCH /api/requests/[id]/review
  };

  return (
    <div className="relative space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Nhân sự / SCRUM-41
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý & Xét duyệt Đơn từ
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi và phản hồi các yêu cầu đang chờ từ nhân viên.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase text-slate-500">
              Tổng đơn
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">24</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase text-amber-700">
              Chờ duyệt
            </p>
            <p className="mt-1 text-lg font-bold text-amber-800">8</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase text-emerald-700">
              Đã duyệt
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-800">14</p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div
            className="flex flex-wrap items-center gap-1"
            role="tablist"
            aria-label="Lọc trạng thái đơn"
          >
            <button className="rounded-md bg-[#0C66E4] px-3 py-2 text-xs font-semibold text-white">
              Tất cả{" "}
              <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5">24</span>
            </button>
            <button className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Chờ duyệt{" "}
              <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                8
              </span>
            </button>
            <button className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Đã duyệt
            </button>
            <button className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Từ chối
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                aria-label="Tìm đơn từ"
                className="w-36 bg-transparent text-xs outline-none placeholder:text-slate-400"
                placeholder="Tìm nhân viên, mã đơn..."
              />
            </label>
            <label className="relative">
              <select
                aria-label="Lọc chi nhánh"
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs text-slate-600 outline-none"
              >
                <option>Tất cả chi nhánh</option>
                <option>Chi nhánh Quận 1</option>
                <option>Chi nhánh Quận 3</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400"
              />
            </label>
            <button
              aria-label="Bộ lọc nâng cao"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <Filter size={15} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-xs">
            <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Loại đơn</th>
                <th className="px-4 py-3">Thời gian yêu cầu</th>
                <th className="px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockRequests.map((req) => (
                <tr
                  key={req.id}
                  className="transition-colors hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#0C66E4]">
                    #{req.code}
                    <span className="mt-1 block text-[9px] font-normal text-slate-400">
                      Đơn từ nhân sự
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#0C66E4]">
                        {req.avatar}
                      </span>
                      <span>
                        <b className="text-slate-800">{req.name}</b>
                        <span className="mt-1 block text-[9px] text-slate-500">
                          {req.role} · {req.branch}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800">
                      {req.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    <CalendarDays
                      size={12}
                      className="mr-1.5 inline text-slate-400"
                    />
                    {req.range}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    <span>{req.date}</span>
                    <span className="mt-1 block text-[9px] text-slate-400">
                      {req.submitted}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {req.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">
                        <Clock3 size={10} /> Chờ duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                        <Check size={10} /> Đã duyệt
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
                          title="Duyệt đơn"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => openRejectModal(req.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors hover:bg-rose-600 hover:text-white"
                          title="Từ chối"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500">
          <span>
            Hiển thị <b className="text-slate-700">1–5</b> trên tổng số 24 đơn
            từ
          </span>
          <div className="flex items-center gap-1">
            <button className="rounded-md px-2 py-1">‹</button>
            <button className="rounded-md bg-[#0C66E4] px-2.5 py-1 font-semibold text-white">
              1
            </button>
            <button className="rounded-md px-2.5 py-1 hover:bg-slate-100">
              2
            </button>
            <button className="rounded-md px-2.5 py-1 hover:bg-slate-100">
              3
            </button>
            <button className="rounded-md px-2 py-1">›</button>
          </div>
        </div>
      </section>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <AlertTriangle size={19} />
                </span>
                <div>
                  <h3
                    id="reject-title"
                    className="text-sm font-bold text-slate-900"
                  >
                    Từ chối xét duyệt đơn #{activeRequest?.code}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-rose-600">
                    Thao tác này sẽ cập nhật hồ sơ và gửi thông báo trực tiếp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                aria-label="Đóng hộp thoại"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 rounded-lg bg-[#F3F6FC] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-[#0C66E4]">
                  {activeRequest?.avatar}
                </span>
                <div>
                  <p className="text-[9px] font-semibold uppercase text-slate-500">
                    Người gửi yêu cầu
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-800">
                    {activeRequest?.name} · {activeRequest?.role} (
                    {activeRequest?.branch})
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold text-slate-700">
                  Chọn nhanh lý do thường gặp:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() =>
                        setRejectReason((current) =>
                          current ? `${current}; ${reason}` : reason,
                        )
                      }
                      className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-medium text-blue-800 transition-colors hover:border-[#0C66E4] hover:bg-blue-100"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="reject-reason"
                    className="text-[10px] font-semibold text-slate-700"
                  >
                    Lý do từ chối <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[9px] text-slate-400">
                    {rejectReason.trim().length} / tối thiểu 10 ký tự
                  </span>
                </div>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10"
                  rows={5}
                  placeholder="Vui lòng nhập chi tiết lý do từ chối để nhân viên nắm rõ thông tin (tối thiểu 10 ký tự)..."
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-[#F8F9FF] px-5 py-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
                disabled={rejectReason.trim().length < 10}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                <AlertTriangle size={13} className="mr-1.5 inline" /> Xác nhận
                từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
