# ToolPort API Documentation

> **Note:** This is a frontend-only prototype. The API endpoints below document the planned REST API structure for when a backend is implemented. Currently, all data is managed via React state (empty arrays, ready for backend integration).

---

## Base URL

```
https://api.toolport.school.ac.ke/v1
```

## Authentication

All endpoints require a valid session token passed via `Authorization: Bearer <token>` header.

### POST `/auth/login`
Authenticate admin user.

**Request Body:**
```json
{
  "username": "DIM/0245/25",
  "password": "admin123"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "username": "DIM/0245/25",
    "name": "Newton Kamau",
    "role": "admin"
  }
}
```

**Error `401 Unauthorized`:**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid username or password"
}
```

### POST `/auth/change-password`
Change admin password. Requires valid session.

**Request Body:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newSecurePassword"
}
```

**Response `200 OK`:**
```json
{
  "message": "Password changed successfully"
}
```

**Error `400 Bad Request`:**
```json
{
  "error": "INVALID_PASSWORD",
  "message": "Current password is incorrect"
}
```

---

## 1. Tools / Inventory

### GET `/tools`
List all tools and consumables.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category: `Hand Tool`, `Electrical Tool`, `Electronic Component`, `Mechatronics`, `Consumable` |
| `subcategory` | string | Filter by subcategory |
| `lab` | string | Filter by lab name |
| `status` | string | `Available`, `Partially Issued`, `Low Stock`, `Out of Stock` |
| `search` | string | Search by name or description |
| `sort` | string | Sort field (e.g., `name`, `quantity`, `status`) |
| `order` | string | `asc` or `desc` |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Soldering Kit",
      "category": "Hand Tool",
      "subcategory": "Soldering",
      "quantity": 15,
      "issuedQty": 3,
      "unit": "sets",
      "lab": "Mechatronics Lab",
      "description": "Complete soldering station",
      "dateAdded": "2025-09-01",
      "status": "Available",
      "isConsumable": false,
      "consumableType": null,
      "lowStockThreshold": 5
    }
  ],
  "total": 24
}
```

### POST `/tools`
Create a new tool/consumable.

**Request Body:**
```json
{
  "name": "10kΩ Resistor (Carbon Film)",
  "category": "Consumable",
  "subcategory": "Carbon Film Resistor",
  "quantity": 1000,
  "unit": "pcs",
  "lab": "Mechatronics Lab",
  "description": "1/4W carbon film resistor",
  "isConsumable": true,
  "consumableType": "Carbon Film",
  "lowStockThreshold": 100
}
```

**Response `201 Created`:**
```json
{
  "id": 25,
  "name": "10kΩ Resistor (Carbon Film)",
  "status": "Available",
  "...": "..."
}
```

### PUT `/tools/:id`
Update a tool.

**Request Body:** Same fields as POST (partial update supported).

**Response `200 OK`:** Updated tool object.

### DELETE `/tools/:id`
Delete a tool.

**Response `204 No Content`**

---

## 2. Lecturers

### GET `/lecturers`
List all lecturers.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Dr. Alice Mwangi",
      "department": "Mechatronics",
      "email": "alice.mwangi@school.ac.ke"
    }
  ]
}
```

### POST `/lecturers`
Create a lecturer.

**Request Body:**
```json
{
  "name": "Dr. Alice Mwangi",
  "department": "Mechatronics",
  "email": "alice.mwangi@school.ac.ke"
}
```

**Response `201 Created`:** Lecturer object.

### PUT `/lecturers/:id`
Update a lecturer.

### DELETE `/lecturers/:id`
Delete a lecturer.

---

## 3. Students

