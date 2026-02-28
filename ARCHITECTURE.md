# Clinic Admin Panel — Architecture & Guidelines

## 1. Project architecture (folders + files)

```
med_admin/
├── public/
│   ├── mock-db.json          # Local mock data (same shapes as API)
│   └── ...
├── src/
│   ├── api/
│   │   ├── client.ts         # Axios instance, interceptors (auth, refresh, toasts)
│   │   ├── endpoints.ts      # Path constants
│   │   └── types.ts          # API DTOs / response shapes (optional re-export from types/)
│   ├── config/
│   │   └── env.ts            # VITE_API_URL, USE_MOCK_API
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api.ts        # login, refresh, me, logout
│   │   │   ├── context.tsx   # AuthProvider, useAuth
│   │   │   ├── queryKeys.ts
│   │   │   └── types.ts
│   │   ├── registration/
│   │   │   ├── api.ts        # searchPatient, createPatient, createVisit, getDictionaries...
│   │   │   ├── hooks.ts      # useDictionaries, useDoctors, useServicesByCategory...
│   │   │   ├── queryKeys.ts
│   │   │   └── schemas.ts    # Zod schemas for registration form
│   │   ├── reports/
│   │   │   ├── services/
│   │   │   │   ├── api.ts    # getServicesReport, exportServicesReportXlsx
│   │   │   │   ├── hooks.ts
│   │   │   │   └── queryKeys.ts
│   │   │   └── salary/
│   │   │       ├── api.ts    # getSalaryReport, exportSalaryReportXlsx, updateDoctorSalaryPercent
│   │   │       ├── hooks.ts
│   │   │       └── queryKeys.ts
│   │   ├── settings/
│   │   │   ├── services/     # CRUD categories & services, hide, price edit
│   │   │   ├── doctors/      # CRUD, assign services
│   │   │   ├── patients/     # edit, archive
│   │   │   └── users/        # CRUD, change login/password/role
│   │   └── services/         # Shared: getServices, getCategories (sample feature wiring)
│   │       ├── api.ts
│   │       ├── hooks.ts
│   │       └── queryKeys.ts
│   ├── components/
│   │   ├── ui/               # Reusable UI primitives
│   │   │   ├── DataTable.tsx
│   │   │   ├── FiltersBar.tsx
│   │   │   ├── ModalForm.tsx
│   │   │   ├── DrawerDetails.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── PageSkeleton.tsx
│   │   ├── layout/
│   │   │   └── AdminLayout.tsx
│   │   └── registration/     # Existing registration-specific components
│   ├── hooks/
│   │   ├── useToast.ts       # Central toast helper (snackbar)
│   │   └── usePagination.ts
│   ├── layouts/
│   │   └── AdminLayout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegistrationPage.tsx
│   │   ├── ReportsPage.tsx   # Redirect or tabs to services/salary
│   │   ├── ServicesReportPage.tsx
│   │   ├── SalaryReportPage.tsx
│   │   ├── SettingsPage.tsx  # Tabs: Services, Doctors, Patients, Users
│   │   ├── PatientsPage.tsx
│   │   ├── CashPage.tsx
│   │   └── MainPage.tsx
│   ├── query/
│   │   └── queryKeys.ts      # Central query key factory per feature
│   ├── router/
│   │   └── index.tsx         # Routes, lazy loading, auth guard
│   ├── schemas/              # Zod schemas (shared or feature-specific)
│   │   └── registrationSchema.ts
│   ├── types/
│   │   ├── clinic.ts         # Domain types (Patient, Doctor, Service, Visit...)
│   │   └── api.ts            # API request/response DTOs
│   ├── utils/
│   │   ├── format.ts         # UZS, date, phone
│   │   └── validation.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts
│   └── index.css
├── db.txt                    # Full API spec (endpoints, payloads, frontend functions)
├── ARCHITECTURE.md           # This file
├── package.json
├── tsconfig.json
└── vite.config.js
```

**Routes (final):**

- `/login` — public
- `/registration` — under layout (or public if no auth guard on it)
- `/reports` — layout; can redirect to `/reports/services`
- `/reports/services` — Services report
- `/reports/salary` — Salary report
- `/settings` — Settings with internal tabs (Services & Prices, Doctors, Patients, Users)
- `/patients`, `/cash`, `/` (main) — under layout

No филиалы, no кабинеты.

---

## 2. Implementation guidelines

### State

