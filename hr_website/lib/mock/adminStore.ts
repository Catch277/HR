export type AdminRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MockRequest = {
  id: string;
  code: string;
  employeeName: string;
  role: string;
  type: string;
  branch: string;
  branchId: string;
  range: string;
  submitted: string;
  status: AdminRequestStatus;
  rejectReason: string | null;
};

export type MockShift = {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  branchId: string;
  branch: string;
  date: string;
  dayLabel: string;
  shiftId: string;
  shiftLabel: string;
  start: string;
  end: string;
  status: "SCHEDULED" | "LEAVE";
};

export type MockEmployeeStatus = {
  id: string;
  name: string;
  role: string;
  branchId: string;
  branch: string;
  avatar: string;
  status: "WORKING" | "NOT_STARTED" | "ON_LEAVE" | "RESIGNED";
  checkIn: string | null;
  location: string | null;
};

export type MockAttendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  branch: string;
  date: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  status: "ON_TIME" | "LATE" | "EARLY_LEAVE";
  hours: number;
  complaint: string | null;
};

const requests: MockRequest[] = [
  { id: "89", code: "HR-2026-089", employeeName: "Lê Văn Tuấn", role: "Barista chính", type: "Nghỉ phép năm", branch: "Chi nhánh Quận 1", branchId: "q1", range: "28/10 – 29/10", submitted: "12 phút trước", status: "PENDING", rejectReason: null },
  { id: "90", code: "HR-2026-090", employeeName: "Trần Thị Bảo Ngọc", role: "Thu ngân", type: "Đổi ca", branch: "Chi nhánh Quận 3", branchId: "q3", range: "Ca chiều · 04/10", submitted: "38 phút trước", status: "PENDING", rejectReason: null },
  { id: "91", code: "HR-2026-091", employeeName: "Nguyễn Phương Linh", role: "Phục vụ", type: "Nghỉ phép năm", branch: "Chi nhánh Quận 1", branchId: "q1", range: "10/10 – 11/10", submitted: "1 giờ trước", status: "PENDING", rejectReason: null },
  { id: "92", code: "HR-2026-092", employeeName: "Lê Hoàng Long", role: "Pha chế", type: "Nghỉ ốm", branch: "Chi nhánh Quận 1", branchId: "q1", range: "01/10", submitted: "2 giờ trước", status: "APPROVED", rejectReason: null },
  { id: "93", code: "HR-2026-093", employeeName: "Phạm Minh Châu", role: "Trưởng ca", type: "Điều chỉnh công", branch: "Chi nhánh Quận 3", branchId: "q3", range: "Ca sáng · 29/09", submitted: "Hôm qua", status: "APPROVED", rejectReason: null },
  { id: "94", code: "HR-2026-094", employeeName: "Võ Minh Anh", role: "Thu ngân", type: "Nghỉ phép năm", branch: "Chi nhánh Bình Thạnh", branchId: "bt", range: "14/10", submitted: "Hôm qua", status: "REJECTED", rejectReason: "Nhân sự ca chưa đủ" },
];

const shifts: MockShift[] = [
  { id: "s1", employeeId: "e1", employeeName: "Lê Văn Tuấn", avatar: "LT", branchId: "q1", branch: "Chi nhánh Quận 1", date: "2026-10-05", dayLabel: "T2 05/10", shiftId: "morning", shiftLabel: "Ca sáng", start: "08:00", end: "17:00", status: "SCHEDULED" },
  { id: "s2", employeeId: "e2", employeeName: "Trần Thị Bảo Ngọc", avatar: "BN", branchId: "q1", branch: "Chi nhánh Quận 1", date: "2026-10-05", dayLabel: "T2 05/10", shiftId: "afternoon", shiftLabel: "Ca chiều", start: "13:00", end: "22:00", status: "SCHEDULED" },
  { id: "s3", employeeId: "e3", employeeName: "Nguyễn Phương Linh", avatar: "PL", branchId: "q3", branch: "Chi nhánh Quận 3", date: "2026-10-05", dayLabel: "T2 05/10", shiftId: "morning", shiftLabel: "Ca sáng", start: "08:00", end: "17:00", status: "SCHEDULED" },
  { id: "s4", employeeId: "e4", employeeName: "Lê Hoàng Long", avatar: "LL", branchId: "q3", branch: "Chi nhánh Quận 3", date: "2026-10-05", dayLabel: "T2 05/10", shiftId: "evening", shiftLabel: "Ca tối", start: "14:00", end: "23:00", status: "SCHEDULED" },
  { id: "s5", employeeId: "e5", employeeName: "Phạm Minh Châu", avatar: "PC", branchId: "bt", branch: "Chi nhánh Bình Thạnh", date: "2026-10-05", dayLabel: "T2 05/10", shiftId: "morning", shiftLabel: "Ca sáng", start: "08:00", end: "17:00", status: "SCHEDULED" },
  { id: "s6", employeeId: "e6", employeeName: "Võ Minh Anh", avatar: "MA", branchId: "bt", branch: "Chi nhánh Bình Thạnh", date: "2026-10-05", dayLabel: "T2 05/10", shiftId: "afternoon", shiftLabel: "Ca chiều", start: "13:00", end: "22:00", status: "SCHEDULED" },
];