### GET `/students`
List all students.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `Active` or `Banned` |
| `search` | string | Search by name or student ID |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "studentId": "MEC/001/25",
      "name": "John Doe",
      "className": "2505A",
      "department": "Mechatronics",
      "email": "john.doe@school.ac.ke",
      "accountStatus": "Active",
      "lostToolCount": 0,
      "units": ["Electromechanical Systems", "Fluid Mechanics"]
    }
  ]
}
```

### GET `/students/:studentId`
Get student profile with holdings, history, and financials.

**Response `200 OK`:**
```json
{
  "student": { "...": "..." },
  "currentHoldings": [
    {
      "id": 1,
      "toolName": "Digital Multimeter",
      "quantity": 2,
      "dateIssued": "2026-02-06",
      "expectedReturn": "2026-02-13",
      "status": "Issued"
    }
  ],
  "history": [ "..." ],
  "lostTools": [
    {
      "delegationId": 13,
      "toolName": "Servo Motor SG90",
      "quantity": 1,
      "dateLost": "2025-12-15",
      "resolved": false,
      "resolution": null
    }
  ]
}
```

### POST `/students/:studentId/lost-tools/:delegationId/recover`
Mark a lost tool as recovered. Decrements the student's `lostToolCount` and may lift the ban.

**Response `200 OK`:**
```json
{
  "message": "Tool marked as recovered",
  "newLostCount": 4,
  "accountStatus": "Active"
}
```

### POST `/students/:studentId/lost-tools/:delegationId/paid`
Mark a lost tool as paid.

**Request Body (optional):**
```json
{
  "receiptUploaded": true
}
```

**Response `200 OK`:**
```json
{
  "message": "Tool marked as paid",
  "resolution": "Paid"
}
```

---

## 4. Delegations (Tool Checkout/Return)

### GET `/delegations`
List all delegations.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `Issued`, `Returned`, `Overdue`, `Lost` |
| `studentId` | string | Filter by student |
| `lecturerId` | number | Filter by lecturer |
| `search` | string | Search by student name, tool name, or student ID |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "toolId": 2,
      "toolName": "Digital Multimeter",
      "quantity": 2,
      "lecturerId": 1,
      "lecturerName": "Dr. Alice Mwangi",
      "studentId": "MEC/001/25",
      "studentName": "John Doe",
      "className": "2505A",
      "dateIssued": "2026-02-06",
      "expectedReturn": "2026-02-13",
      "expectedReturnTime": "16:00",
      "dateReturned": "-",
      "actualCheckoutTime": "08:30",
      "actualReturnTime": "-",
      "status": "Issued",
      "conditionBefore": "Good",
      "conditionAfter": "",
      "isInterDepartmental": false,
      "guestDepartment": null,
      "guestLabProject": null
    }
  ]
}
```

### POST `/delegations`
Issue a tool to a student.

**Request Body:**
```json
{
  "toolId": 2,
  "quantity": 2,
  "lecturerId": 1,
  "studentId": "MEC/001/25",
  "expectedReturn": "2026-02-13",
  "expectedReturnTime": "16:00",
  "conditionBefore": "Good",
  "isInterDepartmental": false,
  "guestDepartment": null,
  "guestLabProject": null
}
```

**Validation Rules:**
- Student must not be `Banned`
- Requested quantity must not exceed available quantity
- If `isInterDepartmental` is true, `guestDepartment` and `guestLabProject` are required

**Response `201 Created`:**
```json
{
  "id": 21,
  "status": "Issued",
  "actualCheckoutTime": "14:30",
  "toolRemainingQty": 10,
  "...": "..."
}
```

**Error `400 Bad Request`:**
```json
{
  "error": "STUDENT_BANNED",
  "message": "Student MEC/005/25 is banned (5 lost tools). Cannot issue tools."
}
```

### POST `/delegations/:id/return`
Return a tool.

**Request Body:**
```json
{
  "conditionAfter": "Good",
  "markAsLost": false
}
```

**Response `200 OK`:**
```json
{
  "id": 1,
  "status": "Returned",
  "actualReturnTime": "15:30",
  "dateReturned": "2026-02-12",
  "toolRestoredQty": 12
}
```

