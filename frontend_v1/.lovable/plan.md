

# Settings Page + Remove Placeholder Data + Update API.md

## Overview

Create a dedicated **Settings** page with a card-based layout for all admin settings (starting with password change), remove all hardcoded placeholder/mock data from the tools and delegation forms so they start empty (ready for real backend integration), and update the API.md to reflect the "Lecturers" rename and Settings endpoint.

---

## Changes

### 1. New Settings Page (`src/pages/AdminSettings.tsx`)

A new page with a card-based layout containing grouped settings sections:

- **Account Security Card**: Move the "Change Password" form here from the dashboard (current password, new password, confirm). Clean card UI with icon header.
- **System Info Card** (read-only): Show app name (ToolPort), version, admin username, department default (Mechatronics).
- Future-ready layout for more settings cards (e.g., notifications, thresholds).

### 2. Update Admin Dashboard

- Remove the "Change Password" button and its dialog from `AdminDashboard.tsx`.
- The dashboard becomes purely an overview/analytics page.

### 3. Add Settings to Navigation

- Add a "Settings" link with a `Settings` (gear) icon to `AppSidebar.tsx`.
- Add the `/admin/settings` route to `App.tsx`.

### 4. Remove Placeholder Data from Forms

- **AdminTools.tsx**: The tools list starts from an empty array `[]` instead of `initialTools`. The "Add Tool" form fields remain (no placeholders pre-filled), but the table starts empty.
- **AdminDelegations.tsx**: The delegations list starts from an empty array `[]` instead of `initialDelegations`. The student list starts from `[]` instead of `initialStudents`. Tools state starts empty too.
- **AdminLecturers.tsx**: Starts from an empty array instead of `initialLecturers`.
- **AdminStudentProfiles.tsx**: Starts from empty arrays.
- **AdminLabs.tsx**: Starts from an empty array instead of `initialLabs`.
- **AdminDashboard.tsx**: Uses the same empty state approach -- stats show 0 until data is added.
- **AdminReports.tsx**: Works with empty data, showing "no data" states.

The placeholder data file (`placeholderData.ts`) will keep the **type definitions**, **category/subcategory maps**, **option arrays**, and the `computeToolStatus` function -- but the `initial*` data arrays will become empty arrays. This preserves all types for the backend while clearing mock records.

### 5. Update API.md

- Rename all "Teachers" references to **"Lecturers"** (endpoints become `/lecturers`).
- Add a **Settings / Auth** section documenting `POST /auth/change-password`.
- Add `POST /auth/login` endpoint.
- Ensure consistency with current data model.

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/pages/AdminSettings.tsx` | **New file** -- Settings page with password change card |
| `src/pages/AdminDashboard.tsx` | Remove password change button and dialog |
| `src/components/layout/AppSidebar.tsx` | Add Settings nav link |
| `src/App.tsx` | Add `/admin/settings` route |
| `src/data/placeholderData.ts` | Empty all `initial*` arrays, keep types and helpers |
| `src/pages/AdminTools.tsx` | Use empty initial state |
| `src/pages/AdminDelegations.tsx` | Use empty initial state |
| `src/pages/AdminLecturers.tsx` | Use empty initial state |
| `src/pages/AdminStudentProfiles.tsx` | Use empty initial state |
| `src/pages/AdminLabs.tsx` | Use empty initial state |
| `src/pages/AdminReports.tsx` | Handle empty data gracefully |
| `API.md` | Rename Teachers to Lecturers, add auth endpoints |

### Settings Page Layout

```text
+------------------------------------------+
| Settings                                 |
+------------------------------------------+
| +--------------------------------------+ |
| | Account Security            KeyRound | |
| | Current Password: [__________]       | |
| | New Password:     [__________]       | |
| | Confirm Password: [__________]       | |
| |                    [Update Password]  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | System Information             Info  | |
| | App: ToolPort                        | |
| | Admin: DIM/0245/25                   | |
| | Default Dept: Mechatronics           | |
| +--------------------------------------+ |
+------------------------------------------+
```

### Empty State Handling

All tables and charts will gracefully show "No data yet" or zero values when starting fresh, ensuring the UI doesn't break with empty arrays.

