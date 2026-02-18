// api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

// Generic request helper
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

/* =========================
   AUTH
========================= */

// POST /auth/login
export const login = (data: { username: string; password: string }) =>
  request<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

// POST /auth/change-password
export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  request<{ success: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

/* =========================
   TOOLS
========================= */

// GET /tools
export const getTools = () => request<any[]>("/tools");

// GET /tools/:id
export const getTool = (id: number | string) => request<any>(`/tools/${id}`);

// POST /tools
export const createTool = (data: any) =>
  request<any>("/tools", { method: "POST", body: JSON.stringify(data) });

// PUT /tools/:id
export const updateTool = (id: number | string, data: any) =>
  request<any>(`/tools/${id}`, { method: "PUT", body: JSON.stringify(data) });

// DELETE /tools/:id
export const deleteTool = (id: number | string) =>
  request(`/tools/${id}`, { method: "DELETE" });

/* =========================
   DELEGATIONS
========================= */

// GET /delegations
export const getDelegations = () => request<any[]>("/delegations");

// GET /delegations/:id
export const getDelegation = (id: number | string) => request<any>(`/delegations/${id}`);

// POST /delegations
export const createDelegation = (data: any) =>
  request<any>("/delegations", { method: "POST", body: JSON.stringify(data) });

// POST /delegations/:id/return
export const returnDelegation = (id: number | string, data?: any) =>
  request<any>(`/delegations/${id}/return`, { method: "POST", body: data ? JSON.stringify(data) : undefined });

/* =========================
   STUDENTS
========================= */

// GET /students
export const getStudents = () => request<any[]>("/students");

// GET /students/:id
export const getStudent = (id: number | string) => request<any>(`/students/${id}`);

// POST /students
export const createStudent = (data: any) =>
  request<any>("/students", { method: "POST", body: JSON.stringify(data) });

// PUT /students/:id
export const updateStudent = (id: number | string, data: any) =>
  request<any>(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) });

// DELETE /students/:id
export const deleteStudent = (id: number | string) =>
  request(`/students/${id}`, { method: "DELETE" });

// POST /students/:student_id/lost-tools/:delegation_id/recover
export const recoverLostTool = (studentId: string | number, delegationId: string | number) =>
  request(`/students/${studentId}/lost-tools/${delegationId}/recover`, { method: "POST" });

// POST /students/:student_id/lost-tools/:delegation_id/paid
export const markToolAsPaid = (studentId: string | number, delegationId: string | number) =>
  request(`/students/${studentId}/lost-tools/${delegationId}/paid`, { method: "POST" });

/* =========================
   LABS
========================= */

// GET /labs
export const getLabs = () => request<any[]>("/labs");

// GET /labs/:id
export const getLab = (id: number | string) => request<any>(`/labs/${id}`);

// POST /labs
export const createLab = (data: any) =>
  request<any>("/labs", { method: "POST", body: JSON.stringify(data) });

// PUT /labs/:id
export const updateLab = (id: number | string, data: any) =>
  request<any>(`/labs/${id}`, { method: "PUT", body: JSON.stringify(data) });

// DELETE /labs/:id
export const deleteLab = (id: number | string) =>
  request(`/labs/${id}`, { method: "DELETE" });

/* =========================
   LECTURERS
========================= */

// GET /lecturers
export const getLecturers = () => request<any[]>("/lecturers");

// GET /lecturers/:id
export const getLecturer = (id: number | string) => request<any>(`/lecturers/${id}`);

// POST /lecturers
export const createLecturer = (data: any) =>
  request<any>("/lecturers", { method: "POST", body: JSON.stringify(data) });

// PUT /lecturers/:id
export const updateLecturer = (id: number | string, data: any) =>
  request<any>(`/lecturers/${id}`, { method: "PUT", body: JSON.stringify(data) });

// DELETE /lecturers/:id
export const deleteLecturer = (id: number | string) =>
  request(`/lecturers/${id}`, { method: "DELETE" });

/* =========================
   ANALYTICS
========================= */

// GET /analytics/overview
export const getAnalyticsOverview = () => request<any>("/analytics/overview");

// GET /analytics/usage
export const getAnalyticsUsage = () => request<any>("/analytics/usage");
