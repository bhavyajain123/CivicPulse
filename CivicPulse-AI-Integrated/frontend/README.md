# CivicConnect Frontend

Advanced React + TypeScript + Vite frontend scaffold following the requested `CIVICCONNECT/frontend` structure.

## Run on macOS
```bash
cd CIVICCONNECT/frontend
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
```

## Included
- Advanced responsive municipal command-center dashboard with interactive navigation, incident/complaint queue, filters, detail panels, create flow, dispatch workflow, status changes, analytics charts, CSV export, notifications, profile and settings.
- Separated source folders for common UI, layout, complaints, maps, dashboard widgets, public pages, citizen pages, officer pages, admin pages, auth, context, hooks, services, routes, types, utilities and styles.
- `.env.example` for the future API and realtime service configuration.

## Important integration note
The dashboard currently runs in demo/local state. The additional page/component files are organized starter modules so each requested feature has its own file and can be wired into the API progressively. Actual login security, MongoDB persistence, Cloudinary uploads, server-side role permissions, real map tiles/GPS tracking and Socket.IO updates require the backend and service credentials. The map shown in the dashboard is a visual demo, not a live map provider.


## Public cover page
The `/` route now opens the CivicConnect landing/cover page. Use **Open command center** to enter `/dashboard`, where the expanded emergency-operations sidebar and interactive dashboard are available.


### Sidebar scrolling
The full sidebar is vertically scrollable; on shorter screens, scroll inside the sidebar to reach Reports, Settings, Contact Support and the account panel. The sidebar content is not clipped by the viewport.