If `markAsLost` is true:
```json
{
  "id": 1,
  "status": "Lost",
  "studentLostToolCount": 5,
  "studentAccountStatus": "Banned",
  "message": "Student has been automatically banned (5+ lost tools)"
}
```

---

## 5. Labs

### GET `/labs`
List all labs.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Mechatronics Lab",
      "location": "Block A, Room 101",
      "department": "Mechatronics",
      "description": "Main mechatronics workshop",
      "toolCount": 12
    }
  ]
}
```

### POST `/labs`
Create a new lab.

**Request Body:**
```json
{
  "name": "Mechatronics Lab",
  "location": "Block A, Room 101",
  "department": "Mechatronics",
  "description": "Main workshop"
}
```

### PUT `/labs/:id`
Update a lab.

### DELETE `/labs/:id`
Delete a lab.

---

## 6. Inter-Departmental Borrowing

### GET `/delegations?isInterDepartmental=true`
Filter delegations for inter-departmental borrows.

**Additional fields in response:**
```json
{
  "isInterDepartmental": true,
  "guestDepartment": "Electrical Engineering",
  "guestLabProject": "Power Electronics Lab - Rectifier Project"
}
```

---

## 7. Analytics

### GET `/analytics/overview`
System-wide tool status overview.

**Response `200 OK`:**
```json
{
  "totalTools": 24,
  "totalQuantity": 3500,
  "availableQuantity": 2800,
  "issuedQuantity": 700,
  "outOfStockItems": 3,
  "lowStockItems": 4,
  "overdueItems": 3,
  "lostItems": 8
}
```

### GET `/analytics/usage`
Tool usage analytics.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `period` | string | `daily`, `weekly`, `monthly` |
| `category` | string | Filter by category |
| `lab` | string | Filter by lab |
| `dateFrom` | string | Start date (ISO) |
| `dateTo` | string | End date (ISO) |

**Response `200 OK`:**
```json
{
  "mostUsed": [
    { "toolName": "Digital Multimeter", "totalIssued": 50 }
  ],
  "leastUsed": [
    { "toolName": "Function Generator", "totalIssued": 2 }
  ],
  "usageByClass": [
    { "className": "2505A", "totalIssued": 120 }
  ],
  "usageByLecturer": [
    { "lecturerName": "Dr. Alice Mwangi", "totalIssued": 80 }
  ],
  "usageByStudent": [
    { "studentName": "John Doe", "totalIssued": 25 }
  ],
  "trend": [
    { "period": "2026-01", "issued": 28, "returned": 20 }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `STUDENT_BANNED` | 400 | Student account is banned |
| `INSUFFICIENT_STOCK` | 400 | Not enough quantity available |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing auth token |
| `INVALID_CREDENTIALS` | 401 | Invalid username or password |
| `INVALID_PASSWORD` | 400 | Current password is incorrect |

---

## Business Rules

1. **5-Tool Ban Rule:** When a student accumulates 5 or more lost tools, their account is automatically set to `Banned`. They cannot checkout new tools until lost items are resolved (recovered or paid).

2. **Consumable Logic:** Consumables (resistors, LEDs, solder wire) have bulk quantities that decrement on checkout and do not return (quantity is permanently reduced). Unlike tools which move back and forth.

3. **Low Stock Alerts:** Each tool has a configurable `lowStockThreshold`. When `available quantity ≤ threshold`, status changes to `Low Stock`.

4. **Departmental Restriction:** The system defaults to the Mechatronics Department. Inter-departmental borrowing requires the `isInterDepartmental` flag with lecturer department and lab/project details.

5. **Overdue Detection:** Items past their `expectedReturn` date are flagged as `Overdue`.

6. **Condition Tracking:** Every checkout/return logs `conditionBefore` and `conditionAfter` to track wear and tear.

7. **Timestamps:** All transactions automatically log `actualCheckoutTime` and `actualReturnTime`.
