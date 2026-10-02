"use client";

import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ImagePlus,
  Landmark,
  ReceiptText,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useState } from "react";

const denominations = [
  { value: 500_000, label: "500.000 ₫" },
  { value: 200_000, label: "200.000 ₫" },
  { value: 100_000, label: "100.000 ₫" },
  { value: 50_000, label: "50.000 ₫" },
];

const recentShifts = [
  {
    code: "CA-20261002-03",
    shift: "Hôm qua · Ca đêm",
    lead: "Lê Hoàng Nam",
    opening: "3.500.000",
    pos: "34.820.000",
    actual: "38.320.000",
    variance: "0 ₫",
  },
  {
    code: "CA-20261002-02",
    shift: "Hôm qua · Ca chiều",
    lead: "Phạm Thị Mai",
    opening: "3.000.000",
    pos: "21.450.000",
    actual: "24.450.000",
    variance: "+50.000 ₫",
  },
  {
    code: "CA-20261002-01",
    shift: "Hôm qua · Ca sáng",
    lead: "Trần Minh Tuấn",
    opening: "3.000.000",
    pos: "19.120.000",
    actual: "22.120.000",
    variance: "0 ₫",
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount);

export default function RevenuePage() {
  const [counts, setCounts] = useState<Record<number, number>>({
    500_000: 4,
    200_000: 5,
    100_000: 3,
    50_000: 4,
  });
  const [closingCash, setClosingCash] = useState(18_250_000);
  const [closeNote, setCloseNote] = useState("");
  const openingTotal = denominations.reduce(
    (total, item) => total + item.value * (counts[item.value] ?? 0),
    0,
  );
  const variance = closingCash - 18_400_000;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Ca làm việc / SCRUM-39 & SCRUM-40
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Khai báo doanh thu ca làm việc
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ghi nhận số dư đầu ca và đối soát doanh thu cuối ca.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ca Sáng
          (07:00–15:00) · Đang mở
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-slate-200/80 border-t-2 border-t-[#0C66E4] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                  <CircleDollarSign size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#0C66E4]">
                    SCRUM-39 · Đầu ca
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-slate-900">
                    Ghi nhận số dư đầu ca
                  </h2>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                <CheckCircle2 size={12} /> Đã xác nhận lúc 07:15
              </span>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between rounded-lg bg-[#F3F6FC] px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Trần Minh Tuấn
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Thu ngân chính · Ca 1
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">
                    Thời gian check-in
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-700">
                    06:58:24 (Hôm nay)
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="opening-total"
                    className="text-[11px] font-semibold text-slate-700"
                  >
                    Số tiền mặt bàn giao (VND)
                  </label>
                  <span className="text-[10px] font-medium text-emerald-700">
                    <Check size={12} className="mr-1 inline" />
                    Khớp chính xác
                  </span>
                </div>
                <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50/60 px-3 focus-within:border-[#0C66E4]">
                  <span className="mr-2 text-sm font-semibold text-[#0C66E4]">
                    ₫
                  </span>
                  <input
                    id="opening-total"
                    className="w-full bg-transparent py-2.5 text-lg font-bold tabular-nums text-slate-900 outline-none"
                    value={formatCurrency(openingTotal)}
                    readOnly
                  />
                  <span className="text-[10px] font-semibold text-slate-400">
                    VND
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] italic text-slate-500">
                  Số dư được tính tự động từ bảng kiểm đếm bên dưới.
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Kiểm đếm mệnh giá tiền
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Tổng cộng:{" "}
                    <b className="text-slate-700">
                      {formatCurrency(openingTotal)} ₫
                    </b>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {denominations.map((item) => (
                    <label
                      key={item.value}
                      className="rounded-lg border border-slate-200 bg-[#F8F9FF] px-2.5 py-2"
                    >
                      <span className="block text-[9px] font-medium text-slate-500">
                        {item.label}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-1">
                        <input
                          aria-label={`Số tờ ${item.label}`}
                          className="w-10 bg-transparent text-base font-bold text-slate-800 outline-none"
                          type="number"
                          min="0"
                          value={counts[item.value] ?? 0}
                          onChange={(event) =>
                            setCounts({
                              ...counts,
                              [item.value]: Math.max(
                                0,
                                Number(event.target.value),
                              ),
                            })
                          }
                        />
                        <span className="text-[9px] text-slate-400">tờ</span>
                      </span>
                      <span className="mt-1 block text-[9px] text-slate-500">
                        {formatCurrency(item.value * (counts[item.value] ?? 0))}{" "}
                        ₫
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="opening-note"
                  className="mb-1.5 block text-[11px] font-semibold text-slate-700"
                >
                  Ghi chú bàn giao đầu ca
                </label>
                <textarea
                  id="opening-note"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#0C66E4] focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Ghi chú tình trạng bàn giao, niêm phong..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                  Biên bản & hình ảnh két đầu ca
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 transition-colors hover:border-[#0C66E4] hover:bg-blue-50/50">
                  <span className="flex h-10 w-12 items-center justify-center rounded-md bg-slate-200 text-slate-500">
                    <Camera size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-semibold text-slate-700">
                      Biên bản kiểm két 07h15.jpg
                    </span>
                    <span className="mt-1 block text-[9px] text-slate-500">
                      Tải lên lúc 07:14:12 · Chụp tại Camera Quầy 01
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#0C66E4]">
                    <ImagePlus size={13} /> Thay ảnh
                  </span>
                  <input type="file" accept="image/*" className="sr-only" />
                </label>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-800">
                <CheckCircle2 size={14} className="text-emerald-600" /> Đã chốt
                & niêm phong đầu ca
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Clock3 size={15} className="text-[#0C66E4]" /> Lịch sử đối
                  soát 3 ca gần nhất
                </h2>
                <p className="mt-1 text-[9px] text-slate-500">
                  Đối chiếu tự động giữa doanh thu POS và tiền mặt nộp két
                </p>
              </div>
              <button className="text-[9px] font-semibold text-[#0C66E4] hover:underline">
                Xem toàn bộ →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-[9px]">
                <thead className="bg-[#F3F6FC] font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Mã ca / Phiên làm</th>
                    <th className="px-3 py-2.5">Thu ngân giao ca</th>
                    <th className="px-3 py-2.5 text-right">Đầu ca</th>
                    <th className="px-3 py-2.5 text-right">Tổng POS</th>
                    <th className="px-3 py-2.5 text-right">Tiền nộp thực tế</th>
                    <th className="px-3 py-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentShifts.map((shift) => (
                    <tr key={shift.code}>
                      <td className="px-3 py-2.5">
                        <b className="text-[#0C66E4]">{shift.code}</b>
                        <span className="mt-0.5 block text-slate-500">
                          {shift.shift}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">
                        {shift.lead}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {shift.opening}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {shift.pos}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {shift.actual}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                          {shift.variance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200/80 border-t-2 border-t-[#0C66E4] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                <ReceiptText size={18} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase text-[#0C66E4]">
                  SCRUM-40 · Cuối ca
                </p>
                <h2 className="mt-0.5 text-sm font-bold text-slate-900">
                  Đối soát & chốt doanh thu
                </h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
              <Clock3 size={12} /> Cần hoàn tất trước 15:30
            </span>
          </div>
          <div className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-700">
                Doanh thu ghi nhận trên hệ thống POS
              </p>
              <span className="text-[9px] text-slate-400">
                Cập nhật lúc 14:55
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[#F3F6FC] p-3">
                <p className="text-[9px] font-medium text-slate-500">
                  <CircleDollarSign
                    size={11}
                    className="mr-1 inline text-[#0C66E4]"
                  />
                  Tiền mặt
                </p>
                <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-900">
                  14.900.000
                </p>
                <p className="text-[9px] text-slate-400">₫</p>
              </div>
              <div className="rounded-lg bg-[#F3F6FC] p-3">
                <p className="text-[9px] font-medium text-slate-500">
                  <Landmark
                    size={11}
                    className="mr-1 inline text-emerald-600"
                  />
                  VietQR
                </p>
                <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-900">
                  26.430.000
                </p>
                <p className="text-[9px] text-slate-400">₫</p>
              </div>
              <div className="rounded-lg bg-[#F3F6FC] p-3">
                <p className="text-[9px] font-medium text-slate-500">
                  <ReceiptText
                    size={11}
                    className="mr-1 inline text-slate-500"
                  />
                  Thẻ POS
                </p>
                <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-900">
                  8.120.000
                </p>
                <p className="text-[9px] text-slate-400">₫</p>
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="closing-cash"
                  className="text-[11px] font-semibold text-slate-700"
                >
                  Tổng tiền mặt thực tế trong két cuối ca
                </label>
                <span className="text-[9px] text-slate-500">
                  Bao gồm số dư đầu ca
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50/60 px-3 focus-within:border-[#0C66E4]">
                <span className="mr-2 text-sm font-semibold text-[#0C66E4]">
                  ₫
                </span>
                <input
                  id="closing-cash"
                  type="number"
                  min="0"
                  value={closingCash}
                  onChange={(event) =>
                    setClosingCash(Math.max(0, Number(event.target.value)))
                  }
                  className="w-full bg-transparent py-2.5 text-lg font-bold tabular-nums text-slate-900 outline-none"
                />
                <span className="text-[10px] font-semibold text-slate-400">
                  VND
                </span>
                <button
                  type="button"
                  title="Làm mới dữ liệu POS"
                  className="ml-2 rounded-md p-1.5 text-[#0C66E4] hover:bg-blue-100"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] text-slate-500">
                <span>
                  Tiền kỳ vọng trong két:{" "}
                  <b className="text-slate-700">18.400.000 ₫</b>
                </span>
                <span
                  className={
                    variance < 0
                      ? "font-semibold text-rose-600"
                      : "font-semibold text-emerald-700"
                  }
                >
                  Tự động đối soát
                </span>
              </div>
            </div>

            {variance < 0 ? (
              <div
                className="rounded-lg border border-rose-200 bg-rose-50 p-4"
                role="alert"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <AlertTriangle size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-rose-800">
                      Chênh lệch phát hiện: {formatCurrency(variance)} ₫
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-rose-700">
                      Thiếu hụt tiền mặt
                    </p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-rose-800">
                      Số tiền thực tế kiểm đếm ({formatCurrency(closingCash)} ₫)
                      thấp hơn số tiền theo sổ sách (18.400.000 ₫). Vui lòng
                      giải trình trước khi chốt ca.
                    </p>
                    <label
                      htmlFor="close-note"
                      className="mt-3 block text-[10px] font-semibold text-rose-800"
                    >
                      Giải trình lý do chênh lệch{" "}
                      <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="close-note"
                      rows={3}
                      value={closeNote}
                      onChange={(event) => setCloseNote(event.target.value)}
                      className="mt-1.5 w-full resize-none rounded-md border border-rose-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10"
                      placeholder="Ví dụ: Bàn giao sai mệnh giá hoặc đơn POS chưa đồng bộ..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[10px] font-semibold text-emerald-800">
                <CheckCircle2 size={15} /> Số tiền mặt đã khớp với sổ sách.
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                <span>
                  Bằng chứng đối soát (Sao kê máy POS & ảnh két cuối ca)
                </span>
                <span className="text-rose-500">*</span>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-4 py-5 text-center transition-colors hover:border-[#0C66E4] hover:bg-blue-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0C66E4] shadow-sm">
                  <Upload size={16} />
                </span>
                <span className="text-[10px] font-semibold text-slate-700">
                  Kéo thả hình ảnh vào đây hoặc{" "}
                  <b className="text-[#0C66E4]">Duyệt tệp máy tính</b>
                </span>
                <span className="text-[9px] text-slate-500">
                  Hỗ trợ JPG, PNG, HEIC hoặc PDF · Tối đa 15MB/tệp
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="sr-only"
                />
              </label>
              <p className="mt-2 flex items-center gap-1.5 text-[9px] text-emerald-700">
                <CheckCircle2 size={11} /> Đã đính kèm sao kê POS Vietcombank
                (14:52)
              </p>
            </div>
            <div>
              <label
                htmlFor="handover-note"
                className="mb-1.5 block text-[11px] font-semibold text-slate-700"
              >
                Ghi chú phát sinh chung cho ca tiếp theo
              </label>
              <input
                id="handover-note"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[10px] outline-none placeholder:text-slate-400 focus:border-[#0C66E4]"
                placeholder="Ghi nhận tồn nguyên vật liệu, quỹ thu ngân, giấy in bill sắp hết..."
              />
            </div>
            <button
              type="button"
              disabled={variance < 0 && !closeNote.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0C66E4] px-4 py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckCircle2 size={15} /> Chốt doanh thu & bàn giao ca
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
