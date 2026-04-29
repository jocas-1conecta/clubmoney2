# Module Collection: Daily Collection — Technical PRD

> **Domain:** collection | **Status:** 🚧 In Progress
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Collection |
| DB Tables | `rutas_cobranza`, `ruta_clientes`, `pagos`, `registro_billetes`, `vouchers`, `cuadernos_cliente`, `registros_cuaderno`, `visitas_presenciales`, `evidencias` |
| TypeScript Interfaces | `RutaCobranza`, `RutaCliente`, `Pago`, `PagoEstado`, `MedioPago`, `NuevoPagoForm`, `RutaResumen`, `EstadoVisita` → `src/types/cobranza.ts` |
| Pages/Components | `CobranzaPage.tsx`, `RutaDetallePage.tsx` |
| Routes | `/cobranza` (protected), `/cobranza/:id` (protected) |
| Hooks | `useCobranza`, `useRutas`, `useRutaDetalle`, `useCollectorsAndZones` |
| RLS | Active — collector sees own routes, supervisor/management sees all |

## Epic 1: Collection Route Management
### Feature 1.1: Route Listing (Tabbed UI)
- [x] Tabbed layout: "Rutas" tab (default) + "Pagos" tab — `web/src/pages/CobranzaPage.tsx`
- [x] Route stats cards: Routes Today, Active, Completed, Total Collected — `web/src/pages/CobranzaPage.tsx:L132-L136`
- [x] Route DataTable: date, collector (avatar), zone, clients, collected, cash in hand, state — `web/src/pages/CobranzaPage.tsx:L140-L219`
- [x] Cash in hand warning (red + ⚠ when > S/2,000) — `web/src/pages/CobranzaPage.tsx:L199-L207`
- [x] Route filtering by state — `web/src/pages/CobranzaPage.tsx:L236-L248`
- [x] Click route → navigate to detail page `/cobranza/:id` — `web/src/pages/CobranzaPage.tsx:L227`

### Feature 1.2: Route Creation
- [x] "Nueva Ruta" modal with collector, zone, date selectors — `web/src/pages/CobranzaPage.tsx:NuevaRutaModal`
- [x] Dynamic collector/zone dropdowns from `perfiles` and `zonas` tables — `web/src/hooks/useRutas.ts:useCollectorsAndZones`
- [x] Route creation function — `web/src/hooks/useRutas.ts:crearRuta`

### Feature 1.3: Route Data Model
- [x] Full route type with collector, zone, totals, cash balance — `web/src/types/cobranza.ts:RutaCobranza`
- [x] Route client type with visit state, priority, expected/collected amounts — `web/src/types/cobranza.ts:RutaCliente`
- [x] Route state lifecycle (PLANIFICADA → EN_CURSO → CERRADA / CIERRE_CON_CUSTODIA) — `web/src/types/cobranza.ts:RutaEstado`
- [x] Visit state types (PENDIENTE/VISITADO/COBRADO/PAGO_PARCIAL/AUSENTE/SIN_DINERO) — `web/src/types/cobranza.ts:EstadoVisita`

### Feature 1.4: Route Detail Page
- [x] Header card: collector avatar, zone, date, state badge — `web/src/pages/RutaDetallePage.tsx:L122-L168`
- [x] 6 summary KPIs: clients, visited, pending, expected, collected, cash in hand — `web/src/pages/RutaDetallePage.tsx:L170-L186`
- [x] Cash limit warning banner (when > S/2,000) — `web/src/pages/RutaDetallePage.tsx:L189-L197`
- [x] Ordered client list with visit number badge, priority indicators, special instructions — `web/src/pages/RutaDetallePage.tsx:L204-L274`
- [x] Expected vs. collected amounts per client — `web/src/pages/RutaDetallePage.tsx:L238-L255`
- [x] Breadcrumb navigation back to `/cobranza` — `web/src/pages/RutaDetallePage.tsx:L117-L120`

### Feature 1.5: Route Lifecycle Actions
- [x] "Iniciar Ruta" button (PLANIFICADA → EN_CURSO, sets hora_inicio) — `web/src/hooks/useRutas.ts:iniciarRuta`
- [x] "Cerrar Ruta" button with deposit voucher URL modal (EN_CURSO → CERRADA) — `web/src/hooks/useRutas.ts:cerrarRuta`
- [x] "Custodia" button for contingency closure (EN_CURSO → CIERRE_CON_CUSTODIA) — `web/src/hooks/useRutas.ts:solicitarCustodia`
- [x] Mark visit failed: "Ausente" / "Sin Dinero" actions per client — `web/src/hooks/useRutas.ts:marcarVisitaFallida`

### Feature 1.6: Automatic Route Planning
- [ ] Daily batch (7:00-8:00 AM): system queries active loans, generates `rutas_cobranza` for current day filtered by `zona_id` — `docs/04_cobranza:L5`
- [ ] Smart prioritization: populates `ruta_clientes` with `orden_visita` prioritizing overdue clients (`casos_morosidad`) and pending payment promises — `docs/04_cobranza:L6`

