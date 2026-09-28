# CyberNest Admin Dashboard

React + Vite admin console for CyberNest MDM: organizations, departments,
employees, Android devices, policies, commands, applications, compliance,
alerts, notifications, reports and audit logs. It supports three roles:
Super Admin, Organization Admin and Department Manager.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

The backend URL is set in `src/services/apiClient.js`.

## Project structure

```
src/
├── main.jsx                 Entry point: ThemeProvider + global styles
├── App.jsx                  Session state: login screen vs. app shell
├── routes/AppRoutes.jsx     Page key → feature view (the "router")
│
├── features/                One folder per feature: UI + its API service
│   ├── auth/                Login, forgot password (email → OTP → reset)
│   ├── dashboard/           Overview: KPIs, charts, alerts, quick actions
│   ├── organizations/       Organizations (Super Admin) / own organization
│   ├── departments/
│   ├── employees/
│   ├── devices/             Device lists, details tabs, enrollment, QR
│   ├── policies/            Policies list, form, assignment
│   ├── commands/            Command center
│   ├── applications/        Managed apps, APK upload / install
│   ├── compliance/
│   ├── alerts/
│   ├── notifications/
│   ├── reports/             Report cards with PDF / CSV export
│   ├── audit/               Audit logs
│   ├── profile/             Password, API keys, appearance
│   └── settings/            System settings, appearance, health
│
├── components/
│   ├── layout/              MainLayout (app shell), Sidebar, Header
│   ├── common/              KpiCard, ThemeToggle
│   ├── charts/              DonutChartCard, BarChartCard, HealthRing
│   └── icons/               Inline SVG icon set + CyberNest brand mark
│
├── config/
│   ├── navigation.js        Sidebar items, role visibility, groups
│   ├── roles.js             Role ids and display labels
│   ├── chartThemes.js       Chart colours per theme
│   └── constants.js         localStorage keys
├── context/ThemeContext.jsx Dark / light theme provider (persisted)
├── hooks/                   useTheme, useChartTheme, useSidebar, usePageNavigation
├── services/                apiClient (base URL + auth headers), searchService
├── utils/                   exportUtils (CSV / PDF), formatters, numbers
└── styles/                  index.css (entry), themes, globals, shared styles
```

## Where things live

| Looking for… | Go to |
|---|---|
| A feature's screens (e.g. devices) | `src/features/devices/` |
| A feature's API calls | `src/features/<feature>/<feature>Service.js` |
| Base URL / auth header | `src/services/apiClient.js` |
| Sidebar items, groups, who can see what | `src/config/navigation.js` (+ `config/roles.js`) |
| Which component renders a page | `src/routes/AppRoutes.jsx` |
| Sidebar / header / app shell | `src/components/layout/` |
| Theme switching and persistence | `src/context/ThemeContext.jsx`, `src/hooks/useTheme.js` |
| Theme colours (dark & light) | `src/styles/themes.css` |
| Chart colours | `src/config/chartThemes.js` |
| Reusable UI | `src/components/common/`, `src/components/charts/` |
| CSV / PDF export | `src/utils/exportUtils.js` |

### Services

Each `*Service.js` exports plain `async` functions that call the backend
with `fetch`, using `BASE_URL` and `authHeaders(token)` from
`services/apiClient.js`. Components import the functions they need
directly from the owning feature's service, for example
`import { getDevices } from "../devices/deviceService"`.

### Styles

`styles/index.css` imports every stylesheet in cascade order; `main.jsx`
imports it once. Later files win ties, so keep `responsive.css` last.
Styles that belong to one component or feature sit next to it, for example
`features/dashboard/Dashboard.css`. Shared styles (buttons, forms, tables,
badges, modals, cards) live in `styles/`. Use the CSS variables from
`themes.css` for colours; never hard-code a colour, so both themes keep
working.

### Roles & navigation

Role visibility is defined once, on each item in
`config/navigation.js → getNavItems()`. `NAV_LAYOUT` in the same file
controls how visible items are arranged into sidebar groups. Grouping is
visual only: a group shows just the children the current role can see.

## Adding a feature (example: "Device Groups")

1. Create `src/features/device-groups/` with:
   - `DeviceGroups.jsx`: the page component
   - `DeviceGroupForm.jsx`: a create/edit modal, if needed
   - `deviceGroupService.js`: its API calls, using `services/apiClient.js`
   - `DeviceGroups.css`: only if it needs its own styles. Add it to
     `styles/index.css` before `responsive.css`.
2. Add a nav item in `config/navigation.js`, for example
   `{ key: "device-groups", label: "Device Groups", icon: …, roles: [ROLES.ORG_ADMIN] }`.
   Then place its key in `NAV_LAYOUT`, e.g. inside the `management` group.
3. Render it in `routes/AppRoutes.jsx`:
   `{page === "device-groups" && <DeviceGroups token={token} … />}`

## Modifying a feature

Open its folder under `src/features/`. The page component, its modals and
its service are all there. Shared pieces it uses (KPI cards, charts, icons)
are in `src/components/`. Endpoint changes go only in the feature's
`*Service.js`.
