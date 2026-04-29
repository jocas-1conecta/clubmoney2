# ClubMoney2 — AI Agent Instructions (AGENTS.md)

## Project Identity
- **Name:** ClubMoney2
- **Type:** SPA (Single Page Application) — Microfinance Operations Panel
- **Stack:** React 19 + Vite 8 + TypeScript 5.9 + Tailwind CSS 4 + Supabase + Cloudflare Pages
- **Repository:** https://github.com/jocas-1conecta/clubmoney2.git
- **Production:** TBD (Cloudflare Pages)

## Mandatory Rules

### Code
- **Strict TypeScript:** Every new file must be `.tsx` or `.ts`. Never `.js`.
- **Explicit types:** Import from `src/types/`. Create new interfaces there.
- **Styles:** Tailwind CSS v4 via `@tailwindcss/vite` plugin. Custom design tokens in `src/index.css`.
- **Financial precision:** Use `NUMERIC(10,2)` in SQL and proper rounding in TypeScript. Never use float for money.
- **Zero-delete policy:** Soft delete only — manage via `estado` columns. Never execute hard deletes.
- **CRUD via hook:** Use custom hooks (`useClientes`, `useSolicitudes`, etc.) for data operations. Never call `supabase.from()` directly in components.
- **Auth via hook:** Use `useAuth()` for session/role access. Never call `supabase.auth` directly.
- **HTML sanitization:** Any use of `dangerouslySetInnerHTML` MUST pass through `sanitizeHtml()`.

### File Structure
```
web/src/
├── pages/            → Route-level page components (one per route)
├── components/
│   ├── auth/         → Auth guards (ProtectedRoute)
│   ├── layout/       → Shell layouts (DashboardLayout)
│   ├── onboarding/   → Guided onboarding flow (OnboardingProvider, TourGuidePanel)
│   ├── solicitudes/  → Loan application domain components
│   └── ui/           → Shared UI primitives (Button, Modal, DataTable, Toast, etc.)
├── hooks/            → Custom hooks for data fetching & business logic
├── types/            → TypeScript interfaces (auth, clientes, solicitudes, prestamos, cobranza, morosidad)
├── utils/supabase/   → Supabase client initialization
├── assets/           → Static assets
├── index.css         → Global CSS (Tailwind + design tokens)
├── App.tsx           → Router & providers
└── main.tsx          → Entry point
```

### Security
- **RLS:** Enabled on ALL 43 tables with role-based policies via `has_role()` SECURITY DEFINER functions.
- **Access pattern:** Authenticated users get role-based CRUD. Anonymous access is fully blocked.
- **Secrets:** Never hardcode keys. Use `import.meta.env.VITE_*` for frontend, `SUPABASE_SERVICE_ROLE_KEY` for backend.
- **RBAC model:** 6 roles (ASESOR_COMERCIAL, COBRADOR_VERIFICADOR, SUPERVISOR, TESORERIA, ASESOR_ADMINISTRATIVO, GERENCIA) + per-user grant/deny overrides.

### Routes
- **Protected:** Wrapped in `<Route element={<ProtectedRoute />}>` — `/`, `/clientes`, `/clientes/:id`, `/solicitudes`, `/solicitudes/:id`, `/prestamos`, `/cobranza`, `/cobranza/:id`, `/morosidad`, `/configuracion`
- **Public:** Outside the AuthGuard — `/login`, `/sin-acceso`

### Git and Deployment
- **Main branch:** `main`
- **Commits:** Conventional Commits (`feat`, `fix`, `ref`, `docs`, `chore`).
- **Primary remote:** `origin` → `jocas-1conecta/clubmoney2`.
- **Build:** `npm run build` → `tsc -b && vite build`
- **Deploy:** Cloudflare Pages CI/CD, automatic on push to `main`.

### Available Credentials & Access (`.env`)

> **RULE:** The agent has direct access to all these services. **NEVER** ask the user to do something the agent can do with these credentials.

**File:** `web/.env`

