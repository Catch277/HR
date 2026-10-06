"use client";

import {
  Bell,
  Bot,
  Building2,
  CircleDollarSign,
  Clock3,
  FileText,
  CalendarRange,
  UserCheck,
  ClipboardCheck,
  LayoutDashboard,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Doanh thu", href: "/revenue", icon: CircleDollarSign },
  { name: "Đơn từ", href: "/requests", icon: FileText },
  { name: "Xếp ca", href: "/shifts", icon: CalendarRange },
  { name: "Trạng thái nhân viên", href: "/employee-status", icon: UserCheck },
  { name: "Bảng công", href: "/attendance", icon: ClipboardCheck },
  { name: "Báo cáo", href: "/reports", icon: PieChart },
  { name: "Thông báo", href: "/notifications", icon: Bell },
  { name: "Trợ lý AI", href: "/chat", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="z-20 hidden h-dvh w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-sm md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0C66E4] text-sm font-bold text-white shadow-sm shadow-blue-200">
          H
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">Humora</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">
            HR & Shift Intelligence
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Hệ thống quản lý
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-blue-50 font-semibold text-[#0C66E4]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                size={17}
                className={
                  isActive
                    ? "text-[#0C66E4]"
                    : "text-slate-400 transition-colors group-hover:text-slate-600"
                }
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="m-3 rounded-xl border border-blue-100 bg-[#F1F5FF] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Building2 size={14} className="text-[#0C66E4]" />
          Chi nhánh Q.1 - HCM
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock3 size={12} /> Ca chính: 08:00 - 17:30
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Bản phát hành{" "}
          <span className="float-right font-medium text-slate-700">v2.4</span>
        </p>
      </div>
    </aside>
  );
}
