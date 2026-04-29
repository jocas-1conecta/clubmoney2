# Module Collection: Daily Collection — Technical PRD

> **Domain:** collection | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Collection |
| DB Tables | `rutas_cobranza`, `ruta_clientes`, `pagos`, `registro_billetes`, `vouchers`, `cuadernos_cliente`, `registros_cuaderno`, `visitas_presenciales`, `evidencias` |
| TypeScript Interfaces | `RutaCobranza`, `Pago`, `PagoEstado` → `src/types/cobranza.ts` |
| Pages/Components | `CobranzaPage.tsx` |
| Routes | `/cobranza` (protected) |
| RLS | Active — collector sees own routes, supervisor/management sees all |

## Epic 1: Collection Route Management
### Feature 1.1: Route Listing
- [x] Daily collection routes view — `web/src/pages/CobranzaPage.tsx`
- [x] Route data fetching hook — `web/src/hooks/useCobranza.ts`
- [x] Route state tracking (PLANIFICADA → EN_CURSO → CERRADA / CIERRE_CON_CUSTODIA) — `web/src/types/cobranza.ts:L12`

### Feature 1.2: Route Data Model
- [x] Full route type with collector, zone, totals, cash balance — `web/src/types/cobranza.ts:L1-L19`
- [x] Collector and zone join fields — `web/src/types/cobranza.ts:L17-L18`

### Feature 1.3: Automatic Route Planning
- [ ] Daily batch (7:00-8:00 AM): system queries active loans, generates `rutas_cobranza` for current day filtered by `zona_id` — `docs/04_cobranza:L5`
- [ ] Smart prioritization: populates `ruta_clientes` with `orden_visita` prioritizing overdue clients (`casos_morosidad`) and pending payment promises — `docs/04_cobranza:L6`

## Epic 2: Payment Processing
### Feature 2.1: Payment Records
- [x] Payment type with multiple methods (EFECTIVO/YAPE/PLIN/TRANSFERENCIA_BANCARIA) — `web/src/types/cobranza.ts:L29`
- [x] Full payment lifecycle states (REGISTRADO → CONCILIADO / ANULADO / EXTORNADO) — `web/src/types/cobranza.ts:L41-L47`
- [x] Client and collector join fields — `web/src/types/cobranza.ts:L37-L38`

### Feature 2.2: Cash Payment with Banknote Tracking (Anti-Fraud)
- [ ] Collector photographs bills via app camera — system detects serial numbers automatically — `docs/04_cobranza:L22`
- [ ] Serial numbers stored in `registro_billetes` linked to `pago_id` — `DB: registro_billetes`
- [ ] End-of-day validation: Tesorería compares physical bill IDs against recorded IDs — `docs/01_actores:L45`
- [ ] System blocks route closure if bill IDs don't match — alerts Gerencia — `docs/01_actores:L45`

### Feature 2.3: Digital Payment with Voucher OCR
- [ ] Collector photographs digital payment receipt via app — `docs/04_cobranza:L27`
- [ ] OCR auto-extraction: transfer ID, bank, sender data → stored in `vouchers` table — `docs/04_cobranza:L27`
- [ ] Voucher linked to `pago_id` for reconciliation — `DB: vouchers`

### Feature 2.4: Payment Reversal / Chargeback
- [ ] When bank notifies reversal (Yape/transfer chargeback): revert payment state to `ANULADO` — `docs/04_cobranza:L36`
- [ ] Reactivate debt on client's account (update `prestamos.saldo_pendiente`) — `docs/04_cobranza:L36`
- [ ] Flag "Possible Fraud" on client profile for future evaluations — `docs/04_cobranza:L36`

## Epic 3: Cash Security
### Feature 3.1: Cash Limit Enforcement
- [ ] System monitors `saldo_mano` in real-time during route — `docs/04_cobranza:L15`
- [ ] When `saldo_mano > S/2,000` (configurable in `configuracion_sistema`): block app, force partial deposit before continuing route — `docs/04_cobranza:L15`
- [ ] Auto-display nearest bank agent location

### Feature 3.2: Route Closure and Deposit
- [ ] Cash total display at route end (sum of cash payments) — `docs/04_cobranza:L40`
- [ ] Deposit voucher photo upload to close cash responsibility — `docs/04_cobranza:L43`

### Feature 3.3: Custody Closure (Contingency)
- [ ] Collector requests "Custody Closure" when bank agent unavailable — `docs/04_cobranza:L42`
- [ ] Supervisor digital approval via app — `docs/04_cobranza:L42`
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

> [!WARNING]
> **Tech Debt:** The collection page (`CobranzaPage.tsx`) is a list view only. No route detail page, no in-field payment recording, no GPS capture, no banknote registration UI exists yet.