| Variable | Service | Capabilities |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase API | Base URL: `https://grkwwtnbwphplebaibxs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase (anon) | Public operations, RLS-restricted |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (admin) | **CRUD without RLS**, Storage, Auth admin |
| `DATABASE_URL` | PostgreSQL direct | Direct pooler connection (SQL queries, migrations) |

**Authenticated CLIs:**

| CLI | Status | Capabilities |
|---|---|---|
| `gh` (GitHub CLI) | ✅ Authenticated as `jocas-1conecta` | Issues, PRs, releases, Actions, API |
| `npx supabase` | ✅ Linked to project | Storage, migrations, edge functions, db push |
| `git` | ✅ Configured with HTTPS | Push, pull, commits, branches |
| `npm` | ✅ Node.js local | Build, dev server, dependencies |

**Operations the agent can perform without permission:**
- Create/upload files to Supabase Storage via REST API + `SUPABASE_SERVICE_ROLE_KEY`
- Create issues and PRs on GitHub via `gh`
- Execute SQL migrations directly via `DATABASE_URL` or Supabase CLI
- Automatic deploy by running `git push origin main` (Cloudflare Pages CI/CD)

## Database Tables (43 Total)

### Layer 1 — Foundation
| Table | Description |
|---|---|
| `perfiles` | User profiles extending Supabase `auth.users` |
| `roles` | Catalog of 6 system roles |
| `permisos` | Atomic permissions catalog |
| `rol_permisos` | Role ↔ Permission mapping (M:M) |
| `usuario_roles` | User ↔ Role assignments (M:M) |
| `usuario_permisos` | Per-user permission overrides (grant/deny) |
| `zonas` | Geographic zone catalog |
| `asignaciones_zona` | Dynamic collector ↔ zone assignment with history |
| `configuracion_sistema` | Editable system parameters (key-value with zone override) |

### Layer 2 — Origination
| Table | Description |
|---|---|
| `clientes` | Master client (debtor) registry |
| `solicitudes_prestamo` | Loan application pipeline |
| `documentos_solicitud` | Applicant document evidence |
| `seeker_resultados` | Credit bureau API response (Seeker) |
| `visitas_presenciales` | Field verification and collection visits |
| `evidencias` | Georeferenced visit files |
| `referencias_entorno` | Neighborhood verification form |
| `revisiones_supervisor` | Credit committee rulings |

### Layer 3 — Formalization
| Table | Description |
|---|---|
| `prestamos` | Core financial entity (loans) |
| `cuotas_programadas` | Payment schedule (FIJO/FLEXIBLE/HIBRIDO) |
| `contratos` | Legal documents (contracts and promissory notes) |
| `recepcion_pagares` | Promissory note chain of custody |
| `desembolsos` | Disbursement records |

### Layer 4 — Collection
| Table | Description |
|---|---|
| `rutas_cobranza` | Daily collection route plan |
| `ruta_clientes` | Clients in a collection route |
| `pagos` | Transactional payment records |
| `registro_billetes` | Individual banknote traceability (anti-fraud) |
| `vouchers` | Digital payment vouchers with OCR extraction |
| `cuadernos_cliente` | Digital ledger per loan |
| `registros_cuaderno` | Chronological ledger entries |

### Layer 5 — Consolidation
| Table | Description |
|---|---|
| `movimientos_bancarios` | Imported bank transactions |
| `conciliaciones` | Reconciliation batch |
| `conciliacion_detalle` | Payment ↔ bank movement cross-reference |
| `inconsistencias_pago` | Payment discrepancies for human resolution |

### Layer 6 — Delinquency
| Table | Description |
|---|---|
| `casos_morosidad` | Delinquency cases (auto-generated daily) |
| `acciones_morosidad` | Collection action log per case |
| `novaciones` | Refinancing/novation accounting bridge |

### Layer 7 — Communication, Commissions & Audit
| Table | Description |
|---|---|
| `chats` | Channels and conversation threads |
| `chat_participantes` | Channel/thread members |
| `mensajes_chat` | Messages + system events |
| `notificaciones` | Omnichannel outbound communications |
| `reglas_comision` | Configurable commission formulas |
| `comisiones` | Individual commission records with approval flow |
| `audit_logs` | Immutable audit trail (append-only, trigger-protected) |

## Edge Functions / API Routes
| Function | Description | Auth |
|---|---|---|
| — | No Edge Functions deployed yet | — |

> **Note:** External API integrations (RENIEC, Seeker, OCR) are planned but not yet implemented as Edge Functions.

## Documentation and PRD (Single Source of Truth)
- **Requirements and documentation:** `/prd/` (DDD bounded-context structure)
  - `prd/00-Vision-and-Architecture.md` — Global vision, stack, deployment
  - `prd/core/` — Auth, security, base configuration
  - `prd/modules/<domain>/` — PRDs by bounded context

### PRD Methodology

<!-- 📋 COPY AS-IS — do not modify -->

#### Module PRD File Structure

Every PRD file inside `/prd/modules/` MUST follow this template:

```markdown
# Module [Domain]: [Name] — Technical PRD