- **Server state:** TanStack Query only. No duplicate server data in Redux/Context (except auth token/user).
- **Auth:** Context + localStorage (accessToken, refreshToken). Optional: store user in React Query (e.g. `useQuery(['me'], fetchMe)` with long staleTime).
- **UI state:** React useState/useReducer in pages or small contexts (modals, filters, selected tab).
- **Form state:** React Hook Form. No form state in global store.

### Caching (TanStack Query)

- **Query keys:** One factory per feature in `query/queryKeys.ts` or `features/<name>/queryKeys.ts`. Keys: `['services']`, `['services', 'list', filters]`, `['doctor', id]`, `['reports', 'services', filterParams]`.
- **Stale time:** Dictionaries (categories, card types, discounts): 5–10 min. Lists (patients, doctors, services): 1–2 min. Reports: 0 or 30 s.
- **Cache invalidation:** After mutations: `queryClient.invalidateQueries({ queryKey: ['services'] })` or exact key. Prefer granular keys so only affected data refetches.
- **Prefetch:** Optional prefetch on hover for detail views (e.g. doctor by id).

### Forms & validation

- **React Hook Form + Zod:** All forms use `useForm<T>({ resolver: zodResolver(schema) })`.
- **Zod schemas:** Define in `schemas/` or `features/<name>/schemas.ts`. Reuse for API payload validation if backend sends same shape.
- **Validation at boundary:** Parse API responses with `schema.parse()` or `schema.safeParse()` when you need to enforce types from API (optional but recommended for critical paths).
- **Errors:** Show field errors from RHF; show API errors in toast + optional inline banner.

### API client

- **Axios:** Single instance in `api/client.ts`. Base URL from `config/env.ts`.
- **Interceptors:** Request: add `Authorization: Bearer <accessToken>`. Response: on 401 try refresh (single in-flight), then retry original request; on 4xx/5xx show toast and optionally throw typed ApiError.
- **Token refresh:** Use refresh token in body or cookie; store new tokens and retry failed request.
- **Mock mode:** If `USE_MOCK_API=true`, baseURL can point to a Vite dev server that serves from `mock-db.json`, or use a local repository that reads from `public/mock-db.json` (no Axios for mock).

### Error handling & toasts

- **Toasts:** One Snackbar provider (e.g. in layout or App). `useToast()` exposes `success`, `error`, `info`. Use for: save success, API errors, permission errors.
- **Loading:** Skeleton components for tables and cards; no spinners-only where a skeleton is possible.
- **Empty states:** Use `EmptyState` component (icon + message + optional action) for empty tables/lists.
- **Accessibility:** Buttons and links have clear labels; tables have proper headers; modals trap focus and support Escape.

### Reusable components

- **DataTable:** Props: columns, rows, loading (skeleton), emptyMessage, sort, pagination (optional). Use MUI Table under the hood.
- **FiltersBar:** Horizontal row of filter controls (date range, select, search). Emit filter object to parent.
- **ModalForm:** Dialog with form content slot; submit/cancel; optional loading state on submit.
- **DrawerDetails:** Side drawer with title and content slot; close on overlay or button.
- **PageSkeleton:** Full-page skeleton for lazy-loaded route.

### Performance & code splitting

- **Lazy routes:** All page components loaded via `React.lazy()`. Wrap in `<Suspense fallback={<PageSkeleton />}>`.
- **Chunk naming:** Rely on Vite default (by route). Optional: `/* webpackChunkName: "reports" */` if needed.
- **Heavy libs:** Use dynamic import for XLSX/PDF only on export action.

### Typing

- **DTOs:** Types for every API request/response in `types/clinic.ts` and `types/api.ts`. Use UZS amounts as **number (integer)**; no float for money.
- **Query keys:** Typed factory: `queryKeys.services.list(filters)` so keys are consistent.
- **Id types:** Prefer `string` for all ids (UUID or string ids from backend).

### Feature wiring (example: Services)

- **api.ts:** `getServices(): Promise<Service[]>` — calls `GET /services` (or mock).
- **hooks.ts:** `useServices()` — `useQuery(queryKeys.services.list(), getServices)`.
- **Pages:** Use `useServices()`; show loading skeleton and empty state; table uses shared `DataTable`.

---

## 3. Consistency rules

- One UI library (MUI) and one icon set (MUI icons or lucide-react project-wide).
- All amounts in UZS, integer.
- Dates: ISO 8601; display with timezone (e.g. Asia/Tashkent +05:00).
- No филиалы (branches), no кабинеты (rooms) in data or UI.
- Settings tabs: Services & Prices | Doctors | Patients | Users only.
- User roles: doctor | admin | registrar only.
