import { Users, CreditCard, TrendingUp, CalendarDays } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { name: "Tổng Nhân Sự", value: "128", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Doanh Thu Tháng", value: "2.4B ₫", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Đơn Xin Nghỉ", value: "12", icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Tăng Trưởng", value: "+14%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan Dashboard</h1>
        <p className="text-slate-500 mt-1">Chào mừng bạn trở lại, đây là tình hình hôm nay.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg}`}>
                <Icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder for charts or recent activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Hoạt động gần đây</h3>
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            Chưa có dữ liệu hoạt động
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Biểu đồ doanh thu</h3>
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            Chưa có dữ liệu biểu đồ
          </div>
        </div>
      </div>
    </div>
  );
}
