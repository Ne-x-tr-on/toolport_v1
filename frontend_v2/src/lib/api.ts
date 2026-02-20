// api.ts
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/v1";
console.log("API BASE URL =", BASE_URL);

// Generic request helper
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("toolport_token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

/* =========================
   AUTH
========================= */

export const login = (data: { username: string; password: string }) =>
  request<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  request<{ success: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

/* =========================
   TOOLS
========================= */

export interface Tool {
  id: number;
  name: string;
  description: string;
  quantity: number;
  // add more fields your backend requires
}

export const getTools = async (): Promise<Tool[]> => {
  const res = await request<{ data: Tool[] }>("/tools");
  return Array.isArray(res.data) ? res.data : [];
};

export const getTool = (id: number | string) => request<Tool>(`/tools/${id}`);
export const createTool = (data: Tool) => request<Tool>("/tools", { method: "POST", body: JSON.stringify(data) });
export const updateTool = (id: number | string, data: Partial<Tool>) =>
  request<Tool>(`/tools/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTool = (id: number | string) => request(`/tools/${id}`, { method: "DELETE" });

/* =========================
   DELEGATIONS
========================= */

export const getDelegations = () => request<any[]>("/delegations");
export const getDelegation = (id: number | string) => request<any>(`/delegations/${id}`);
export const createDelegation = (data: any) => request<any>("/delegations", { method: "POST", body: JSON.stringify(data) });
export const returnDelegation = (id: number | string, data?: any) =>
  request<any>(`/delegations/${id}/return`, { method: "POST", body: data ? JSON.stringify(data) : undefined });

/* =========================
   STUDENTS
========================= */

export interface Student {
  id: number;
  username: string;
  name: string;
  email: string;
  department: string;
  // add more fields your backend requires
}

export const getStudents = async (): Promise<Student[]> => {
  const res = await request<{ data: Student[] }>("/students");
  return Array.isArray(res.data) ? res.data : [];
};

export const getStudent = (id: number | string) => request<Student>(`/students/${id}`);
export const createStudent = (data: Student) => request<Student>("/students", { method: "POST", body: JSON.stringify(data) });
export const updateStudent = (id: number | string, data: Partial<Student>) =>
  request<Student>(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteStudent = (id: number | string) => request(`/students/${id}`, { method: "DELETE" });

export const recoverLostTool = (studentId: string | number, delegationId: string | number) =>
  request(`/students/${studentId}/lost-tools/${delegationId}/recover`, { method: "POST" });
export const markToolAsPaid = (studentId: string | number, delegationId: string | number) =>
  request(`/students/${studentId}/lost-tools/${delegationId}/paid`, { method: "POST" });

/* =========================
   LABS
========================= */

export const getLabs = async () => {
  const res = await request<{ data: any[] }>("/labs");
  return Array.isArray(res.data) ? res.data : [];
};
export const getLab = (id: number | string) => request<any>(`/labs/${id}`);
export const createLab = (data: any) => request<any>("/labs", { method: "POST", body: JSON.stringify(data) });
export const updateLab = (id: number | string, data: any) => request<any>(`/labs/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteLab = (id: number | string) => request(`/labs/${id}`, { method: "DELETE" });

/* =========================
   LECTURERS
========================= */

export const getLecturers = async () => {
  const res = await request<{ data: any[] }>("/lecturers");
  return Array.isArray(res.data) ? res.data : [];
};
export const getLecturer = (id: number | string) => request<any>(`/lecturers/${id}`);
export const createLecturer = (data: any) => request<any>("/lecturers", { method: "POST", body: JSON.stringify(data) });
export const updateLecturer = (id: number | string, data: any) => request<any>(`/lecturers/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteLecturer = (id: number | string) => request(`/lecturers/${id}`, { method: "DELETE" });

/* =========================
   ANALYTICS
========================= */

export const getAnalyticsOverview = () => request<any>("/analytics/overview");
export const getAnalyticsUsage = () => request<any>("/analytics/usage");
