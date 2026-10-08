export interface Branch {
  id: string;
  name: string;
  address: string | null;
  manager_id: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance_radius: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchInput {
  name: string;
  address: string | null;
  managerId: string | null;
  latitude: number | null;
  longitude: number | null;
  attendanceRadius: number;
}

export interface UpdateBranchInput {
  name: string;
  address: string | null;
  managerId: string | null;
  latitude: number | null;
  longitude: number | null;
  attendanceRadius: number;
}
