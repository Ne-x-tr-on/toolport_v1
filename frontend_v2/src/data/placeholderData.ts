// ==================== TYPES ====================

export type ToolCategory = "Hand Tool" | "Electrical Tool" | "Electronic Component" | "Mechatronics" | "Consumable";

export type ToolSubcategory =
  | "Screwdriver" | "Pliers" | "Wrench" | "Hammer" | "Wire Stripper" | "Soldering"
  | "Multimeter" | "Oscilloscope" | "Power Supply" | "Signal Generator"
  | "Resistor" | "Capacitor" | "Diode" | "IC" | "Transistor" | "LED"
  | "Sensor" | "Motor" | "Actuator" | "Microcontroller" | "Driver Module"
  | "Carbon Film Resistor" | "Metal Film Resistor" | "Ceramic Capacitor" | "Electrolytic Capacitor"
  | "Solder Wire" | "Flux" | "Jumper Wire" | "Breadboard Wire"
  | "Other";

export type ToolUnit = "pcs" | "sets" | "boxes";

export type ToolStatus = "Available" | "Partially Issued" | "Out of Stock" | "Low Stock";

export type DelegationStatus = "Issued" | "Returned" | "Overdue" | "Lost";
export type ConditionGrade = "Excellent" | "Good" | "Fair" | "Damaged";

export type StudentAccountStatus = "Active" | "Banned";

export interface Tool {
  id: number;
  name: string;
  category: ToolCategory;
  subcategory: ToolSubcategory;
  quantity: number;
  issuedQty: number;
  unit: ToolUnit;
  lab: string;
  description: string;
  dateAdded: string;
  status: ToolStatus;
  consumableType?: string;
  lowStockThreshold: number;
  isConsumable: boolean;
}

export interface Lecturer {
  id: number;
  name: string;
  department: string;
  email: string;
}

export interface Student {
  studentId: string;
  name: string;
  className: string;
  department: string;
  email: string;
  accountStatus: StudentAccountStatus;
  lostToolCount: number;
  units: string[];
}

export interface Delegation {
  id: number;
  toolId: number;
  toolName: string;
  quantity: number;
  lecturerId: number;
  lecturerName: string;
  studentId: string;
  studentName: string;
  className: string;
  dateIssued: string;
  expectedReturn: string;
  expectedReturnTime: string;
  dateReturned: string;
  actualCheckoutTime: string;
  actualReturnTime: string;
  status: DelegationStatus;
  conditionBefore: string;
  conditionAfter: string;
  isInterDepartmental: boolean;
  guestDepartment?: string;
  guestLabProject?: string;
}

export interface Lab {
  id: number;
  name: string;
  location: string;
  department: string;
  description: string;
  toolCount: number;
}

export interface LostToolRecord {
  delegationId: number;
  toolName: string;
  quantity: number;
  studentId: string;
  dateLost: string;
  resolved: boolean;
  resolution?: "Recovered" | "Paid";
  receiptUploaded?: boolean;
}

// ==================== EMPTY DATA (backend-ready) ====================

export const initialTools: Tool[] = [];

export const initialLecturers: Lecturer[] = [];

export const initialStudents: Student[] = [];

export const initialDelegations: Delegation[] = [];

export const initialLostTools: LostToolRecord[] = [];

export const initialLabs: Lab[] = [];

// ==================== OPTIONS & HELPERS ====================

export const classOptions = [
  "2504A", "2504B", "2505A", "2505B", "2505C",
];

export const departmentOptions = [
  "Mechatronics",
  "Electrical Engineering",
  "Electronics",
  "Computer Science",
  "Civil Engineering",
  "Mechanical Engineering",
];

export const unitOptions_academic = [
  "Electromechanical Systems",
  "Electrical and Electronic Principles",
  "Fluid Mechanics",
  "Engineering Mathematics",
  "Industrial Automation",
  "Control Systems",
  "Mechanical Workshop Technology",
];

export const categoryOptions: ToolCategory[] = ["Hand Tool", "Electrical Tool", "Electronic Component", "Mechatronics", "Consumable"];

export const subcategoryMap: Record<ToolCategory, ToolSubcategory[]> = {
  "Hand Tool": ["Screwdriver", "Pliers", "Wrench", "Hammer", "Wire Stripper", "Soldering", "Other"],
  "Electrical Tool": ["Multimeter", "Oscilloscope", "Power Supply", "Signal Generator", "Other"],
  "Electronic Component": ["Resistor", "Capacitor", "Diode", "IC", "Transistor", "LED", "Other"],
  "Mechatronics": ["Sensor", "Motor", "Actuator", "Microcontroller", "Driver Module", "Other"],
  "Consumable": ["Carbon Film Resistor", "Metal Film Resistor", "Ceramic Capacitor", "Electrolytic Capacitor", "Solder Wire", "Flux", "Jumper Wire", "Breadboard Wire", "LED", "Diode", "Transistor", "Other"],
};

export const labOptions = ["Mechatronics Lab", "Electronics Lab", "Computer Lab", "Welding Workshop"];
export const unitOptions: ToolUnit[] = ["pcs", "sets", "boxes"];

export function computeToolStatus(quantity: number, issuedQty: number, lowStockThreshold: number): ToolStatus {
  const available = quantity - issuedQty;
  if (available <= 0) return "Out of Stock";
  if (available <= lowStockThreshold) return "Low Stock";
  if (issuedQty > 0) return "Partially Issued";
  return "Available";
}
