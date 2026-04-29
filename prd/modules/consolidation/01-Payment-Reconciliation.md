# Module Consolidation: Payment Reconciliation — Technical PRD

> **Domain:** consolidation | **Status:** 📋 Planned
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Consolidation |
| DB Tables | `movimientos_bancarios`, `conciliaciones`, `conciliacion_detalle`, `inconsistencias_pago` |
| TypeScript Interfaces | Not yet created |
| Pages/Components | Not yet created |
| Routes | Not yet defined |
| RLS | Active on all tables (admin/treasury roles only) |

## Epic 1: Bank Transaction Import
### Feature 1.1: Bank Movement Registry
- [ ] Import bank transactions from file (CSV/Excel) into `movimientos_bancarios` — `docs/05_consolidacion:L5`
- [ ] Manual bank movement entry for edge cases
- [ ] Bank movement listing with date/amount/reference filtering

## Epic 2: Reconciliation Engine
### Feature 2.1: Automatic Matching
- [ ] Batch reconciliation process (runs after bank data import, or continuous) — `docs/05_consolidacion:L9`
- [ ] Matching criteria: amount + date (with configurable tolerance margin) + reference/operation number — `docs/05_consolidacion:L11`
- [ ] On match: create `conciliacion_detalle` with `coincide=TRUE`, update `pagos.estado→CONCILIADO` — `docs/05_consolidacion:L12`
- [ ] On mismatch: create alert in `inconsistencias_pago` — `docs/05_consolidacion:L13`

### Feature 2.2: Day Closure Lock
- [ ] After reconciliation completes, lock `conciliacion_id` with `estado='FINALIZADA'` — `docs/05_consolidacion:L28`
- [ ] Prevent modifications to payment records from locked date — `docs/05_consolidacion:L28`

### Feature 2.3: Banknote Physical Verification
- [ ] Tesorería validates physical bill IDs against collector-recorded IDs in `registro_billetes` — `docs/04_cobranza:L51`
- [ ] System blocks cash closure if bill ID mismatch — alerts Gerencia — `docs/01_actores:L45`

## Epic 3: Inconsistency Management
### Feature 3.1: Discrepancy Resolution
- [ ] Inconsistency listing filtered by type: MONTO_DIFIERE, VOUCHER_ILEGIBLE, DEPOSITO_NO_FIGURA, etc. — `docs/05_consolidacion:L18`
- [ ] Side-by-side view: digital voucher vs. suggested bank movement — `docs/05_consolidacion:L20`
- [ ] Manual correction for data entry errors — `docs/05_consolidacion:L21`
- [ ] Resolution recording with explanation text in `resolucion` field — `docs/05_consolidacion:L23`
- [ ] Escalation workflow: contact client via WhatsApp/call from error record — `docs/05_consolidacion:L22`

### Feature 3.2: Portfolio Impact
- [ ] Conciliated payments officially update loan balance as "amortized" — `docs/05_consolidacion:L27`

> [!NOTE]
> **Database ready.** All 4 tables exist with full schema and RLS policies. No frontend implementation exists yet.

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| Collection | `conciliacion_detalle.pago_id` — reconciles payments |
| Formalization | Conciliated payments update `prestamos.saldo_pendiente` |
| Audit | All reconciliation actions logged to `audit_logs` |
