import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  MapPin,
  TrendingUp,
  Wallet,
} from "lucide-react";

const dailyRevenue = [38, 55, 31, 72, 79, 49, 66, 91, 61, 76, 82, 57, 88, 96];

const reportRows = [
  {
    date: "02/10/2026",
    shift: "Ca Tối · 15:00–23:00",
    lead: "Lê Hoàng Nam",
    open: "2.000.000",
    close: "24.850.000",
    revenue: "22.850.000",
    diff: "0",
    status: "Khớp",
  },
  {
    date: "02/10/2026",
    shift: "Ca Sáng · 07:00–15:00",
    lead: "Phạm Mỹ Linh",
    open: "1.500.000",
    close: "17.250.000",
    revenue: "15.800.000",
    diff: "-50.000",
    status: "Lệch nhẹ",
  },
  {
    date: "01/10/2026",
    shift: "Ca Tối · 15:00–23:00",
    lead: "Trần Quốc Bảo",
    open: "2.000.000",
    close: "19.420.000",
    revenue: "17.420.000",
    diff: "0",
    status: "Khớp",
  },
  {
    date: "01/10/2026",
    shift: "Ca Sáng · 07:00–15:00",
    lead: "Võ Thùy Chi",
    open: "1.500.000",
    close: "14.600.000",
    revenue: "13.100.000",
    diff: "0",
    status: "Khớp",
  },
  {
    date: "30/09/2026",
    shift: "Ca Tối · 15:00–23:00",
    lead: "Đinh Gia Huy",
    open: "2.000.000",
    close: "18.900.000",
    revenue: "16.900.000",
    diff: "-20.000",
    status: "Lệch nhẹ",
  },
];