const employeeStatuses: MockEmployeeStatus[] = [
  { id: "e1", name: "Lê Văn Tuấn", role: "Barista chính", branchId: "q1", branch: "Chi nhánh Quận 1", avatar: "LT", status: "WORKING", checkIn: "07:56", location: "Cổng chính · Quận 1" },
  { id: "e2", name: "Trần Thị Bảo Ngọc", role: "Thu ngân", branchId: "q1", branch: "Chi nhánh Quận 1", avatar: "BN", status: "NOT_STARTED", checkIn: null, location: null },
  { id: "e3", name: "Nguyễn Phương Linh", role: "Phục vụ", branchId: "q3", branch: "Chi nhánh Quận 3", avatar: "PL", status: "WORKING", checkIn: "08:04", location: "Quầy check-in · Quận 3" },
  { id: "e4", name: "Lê Hoàng Long", role: "Pha chế", branchId: "q3", branch: "Chi nhánh Quận 3", avatar: "LL", status: "ON_LEAVE", checkIn: null, location: null },
  { id: "e5", name: "Phạm Minh Châu", role: "Trưởng ca", branchId: "bt", branch: "Chi nhánh Bình Thạnh", avatar: "PC", status: "WORKING", checkIn: "08:01", location: "Cửa hàng · Bình Thạnh" },
  { id: "e6", name: "Võ Minh Anh", role: "Thu ngân", branchId: "bt", branch: "Chi nhánh Bình Thạnh", avatar: "MA", status: "RESIGNED", checkIn: null, location: null },
];

const attendance: MockAttendance[] = [
  { id: "a1", employeeId: "e1", employeeName: "Lê Văn Tuấn", avatar: "LT", branch: "Chi nhánh Quận 1", date: "01/10/2026", shift: "Ca sáng", checkIn: "07:56", checkOut: "17:03", status: "ON_TIME", hours: 9.1, complaint: null },
  { id: "a2", employeeId: "e1", employeeName: "Lê Văn Tuấn", avatar: "LT", branch: "Chi nhánh Quận 1", date: "02/10/2026", shift: "Ca sáng", checkIn: "08:14", checkOut: "17:01", status: "LATE", hours: 8.8, complaint: null },
  { id: "a3", employeeId: "e2", employeeName: "Trần Thị Bảo Ngọc", avatar: "BN", branch: "Chi nhánh Quận 1", date: "02/10/2026", shift: "Ca chiều", checkIn: "12:58", checkOut: "21:20", status: "EARLY_LEAVE", hours: 8.4, complaint: "Xin kiểm tra lại giờ ra ca." },
  { id: "a4", employeeId: "e3", employeeName: "Nguyễn Phương Linh", avatar: "PL", branch: "Chi nhánh Quận 3", date: "03/10/2026", shift: "Ca sáng", checkIn: "07:59", checkOut: "17:00", status: "ON_TIME", hours: 9.0, complaint: null },
  { id: "a5", employeeId: "e5", employeeName: "Phạm Minh Châu", avatar: "PC", branch: "Chi nhánh Bình Thạnh", date: "03/10/2026", shift: "Ca sáng", checkIn: "08:09", checkOut: "17:02", status: "LATE", hours: 8.9, complaint: null },
  { id: "a6", employeeId: "e5", employeeName: "Phạm Minh Châu", avatar: "PC", branch: "Chi nhánh Bình Thạnh", date: "04/10/2026", shift: "Ca sáng", checkIn: "07:55", checkOut: "17:00", status: "ON_TIME", hours: 9.1, complaint: null },
];

export const branches = [
  { id: "all", name: "Tất cả chi nhánh" },
  { id: "q1", name: "Chi nhánh Quận 1" },
  { id: "q3", name: "Chi nhánh Quận 3" },
  { id: "bt", name: "Chi nhánh Bình Thạnh" },
];

export const shiftOptions = [
  { id: "off", label: "Nghỉ", start: "", end: "" },
  { id: "morning", label: "Ca sáng", start: "08:00", end: "17:00" },
  { id: "afternoon", label: "Ca chiều", start: "13:00", end: "22:00" },
  { id: "evening", label: "Ca tối", start: "14:00", end: "23:00" },
];

