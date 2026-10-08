"use client";

import {
  Bell,
  Bot,
  Building2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  CalendarRange,
  Landmark,
  PackageSearch,
  UserCheck,
  UsersRound,
  ClipboardCheck,
  LayoutDashboard,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { isPublicPath, isShellLessPath } from "@/lib/publicPaths";

const navItems = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Quản lý chi nhánh", href: "/branches", icon: Building2 },
  { name: "Cơ sở vật chất", href: "/facilities", icon: PackageSearch },
  { name: "Doanh thu", href: "/revenue", icon: CircleDollarSign },
  { name: "Đơn từ", href: "/requests", icon: FileText },
  { name: "Lịch làm việc", href: "/schedules", icon: CalendarRange },
  { name: "Trạng thái nhân viên", href: "/employee-status", icon: UserCheck },
  { name: "Bảng công", href: "/attendance", icon: ClipboardCheck },
  { name: "Quản lý nhân sự", href: "/staff", icon: UsersRound },
  { name: "Báo cáo", href: "/reports", icon: PieChart },
  { name: "Thông báo", href: "/notifications", icon: Bell },
  { name: "Trợ lý AI", href: "/chat", icon: Bot },
];

type OrganizationSummary = {
  organization: { id: string; name: string } | null;
  member_count: number;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);

  // The organization card in the footer; anything unexpected (no session, script not applied yet)
  // simply leaves it empty instead of breaking the navigation.
  useEffect(() => {
    if (isPublicPath(pathname)) {
      return;
    }

    let cancelled = false;

    fetch("/api/organizations/current", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: OrganizationSummary | null) => {
        if (!cancelled) {
          setOrganization(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrganization(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Onboarding screens hide the navigation (every link would bounce back) but keep the header.
  if (isShellLessPath(pathname)) {
    return null;
  }

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

      {/*
        The organization screen is deliberately not a navigation tab (SCRUM-51): setup happens once,
        right after login, and lives in `/onboarding`. This card is how the owner gets back to it,
        and the redirect in `proxy.ts` sends an account without an organization to `/onboarding`
        instead — so the same link serves both cases.
      */}
      <Link
        href="/organization"
        className="m-3 rounded-xl border border-blue-100 bg-[#F1F5FF] p-3 transition-colors hover:border-blue-200 hover:bg-[#E8EFFF]"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Landmark size={14} className="text-[#0C66E4]" />
          <span className="truncate">
            {organization?.organization?.name ?? "Chưa có tổ chức"}
          </span>
          <ChevronRight size={14} className="ml-auto shrink-0 text-slate-400" />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          {organization?.organization ? (
            <>
              <UsersRound size={12} />
              {organization.member_count} thành viên
            </>
          ) : (
            <>
              <Landmark size={12} />
              Nhấn để tạo hoặc tham gia tổ chức
            </>
          )}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Bản phát hành{" "}
          <span className="float-right font-medium text-slate-700">v2.5</span>
        </p>
      </Link>
    </aside>
  );
}

