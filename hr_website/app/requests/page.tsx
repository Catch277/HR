"use client";

import { AlertTriangle, Check, Clock3, Filter, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RequestItem = { id: string; code: string; employeeName: string; role: string; type: string; branch: string; range: string; submitted: string; status: "PENDING" | "APPROVED" | "REJECTED"; rejectReason: string | null };
const reasons = ["Trùng lịch", "Hết phép năm có lương", "Nhân sự ca chưa đủ", "Nộp đơn muộn so với quy định"];

const statusText: Record<RequestItem["status"], string> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };

export default function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [tab, setTab] = useState("all");
  const [branch, setBranch] = useState("all");
  const [query, setQuery] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab.toUpperCase());
    if (branch !== "all") params.set("branch_id", branch);
    const res = await fetch(`/api/requests?${params.toString()}`, { cache: "no-store" });
    setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { void load(); }, [tab, branch]);

  const filtered = useMemo(() => items.filter((item) => `${item.employeeName} ${item.code} ${item.type}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const counts = useMemo(() => ({ all: items.length, pending: items.filter((x) => x.status === "PENDING").length, approved: items.filter((x) => x.status === "APPROVED").length, rejected: items.filter((x) => x.status === "REJECTED").length }), [items]);

  async function review(id: string, status: "APPROVED" | "REJECTED", rejectReason?: string) {
    const res = await fetch(`/api/requests/${id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reject_reason: rejectReason ?? null }) });
    if (!res.ok) { const data = await res.json(); alert(data.error ?? "Không thể cập nhật đơn."); return; }
    await load();
    setRejectId(null); setReason("");
  }

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nhân sự / SCRUM-41</p><h1 className="text-2xl font-bold tracking-tight">Quản lý duyệt đơn nghỉ phép</h1><p className="mt-1 text-xs text-slate-500">Duyệt hoặc từ chối đơn và kiểm soát ca bị ảnh hưởng.</p></div>
      <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
        <Stat label="Tổng đơn" value={counts.all} /><Stat label="Chờ duyệt" value={counts.pending} tone="amber" /><Stat label="Đã duyệt" value={counts.approved} tone="green" />
      </div>
    </div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-1">
          {[['all','Tất cả'],['pending','Chờ duyệt'],['approved','Đã duyệt'],['rejected','Từ chối']].map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-md px-3 py-2 text-xs font-semibold ${tab === key ? 'bg-[#0C66E4] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><Search size={14} className="text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-44 bg-transparent text-xs outline-none" placeholder="Tìm nhân viên, mã đơn..."/></label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"><Filter size={14}/><select value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-transparent outline-none"><option value="all">Tất cả chi nhánh</option><option value="q1">Quận 1</option><option value="q3">Quận 3</option><option value="bt">Bình Thạnh</option></select></label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Nhân viên</th><th>Đơn</th><th>Thời gian / ca ảnh hưởng</th><th>Chi nhánh</th><th>Trạng thái</th><th className="px-5">Thao tác</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Đang tải dữ liệu...</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/70">
          <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar text={item.employeeName.split(' ').map(x => x[0]).slice(-2).join('')}/><div><p className="font-semibold text-slate-800">{item.employeeName}</p><p className="text-xs text-slate-500">{item.role}</p></div></div></td>
          <td><p className="font-medium text-slate-700">{item.code}</p><p className="text-xs text-slate-500">{item.type}</p></td>
          <td><p className="font-medium text-slate-700">{item.range}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12}/>{item.submitted}</p></td>
          <td className="text-xs text-slate-600">{item.branch}</td>
          <td><Badge status={item.status}/>{item.rejectReason && <p className="mt-1 max-w-[180px] text-[11px] text-rose-600">{item.rejectReason}</p>}</td>
          <td className="px-5">{item.status === 'PENDING' ? <div className="flex gap-2"><button onClick={() => void review(item.id,'APPROVED')} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><Check size={14}/>Duyệt</button><button onClick={() => {setRejectId(item.id);setReason('')}} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"><X size={14}/>Từ chối</button></div> : <span className="text-xs text-slate-400">Đã xử lý</span>}</td>
        </tr>)}</tbody></table>
      </div>
    </section>
    {rejectId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="font-bold text-slate-900">Từ chối đơn nghỉ phép</h2><p className="mt-1 text-xs text-slate-500">Lý do là bắt buộc theo yêu cầu nghiệp vụ.</p></div><button onClick={() => setRejectId(null)}><X size={18} className="text-slate-400"/></button></div><div className="mt-5 flex flex-wrap gap-2">{reasons.map((x) => <button key={x} onClick={() => setReason(x)} className={`rounded-full border px-3 py-1.5 text-xs ${reason === x ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>{x}</button>)}</div><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" placeholder="Nhập lý do từ chối..."/><div className="mt-4 flex justify-end gap-2"><button onClick={() => setRejectId(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold">Hủy</button><button disabled={!reason.trim()} onClick={() => void review(rejectId,'REJECTED',reason)} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Xác nhận từ chối</button></div></div></div>}
  </div>;
}
function Stat({label,value,tone='slate'}:{label:string;value:number;tone?:string}){const c=tone==='amber'?'border-amber-200 bg-amber-50/70 text-amber-800':tone==='green'?'border-emerald-200 bg-emerald-50/70 text-emerald-800':'border-slate-200 bg-white text-slate-900';return <div className={`rounded-lg border px-3 py-2.5 ${c}`}><p className="text-[9px] font-semibold uppercase opacity-70">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>}
function Avatar({text}:{text:string}){return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{text}</div>}
function Badge({status}:{status:RequestItem['status']}){const c=status==='PENDING'?'bg-amber-50 text-amber-700':status==='APPROVED'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700';return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${c}`}>{statusText[status]}</span>}