## Epic 2: Payment Processing
### Feature 2.1: Payment Recording (In-Route)
- [x] Payment modal with client context (saldo pendiente, cuota esperada) — `web/src/pages/RutaDetallePage.tsx:PagoModal`
- [x] Payment method selector (Efectivo, Yape, Plin, Transferencia) — `web/src/pages/RutaDetallePage.tsx:L385-L394`
- [x] Conditional fields: operation number + bank (for digital payments only) — `web/src/pages/RutaDetallePage.tsx:L397-L419`
- [x] Auto-state: EFECTIVO → RECAUDADO_EN_CAMPO, digital → PENDIENTE_CONCILIACION — `web/src/hooks/useRutas.ts:registrarPago`
- [x] Updates `ruta_clientes.monto_cobrado` + visit state (COBRADO/PAGO_PARCIAL) — `web/src/hooks/useRutas.ts:registrarPago`
- [x] Updates route totals (`total_recaudado`, `saldo_mano` for cash) — `web/src/hooks/useRutas.ts:registrarPago`
- [x] Financial precision: `Math.round(montoNum * 100) / 100` — `web/src/pages/RutaDetallePage.tsx:L351`

### Feature 2.2: Payment List View
- [x] Pagos tab with payment DataTable — `web/src/pages/CobranzaPage.tsx:PagosTab`
- [x] Payment stats: collected today, payment count, cash vs. digital — `web/src/pages/CobranzaPage.tsx:L327-L332`
- [x] Filter by payment method and state — `web/src/pages/CobranzaPage.tsx:L431-L455`
- [x] Client search — `web/src/hooks/useCobranza.ts:search`

### Feature 2.3: Cash Payment with Banknote Tracking (Anti-Fraud)
- [ ] Collector photographs bills via app camera — system detects serial numbers automatically — `docs/04_cobranza:L22`
- [ ] Serial numbers stored in `registro_billetes` linked to `pago_id` — `DB: registro_billetes`
- [ ] End-of-day validation: Tesorería compares physical bill IDs against recorded IDs — `docs/01_actores:L45`
- [ ] System blocks route closure if bill IDs don't match — alerts Gerencia — `docs/01_actores:L45`

### Feature 2.4: Digital Payment with Voucher OCR
- [ ] Collector photographs digital payment receipt via app — `docs/04_cobranza:L27`
- [ ] OCR auto-extraction: transfer ID, bank, sender data → stored in `vouchers` table — `docs/04_cobranza:L27`
- [ ] Voucher linked to `pago_id` for reconciliation — `DB: vouchers`

### Feature 2.5: Payment Reversal / Chargeback
- [ ] When bank notifies reversal (Yape/transfer chargeback): revert payment state to `ANULADO` — `docs/04_cobranza:L36`
- [ ] Reactivate debt on client's account (update `prestamos.saldo_pendiente`) — `docs/04_cobranza:L36`
- [ ] Flag "Possible Fraud" on client profile for future evaluations — `docs/04_cobranza:L36`

## Epic 3: Cash Security
### Feature 3.1: Cash Limit Warning (Web Panel)
- [x] Visual warning in route table when `saldo_mano > S/2,000` (red text + ⚠) — `web/src/pages/CobranzaPage.tsx:L197-L207`
- [x] Alert banner in route detail page — `web/src/pages/RutaDetallePage.tsx:L189-L197`
- [ ] System blocks mobile app, forces partial deposit before continuing route — `docs/04_cobranza:L15`
- [ ] Auto-display nearest bank agent location

### Feature 3.2: Route Closure and Deposit
- [x] Deposit voucher URL required to close route — `web/src/pages/RutaDetallePage.tsx:L296-L319`
- [x] Cash balance reset to 0 on close — `web/src/hooks/useRutas.ts:cerrarRuta`

### Feature 3.3: Custody Closure (Contingency)
- [x] Collector requests "Custody Closure" — `web/src/pages/RutaDetallePage.tsx:L162-L164`
- [x] Records approver ID — `web/src/hooks/useRutas.ts:solicitarCustodia`
- [ ] Undeposited balance auto-carries as "Initial Cash Balance" to next day's route — `docs/04_cobranza:L42`
- [ ] Priority deposit forced at 8:00 AM next day — `docs/04_cobranza:L42`

## Epic 4: Mobile App Architecture (Future)
### Feature 4.1: Offline Mode
- [ ] Local database (SQLite/WatermelonDB/MMKV) for `ruta_clientes` downloaded at day start — `docs/04_cobranza:L56`
- [ ] Sync queue: offline payments/check-ins stored with `sync_pending=true` — `docs/04_cobranza:L57`
- [ ] Background sync worker: sends data to Supabase preserving original timestamps (not upload time) — `docs/04_cobranza:L58`

### Feature 4.2: GPS Check-in
- [ ] Automatic lat/lon capture on client arrival (non-editable) — `docs/04_cobranza:L11`
- [ ] Georeferenced evidence stored in `evidencias` table — `DB: evidencias`

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| Consolidation | `conciliacion_detalle.pago_id` FK — payments reconciled against bank |
| Delinquency | Missed payments trigger delinquency cases |
| Formalization | `pagos.prestamo_id` FK — payments reduce loan balance |
