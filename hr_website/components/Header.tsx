"use client";

import {
  ArrowLeftRight,
  Bell,
  Loader2,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isPublicPath } from "@/lib/publicPaths";

type SearchResult = { id: number; title: string; type: string };

type UserProfile = { id: string; full_name: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Chủ sở hữu",
  CHU: "Quản lý chi nhánh",
  EMPLOYEE: "Nhân viên",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Public screens (login, register) have no session and no profile to show.
    if (isPublicPath(pathname)) {
      return;
    }

    let cancelled = false;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: UserProfile | null) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // The login and register screens render outside the authenticated shell.
  if (isPublicPath(pathname)) {
    return null;
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      // `replace` keeps the authenticated page out of the history, and `refresh` drops the
      // cached server render so the shell re-renders without a session.
      router.replace("/login");
      router.refresh();
    }
  }

  // Mock search function to mimic GET /api/search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      setShowDropdown(true);
      setIsSearching(true);
      // Simulate API call
      setTimeout(() => {
        setSearchResults([
          { id: 1, title: "Đơn xin nghỉ phép - Nguyễn Văn A", type: "request" },
          { id: 2, title: "Báo cáo doanh thu tháng 9", type: "report" },
        ]);
        setIsSearching(false);
      }, 500);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 md:px-6">
      <div className="relative w-full max-w-xl md:mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={16}
              className="text-slate-400 transition-colors group-focus-within:text-[#0C66E4]"
            />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border border-slate-200 bg-[#F8F9FF] py-2 pl-10 pr-14 text-xs leading-5 placeholder:text-slate-400 transition-all focus:border-[#0C66E4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 sm:text-sm"
            placeholder="Tìm nhanh nhân viên, đơn từ, mã ca làm..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() =>
              searchQuery.trim().length > 0 && setShowDropdown(true)
            }
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          <kbd className="pointer-events-none absolute inset-y-0 right-3 my-auto flex h-5 items-center rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">
            ⌘K
          </kbd>
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
            {isSearching ? (
              <div className="flex items-center justify-center p-4 text-slate-500">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-sm">Đang tìm kiếm...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="py-2">
                {searchResults.map((result) => (
                  <li
                    key={result.id}
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {result.title}
                    </span>
                    <span className="text-xs text-slate-500 uppercase mt-0.5">
                      {result.type}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                Không tìm thấy kết quả nào
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden shrink-0 items-center justify-end gap-2 md:flex">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          title="Đổi ca làm việc"
        >
          <ArrowLeftRight size={14} /> Đổi ca làm việc
        </button>
        <button
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          title="Thông báo"
        >
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>
        <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[#0C66E4]">
            <UserRound size={16} />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-slate-800">
              {profile?.full_name ?? "Đang tải..."}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {profile ? (ROLE_LABELS[profile.role] ?? profile.role) : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            title="Đăng xuất"
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
