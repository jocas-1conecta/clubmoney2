# Module Dashboard: Dashboard — Technical PRD

> **Domain:** dashboard | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Dashboard |
| DB Tables | Aggregates from `prestamos`, `solicitudes_prestamo`, `pagos`, `casos_morosidad`, `clientes` |
| Pages/Components | `DashboardPage.tsx` |
| Routes | `/` (protected, default) |
| RLS | Inherits from source tables |

## Epic 1: Operations Dashboard
### Feature 1.1: KPI Cards
- [x] Key metrics display (portfolio totals, active loans, collection rates) — `web/src/pages/DashboardPage.tsx`
- [x] Dashboard stats fetching hook — `web/src/hooks/useDashboardStats.ts`

### Feature 1.2: Charts
- [x] Recharts-based data visualizations — `web/src/pages/DashboardPage.tsx`
- [x] Multi-source data aggregation — `web/src/hooks/useDashboardStats.ts`

### Feature 1.3: Quick Actions
- [x] Navigation shortcuts to key modules — `web/src/pages/DashboardPage.tsx`

### Feature 1.4: Role-Based Content
- [x] Dashboard content adapts to user role — `web/src/pages/DashboardPage.tsx`

## Roadmap (v2 — pending)
- [ ] Real-time updates via Supabase Realtime
- [ ] Date range filtering
- [ ] Exportable reports (PDF/CSV)
- [ ] Per-zone dashboard view
- [ ] Audit log viewer — Gerencia-only "Audit" screen to filter `audit_logs` by employee or client for fraud investigation and compliance — `docs/07_monitoreo:L21`
- [ ] Internal chat system — team communication hub replacing external apps, with message/document/image sharing via `chats` + `mensajes_chat` tables — `docs/04_cobranza:L12`, `docs/06_morosidad:L13`