> **Domain:** [bounded context] | **Status:** ✅ Completed / 🚧 In Progress / 📋 Planned
> **Last updated:** YYYY-MM-DD
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | [Module / area] |
| DB Table | `table_name` |
| TypeScript Interface | `TypeName` → `src/types.ts:L##-L##` |
| Page/Component | `src/pages/PageName.tsx` |
| Route | `/route` (protected / public) |
| RLS | Active policies / pending |

## Epic N: [Name]
### Feature N.M: [Name]
- [x] Completed requirement — file/line reference
- [ ] Pending requirement

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|

## Roadmap (vN — pending)
- [ ] Planned future improvements
```

#### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Core files | `NN-Descriptive-Name.md` | `01-Auth-and-Security.md` |
| Module files | `NN-Name.md` inside `modules/<domain>/` | `modules/clients/01-Clients.md` |
| New domain | Create folder in `modules/` with kebab-case | `modules/collection/` |
| Status in header | Emoji + text | ✅ Completed, 🚧 In Progress, 📋 Planned |
| Requirements | Checkbox with status | `- [x]` completed, `- [ ]` pending |

#### Scalability Rules

1. **One file per bounded context.**
2. **Split when >200 lines.** Extract sub-features to new numbered files.
3. **New domain = new folder.**
4. **Update index.** When creating a new PRD file, add it to `00-Vision-and-Architecture.md`.
5. **Maintain traceability.** Every `- [x]` MUST include a reference to the source file.

#### Synchronization Rules

- **New code without PRD:** Document immediately as `- [x]`.
- **PRD with `- [x]` without code:** Flag as inconsistency and notify user.
- **Architecture change:** Update `prd/core/` before merging.
- **New DB table:** Add to this AGENTS.md (section "Database Tables").

<!-- END 📋 section -->

### Documented Architectural Exceptions

| Exception | File | Reason | Date |
|---|---|---|---|
| Navigator locks bypass | `web/src/utils/supabase/client.ts` | GoTrue lock causes hangs in React Strict Mode. Safe for single-tab admin panel. | 2026-03 |
| Legacy `docs/` folder retained | `docs/` | Historical reference in Spanish. All new documentation goes to `prd/`. | 2026-04 |

## Active Modules
- ✅ Auth & Security (login, RBAC, RLS)
- ✅ Clients (CRUD, detail view, zone assignment)
- ✅ Loan Applications (pipeline, document upload, supervisor review, formalization)
- ✅ Loans (listing, detail, state management)
- ✅ Daily Collection (routes, payments, route management)
- ✅ Delinquency Management (cases, actions, assignment)
- ✅ System Configuration (parameters, zones, roles/permissions)
- ✅ Dashboard (KPIs, charts, stats)
- 📋 Consolidation / Reconciliation (DB ready, UI not implemented)
- 📋 Communication / Chat (DB ready, UI not implemented)
- 📋 Commissions (DB ready, UI not implemented)
- 📋 Notifications (DB ready, UI not implemented)
- 📋 Onboarding Tour (partially implemented)

## Skills Available

This project includes reusable skills in `.agent/skills/`. Each skill contains a `SKILL.md` file with detailed instructions.

**How to use:** Before executing a task, read the corresponding `SKILL.md` with `view_file`.

| Skill | Path | When to Use |
|---|---|---|
| `writing-plans` | `.agent/skills/writing-plans/SKILL.md` | Step 2 — Technical planning |
| `product-manager-toolkit` | `.agent/skills/product-manager-toolkit/SKILL.md` | Step 3 — Writing requirements in PRD |
| `wiki-architect` | `.agent/skills/wiki-architect/SKILL.md` | Steps 1 & 6 — Documenting existing code |
| `documentation` | `.agent/skills/documentation/SKILL.md` | Step 6 — Updating `/prd/` |
| `debugger` | `.agent/skills/debugger/SKILL.md` | Debugging errors |
| `react-patterns` | `.agent/skills/react-patterns/SKILL.md` | Modern React patterns |
| `database` | `.agent/skills/database/SKILL.md` | Database operations |
| `github` | `.agent/skills/github/SKILL.md` | Issues, PRs, GitHub CLI |

> **Note:** To see all available skills, list the `.agent/skills/` directory.

<!-- 📋 COPY AS-IS — Skill Discovery -->

### Automatic Skill Discovery (Mandatory)

When receiving any implementation task, the agent **MUST** identify and assign relevant skills:

1. **Scan summaries** — Use the skills list injected at the start of the conversation. **DO NOT read each `SKILL.md` individually.**
2. **Filter by relevance** — Select only skills whose description matches the task (2-5 skills).
3. **Read `SKILL.md`** — Only for the selected skills.
4. **Assign in plan** — Include an `Assigned Skills` section with global and per-subtask skills.

**Useful Categories:**

| Category | When to Search |
|---|---|
| `frontend` / `design` | UI, components, CSS, UX |
| `backend` / `database` | DB, queries, RLS, migrations |
| `testing` / `code-quality` | Tests, linting, code review |
| `security` | Auth, RLS, vulnerabilities |
| `devops` | Deploy, CI/CD |
| `workflow` / `planning` | Planning, PRDs, documentation |

<!-- END 📋 section -->

---

<!-- 📋 COPY AS-IS — Full protocol -->

# STRICT IMPLEMENTATION PROTOCOL (Mandatory for every task)

> **IMMUTABLE RULE:** When the user requests implementing new functionality (feature, bugfix, module), you MUST follow this 6-step cycle in strict order, without skipping any step.

## Step 1 — Audit and Synchronization

**Action:** Read the `/prd/` directory and the current source code (`src/`).

- Verify that all implemented code is documented in the corresponding PRD.
- If you find implemented functionality that is NOT in the PRD, use the `wiki-architect` skill to document it as `- [x]`.
- If you find PRD entries with `- [x]` whose code does not exist, flag the finding to the user.

**Output:** Confirmation that the PRD and code are synchronized.

## Step 2 — Planning

**Action:** Use the `writing-plans` skill to design a technical implementation plan.

- **Discover skills:** Follow the Automatic Skill Discovery process.
- The plan must include: files to create/modify, exact paths, dependencies, and execution order.
- **Assigned skills:** The plan MUST include a final section with the assigned skills.
- Present the plan to the user and **WAIT for explicit approval** before continuing.

**Output:** User-approved plan with assigned skills.

## Step 3 — Requirements Update (To Do)

**Action:** Use the `product-manager-toolkit` skill to write the new requirements.

- Open the corresponding PRD file in `/prd/modules/<domain>/` (or create it if it doesn't exist).
- Add new tasks as `- [ ] Technical requirement description`.
- Structure: `Epic → Feature → Sub-requirement`.

**Output:** Updated PRD file with `- [ ]` tasks.

## Step 4 — Code Execution

**Action:** Write the code, refactor, and create the necessary components.

- Follow the approved plan from Step 2 to the letter.
- Mandatorily use the skills that the user passed in their original prompt.
- Respect the code rules in this file.
- Make frequent commits with Conventional Commits.

**Output:** Implemented code, successful build.

## Step 5 — Requirements Closure (Done)

**Action:** Return to the PRD file modified in Step 3.

- Change `- [ ]` to `- [x]` for every implemented task.
- Add references to actual code: file paths, line numbers if relevant.

**Output:** Updated PRD with all tasks completed as `- [x]`.

## Step 6 — Documentation Update

**Action:** Evaluate whether the implementation changed the architecture, APIs, or dependencies.

- If YES: use the `documentation` and `wiki-architect` skills to update `/prd/`.
- If a new table was created: add it to this `AGENTS.md`.
- If NO architecture change: skip this step and document why.

**Output:** Documentation synchronized with code.

---

### Protocol Exceptions

- **Trivial bugfix** (1-3 lines, no architectural change): Skip steps 2 and 6.
- **Investigative question** ("how does X work?"): Protocol does not apply.
- **Documentation refactor** (no code change): Only steps 1 and 6.
- **Operational task** (install deps, git push, config): Does not apply. Execute directly.

<!-- END 📋 section -->