const metrics = [
  {
    label: "Tổng tiền đầu ca",
    value: "45.200.000 ₫",
    delta: "+4,2%",
    note: "so với tháng trước",
    icon: Wallet,
    tone: "blue",
  },
  {
    label: "Tổng tiền cuối ca thực tế",
    value: "892.450.000 ₫",
    delta: "+12,8%",
    note: "tổng dòng tiền thu",
    icon: CircleDollarSign,
    tone: "green",
  },
  {
    label: "Tổng doanh thu thuần",
    value: "847.250.000 ₫",
    delta: "Đạt 108% KPI",
    note: "mục tiêu: 780 triệu",
    icon: TrendingUp,
    tone: "mint",
  },
  {
    label: "Tỷ lệ chênh lệch / hao hụt",
    value: "-1.350.000 ₫",
    delta: "↓ 22,5%",
    note: "giảm hao hụt lệch ca",
    icon: ArrowDownRight,
    tone: "amber",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Tài chính & thu / SCRUM-44
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Báo cáo & Phân tích Doanh thu
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Theo dõi doanh thu, dòng tiền và mức độ đối soát tại các chi nhánh.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <TrendingUp size={14} /> Đối soát tự động
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Download size={14} /> In sổ sách
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#0C66E4] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label="Chọn kỳ báo cáo"
        >
          <span className="px-2 text-[10px] font-semibold uppercase text-slate-400">
            Kỳ báo cáo
          </span>
          {[
            { label: "Hôm nay", active: false },
            { label: "Tuần này", active: false },
            { label: "Tháng này", active: true },
          ].map(({ label, active }) => (
            <button
              key={label}
              className={`rounded-md px-3 py-2 text-xs font-medium ${active ? "bg-[#0C66E4] text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
            <MapPin size={14} className="text-slate-400" />
            <select
              aria-label="Chi nhánh"
              className="min-w-32 bg-transparent font-medium text-slate-700 outline-none"
            >
              <option>Chi nhánh Q.1 - HCM</option>
              <option>Chi nhánh Q.3 - HCM</option>
              <option>Tất cả chi nhánh</option>
            </select>
            <ChevronDown size={13} className="text-slate-400" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
            <CalendarDays size={14} className="text-slate-400" />
            <input
              aria-label="Khoảng ngày báo cáo"
              className="w-36 bg-transparent font-medium text-slate-700 outline-none"
              type="text"
              defaultValue="01/10/2026 - 31/10/2026"
            />
          </label>
          <button className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#0C66E4] hover:bg-blue-100">
            Áp dụng
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="rounded-xl border border-slate-200/80 border-b-2 border-b-blue-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
                  {metric.label}
                </p>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.tone === "green" ? "bg-emerald-50 text-emerald-600" : metric.tone === "mint" ? "bg-teal-50 text-teal-600" : metric.tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-[#0C66E4]"}`}
                >
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                {metric.value}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span
                  className={`rounded px-1.5 py-1 font-semibold ${metric.tone === "amber" ? "bg-emerald-50 text-emerald-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  <ArrowUpRight size={11} className="mr-0.5 inline" />
                  {metric.delta}
                </span>
                <span className="text-slate-400">{metric.note}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.8fr]">
        <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Biến động doanh thu theo ngày
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                So sánh doanh thu thực thu với mục tiêu trong tháng 10/2026
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-sm bg-[#0C66E4]" /> Doanh thu thực
                thu
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-sm bg-emerald-500" /> Mục tiêu KPI
              </span>
            </div>
          </div>
          <div className="relative mt-6 h-52 border-b border-slate-200 bg-[linear-gradient(to_bottom,transparent_24%,#e8edf5_25%,transparent_25%,transparent_49%,#e8edf5_50%,transparent_50%,transparent_74%,#e8edf5_75%,transparent_75%)]">
            <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-between gap-1 px-2">
              {dailyRevenue.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="group relative flex h-full flex-1 items-end"
                >
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-blue-200 to-[#0C66E4] transition-colors group-hover:from-blue-300 group-hover:to-blue-700"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-2 top-[34%] border-t-2 border-dashed border-emerald-500/80" />
          </div>
          <div className="mt-2 flex justify-between px-1 text-[9px] text-slate-400">
            <span>01/10</span>
            <span>04/10</span>
            <span>07/10</span>
            <span>10/10</span>
            <span>13/10</span>
            <span>16/10</span>
            <span>19/10</span>
            <span>22/10</span>
            <span>25/10</span>
            <span>28/10</span>
            <span>31/10</span>
          </div>
          <div className="mt-4 flex flex-col gap-2 rounded-lg bg-blue-50/80 px-3 py-2 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <TrendingUp size={13} className="mr-1 inline text-emerald-600" />
              Đỉnh doanh thu ngày <b>31/10: 38.650.000 ₫</b> (Đêm Halloween)
            </span>
            <span>
              Trung bình ca: <b>14.120.000 ₫</b>
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">
            Phương thức thanh toán
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Tỷ trọng luồng tiền tiếp nhận tại ca
          </p>
          <div className="mx-auto my-4 flex h-40 w-40 items-center justify-center">
            <div className="relative h-full w-full">
              <svg
                className="h-full w-full -rotate-90"
                viewBox="0 0 120 120"
                role="img"
                aria-label="Biểu đồ donut phương thức thanh toán"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="43"
                  fill="none"
                  stroke="#E6ECF5"
                  strokeWidth="14"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="43"
                  fill="none"
                  stroke="#0C66E4"
                  strokeWidth="14"
                  strokeDasharray="146 270"
                  strokeDashoffset="0"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="43"
                  fill="none"
                  stroke="#11A879"
                  strokeWidth="14"
                  strokeDasharray="76 270"
                  strokeDashoffset="-150"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="43"
                  fill="none"
                  stroke="#F4B740"
                  strokeWidth="14"
                  strokeDasharray="48 270"
                  strokeDashoffset="-230"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <b className="text-lg tabular-nums text-slate-900">847,25tr</b>
                <span className="text-[9px] text-slate-500">100% ghi nhận</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <i className="h-2 w-2 rounded-full bg-[#0C66E4]" />
                Chuyển khoản QR động
              </span>
              <b className="text-slate-800">
                54%{" "}
                <span className="ml-2 font-normal text-slate-400">
                  457,51tr
                </span>
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <i className="h-2 w-2 rounded-full bg-emerald-500" />
                Thẻ POS / Visa / Master
              </span>
              <b className="text-slate-800">
                28%{" "}
                <span className="ml-2 font-normal text-slate-400">
                  237,23tr
                </span>
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <i className="h-2 w-2 rounded-full bg-amber-400" />
                Tiền mặt tại quầy
              </span>
              <b className="text-slate-800">
                18%{" "}
                <span className="ml-2 font-normal text-slate-400">
                  152,50tr
                </span>
              </b>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Bảng dữ liệu chi tiết ca làm việc
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              Tổng cộng 62 ca làm việc trong khoảng thời gian đã chọn
            </p>
          </div>
          <button className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <MapPin size={13} /> Lọc theo trưởng ca hoặc ngày{" "}
            <ChevronDown size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ngày / Thời gian</th>
                <th className="px-4 py-3">Ca làm việc</th>
                <th className="px-4 py-3">Trưởng ca / Nhân sự</th>
                <th className="px-4 py-3 text-right">Tiền đầu ca</th>
                <th className="px-4 py-3 text-right">Tiền cuối ca</th>
                <th className="px-4 py-3 text-right">Doanh thu ghi nhận</th>
                <th className="px-4 py-3 text-right">Chênh lệch</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.map((row) => (
                <tr
                  key={`${row.date}-${row.shift}`}
                  className="transition-colors hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                    {row.date}
                    <span className="mt-1 block text-[9px] font-normal text-slate-400">
                      Thứ Năm
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {row.shift}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                    {row.lead}
                    <span className="mt-1 block text-[9px] text-slate-400">
                      NV-00892
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.open} ₫
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.close} ₫
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#0C66E4]">
                    {row.revenue} ₫
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${row.diff.startsWith("-") ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {row.diff} ₫
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-semibold ${row.status === "Khớp" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500">
          <span>
            Hiển thị <b className="text-slate-700">1–5</b> trên tổng số 62 ca
            làm việc
          </span>
          <div className="flex items-center gap-1">
            <button className="rounded-md px-2 py-1 text-slate-400">‹</button>
            <button className="rounded-md bg-[#0C66E4] px-2.5 py-1 font-semibold text-white">
              1
            </button>
            <button className="rounded-md px-2.5 py-1 hover:bg-slate-100">
              2
            </button>
            <button className="rounded-md px-2.5 py-1 hover:bg-slate-100">
              3
            </button>
            <span className="px-1">…</span>
            <button className="rounded-md px-2.5 py-1 hover:bg-slate-100">
              12
            </button>
            <button className="rounded-md px-2 py-1 text-slate-600">›</button>
          </div>
        </div>
      </section>
    </div>
  );
}