export function getMockRequests(status?: string, branchId?: string) {
  return requests.filter((item) =>
    (!status || status === "all" || item.status === status) &&
    (!branchId || branchId === "all" || item.branchId === branchId),
  );
}

export function reviewMockRequest(id: string, status: "APPROVED" | "REJECTED", rejectReason: string | null) {
  const item = requests.find((request) => request.id === id);
  if (!item) return null;
  item.status = status;
  item.rejectReason = status === "REJECTED" ? rejectReason : null;
  return item;
}

export function getMockShifts(branchId?: string, startDate?: string, endDate?: string) {
  return shifts.filter((item) =>
    (!branchId || branchId === "all" || item.branchId === branchId) &&
    (!startDate || item.date >= startDate) &&
    (!endDate || item.date <= endDate),
  );
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

export function createMockShift(input: {
  employeeId: string;
  date: string;
  branchId: string;
  shiftId: string;
}) {
  const employee = employeeStatuses.find((item) => item.id === input.employeeId);
  const branch = branches.find((item) => item.id === input.branchId && item.id !== "all");
  const option = shiftOptions.find((item) => item.id === input.shiftId);
  if (!employee || !branch || !option || option.id === "off") return { error: "Dữ liệu tạo ca không hợp lệ." };

  const sameDay = shifts.filter((item) => item.employeeId === input.employeeId && item.date === input.date && item.status !== "LEAVE");
  if (sameDay.some((item) => hasOverlap(item.start, item.end, option.start, option.end))) {
    return { error: "Nhân viên đã có ca bị trùng thời gian trong ngày này." };
  }

  const id = `s${Date.now()}`;
  const created: MockShift = {
    id,
    employeeId: employee.id,
    employeeName: employee.name,
    avatar: employee.avatar,
    branchId: branch.id,
    branch: branch.name,
    date: input.date,
    dayLabel: "",
    shiftId: option.id,
    shiftLabel: option.label,
    start: option.start,
    end: option.end,
    status: "SCHEDULED",
  };
  shifts.push(created);
  return { item: created };
}

export function updateMockShift(id: string, input: {
  employeeId?: string;
  date?: string;
  branchId?: string;
  shiftId?: string;
}) {
  const item = shifts.find((shift) => shift.id === id);
  if (!item) return { error: "Không tìm thấy ca." };

  const employee = employeeStatuses.find((entry) => entry.id === (input.employeeId ?? item.employeeId));
  const branch = branches.find((entry) => entry.id === (input.branchId ?? item.branchId) && entry.id !== "all");
  const option = shiftOptions.find((entry) => entry.id === (input.shiftId ?? item.shiftId));
  if (!employee || !branch || !option) return { error: "Dữ liệu cập nhật ca không hợp lệ." };

  if (option.id === "off") {
    item.employeeId = employee.id;
    item.employeeName = employee.name;
    item.avatar = employee.avatar;
    item.branchId = branch.id;
    item.branch = branch.name;
    item.date = input.date ?? item.date;
    item.shiftId = "off";
    item.shiftLabel = "Nghỉ";
    item.start = "";
    item.end = "";
    item.status = "LEAVE";
    return { item };
  }

  const targetDate = input.date ?? item.date;
  const sameDay = shifts.filter((entry) => entry.id !== id && entry.employeeId === employee.id && entry.date === targetDate && entry.status !== "LEAVE");
  if (sameDay.some((entry) => hasOverlap(entry.start, entry.end, option.start, option.end))) {
    return { error: "Nhân viên đã có ca bị trùng thời gian trong ngày này." };
  }

  item.employeeId = employee.id;
  item.employeeName = employee.name;
  item.avatar = employee.avatar;
  item.branchId = branch.id;
  item.branch = branch.name;
  item.date = targetDate;
  item.shiftId = option.id;
  item.shiftLabel = option.label;
  item.start = option.start;
  item.end = option.end;
  item.status = "SCHEDULED";
  return { item };
}

export function deleteMockShift(id: string) {
  const index = shifts.findIndex((shift) => shift.id === id);
  if (index === -1) return false;
  shifts.splice(index, 1);
  return true;
}

export function getMockEmployeeStatuses(branchId?: string) {
  return employeeStatuses.filter((item) => !branchId || branchId === "all" || item.branchId === branchId);
}

export function getMockAttendance(branchId?: string, employeeId?: string) {
  return attendance.filter((item) =>
    (!branchId || branchId === "all" || item.branch === branches.find((branch) => branch.id === branchId)?.name) &&
    (!employeeId || employeeId === "all" || item.employeeId === employeeId),
  );
}

export function addMockComplaint(id: string, complaint: string) {
  const item = attendance.find((row) => row.id === id);
  if (!item) return null;
  item.complaint = complaint;
  return item;
}
