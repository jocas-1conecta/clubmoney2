# Plan de Onboarding — Sistema de Gobernanza IA para Proyecto Existente

> **Instrucción para el agente:** Sigue este plan paso a paso. Cada fase produce un entregable concreto. No avances a la siguiente fase sin completar la actual.

---

## Fase 0 — Preparación

```
[ ] 0.1  Verificar que existe .agent/skills/ en el proyecto (si no, notificar al usuario)
[ ] 0.2  Verificar que existe .gitignore adecuado
[ ] 0.3  Verificar que existe .env.example
```

---

## Fase 1 — Auditoría del Proyecto

Recorre toda la estructura del proyecto para inventariar:

```
[ ] 1.1  Estructura de carpetas de src/ (páginas, componentes, hooks, services, utils)
[ ] 1.2  Tablas de la base de datos (de migrations, types, o schema)
[ ] 1.3  Edge Functions / API routes (si existen)
[ ] 1.4  Rutas de la aplicación (protegidas y públicas)
[ ] 1.5  Convenciones de código actuales (CSS, state management, auth pattern)
[ ] 1.6  Estado de seguridad (RLS, auth guards, secretos)
[ ] 1.7  Git: branch principal, CI/CD, plataforma de deploy
```

**Salida:** Informe de auditoría con todos los datos descubiertos.

---

## Fase 2 — Crear/Actualizar AGENTS.md

Usando los datos de la Fase 1, crear o actualizar `AGENTS.md` en la raíz del proyecto siguiendo esta plantilla. Reemplazar todo `{{...}}` con datos reales del proyecto. Las secciones marcadas con `📋 COPIAR TAL CUAL` no se modifican.

### ─── PLANTILLA AGENTS.md ───

````markdown
# {{NOMBRE_PROYECTO}} — Instrucciones para Agentes de IA (AGENTS.md)

## Identidad del Proyecto
- **Nombre:** {{NOMBRE_PROYECTO}}
- **Tipo:** {{TIPO}} (ej: SPA, API, Monorepo, Bot)
- **Stack:** {{STACK}} (ej: React 19 + Vite 6 + TypeScript + Supabase + Cloudflare Pages)
- **Repositorio:** {{REPO_URL}}
- **Producción:** {{PROD_URL}}

## Reglas Obligatorias

### Código
- **TypeScript estricto:** Todo archivo nuevo debe ser `.tsx` o `.ts`. Nunca `.js`.
- **Tipos explícitos:** Importar de `{{RUTA_TYPES}}`. Crear nuevas interfaces ahí.
- **Estilos:** {{REGLA_CSS}} (ej: CSS vanilla en index.css / Tailwind CSS / etc.)
- **{{REGLA_DOMINIO_1}}:** {{DESCRIPCIÓN}} (ej: Precisión financiera con r2())
- **{{REGLA_DOMINIO_2}}:** {{DESCRIPCIÓN}} (ej: Soft delete siempre, nunca hard delete)
- **CRUD via hook/service:** {{PATRÓN_DATOS}} (ej: Usar useSupabase() para BD. Nunca llamar supabase.from() directo en componentes.)
- **Auth via hook:** {{PATRÓN_AUTH}} (ej: Usar useAuth() para sesión. Nunca llamar supabase.auth directamente.)
- **Sanitización HTML:** Todo uso de `dangerouslySetInnerHTML` DEBE pasar por `sanitizeHtml()`.

### Estructura de Archivos
```
src/
├── {{CARPETA_1}}/    → {{DESCRIPCIÓN}}
├── {{CARPETA_2}}/    → {{DESCRIPCIÓN}}
├── {{CARPETA_3}}/    → {{DESCRIPCIÓN}}
├── {{CARPETA_4}}/    → {{DESCRIPCIÓN}}
└── {{CARPETA_5}}/    → {{DESCRIPCIÓN}}
```

### Seguridad
- **RLS:** {{ESTADO_RLS}} (ej: Siempre activo / 9 tablas sin RLS — deuda crítica)
- **Patrón de acceso:** {{PATRÓN}} (ej: authenticated = CRUD completo. anon = bloqueado.)
- **Secretos:** Nunca hardcodear keys. Usar `{{PREFIJO_ENV}}` (ej: import.meta.env.VITE_*).
- **{{REGLA_SEGURIDAD_EXTRA}}:** {{DESCRIPCIÓN}}

### Rutas
- **Protegidas:** {{PATRÓN_PROTEGIDAS}} (ej: Envueltas en <Route element={<AuthGuard />}>)
- **Públicas:** {{PATRÓN_PÚBLICAS}} (ej: Fuera del AuthGuard — /login, /ver/:token)

### Git y Despliegue
- **Branch principal:** {{BRANCH}} (ej: main)
- **Commits:** Conventional Commits (`feat`, `fix`, `ref`, `docs`, `chore`).
- **Remote principal:** `origin` → `{{ORG}}/{{REPO}}`.
- **Build:** {{BUILD_CMD}} (ej: npm run build → tsc -b && vite build)
- **Deploy:** {{DEPLOY}} (ej: Cloudflare Pages CI/CD automático en push a main)

## Tablas de Base de Datos Actuales
| Tabla | Descripción |
|---|---|
| {{tabla_1}} | {{descripción}} |
| {{tabla_2}} | {{descripción}} |

## Edge Functions / API Routes
| Función | Descripción | Auth |
|---|---|---|
| {{función_1}} | {{descripción}} | Sí / No |

## Documentación y PRD (Fuente Única de Verdad)
- **Requerimientos y documentación:** `/prd/` (estructura DDD por bounded context)
  - `prd/00-Vision-y-Arquitectura.md` — Visión global, stack, deploy
  - `prd/core/` — Auth, seguridad, configuración base
  - `prd/modulos/{{dominio}}/` — PRDs por bounded context

### Metodología de Documentación PRD

<!-- 📋 COPIAR TAL CUAL — no modificar -->

#### Estructura de un archivo PRD de módulo

Todo archivo PRD dentro de `/prd/modulos/` DEBE seguir esta plantilla:

```markdown
# Módulo [Dominio]: [Nombre] — PRD Técnico

> **Dominio:** [bounded context] | **Estado:** ✅ Completado / 🚧 En progreso / 📋 Planificado
> **Última actualización:** YYYY-MM-DD
> **Formato:** Lean PRD optimizado para LLM

## Metadata
| Campo | Valor |
|---|---|
| Propietario | [Módulo / área] |
| Tabla BD | `nombre_tabla` |
| Interfaz TypeScript | `NombreTipo` → `src/types.ts:L##-L##` |
| Página/Componente | `src/pages/NombrePagina.tsx` |
| Ruta | `/ruta` (protegida / pública) |
| RLS | Políticas activas / pendientes |

## Épica N: [Nombre]
### Feature N.M: [Nombre]
- [x] Requisito completado — referencia a archivo/línea
- [ ] Requisito pendiente

## Dependencias Downstream
| Módulo consumidor | Relación |
|---|---|

## Roadmap (vN — pendiente)
- [ ] Mejoras futuras planificadas
```

#### Convenciones de nombrado

| Tipo | Convención | Ejemplo |
|---|---|---|
| Archivos core | `NN-Nombre-Descriptivo.md` | `04-Supabase-Arquitectura.md` |
| Archivos módulo | `NN-Nombre.md` dentro de `modulos/<dominio>/` | `modulos/crm/01-Clientes.md` |
| Nuevo dominio | Crear carpeta en `modulos/` con kebab-case | `modulos/facturacion/` |
| Estado en header | Emoji + texto | ✅ Completado, 🚧 En progreso, 📋 Planificado |
| Requisitos | Checkbox con estado | `- [x]` completado, `- [ ]` pendiente |

#### Reglas de escalabilidad

1. **Un archivo por bounded context.**
2. **Dividir cuando >200 líneas.** Extraer sub-features a archivos nuevos numerados.
3. **Nuevo dominio = nueva carpeta.**
4. **Actualizar índice.** Al crear un nuevo archivo PRD, agregarlo al `00-Vision-y-Arquitectura.md`.
5. **Mantener trazabilidad.** Cada `- [x]` DEBE incluir referencia al archivo fuente.

#### Reglas de sincronización

- **Código nuevo sin PRD:** Documentar inmediatamente como `- [x]`.
- **PRD con `- [x]` sin código:** Marcar como inconsistencia y notificar al usuario.
- **Cambio de arquitectura:** Actualizar `prd/core/` antes de hacer merge.
- **Nueva tabla BD:** Agregar a este AGENTS.md (sección "Tablas").

<!-- FIN sección 📋 -->

### Excepciones Arquitectónicas Documentadas

| Excepción | Archivo | Razón | Fecha |
|---|---|---|---|

## Módulos Activos
- ✅ {{Módulo completado}}
- 🚧 {{Módulo en progreso}}
- 📋 {{Módulo planificado}}

## Skills Disponibles

Este proyecto incluye skills reutilizables en `.agent/skills/`. Cada skill contiene un archivo `SKILL.md` con instrucciones detalladas.

**Cómo usarlos:** Antes de ejecutar una tarea, lee el `SKILL.md` correspondiente con `view_file`.

| Skill | Ruta | Cuándo usarlo |
|---|---|---|
| `writing-plans` | `.agent/skills/writing-plans/SKILL.md` | Paso 2 — Planificación técnica |
| `product-manager-toolkit` | `.agent/skills/product-manager-toolkit/SKILL.md` | Paso 3 — Escribir requerimientos en PRD |
| `wiki-architect` | `.agent/skills/wiki-architect/SKILL.md` | Pasos 1 y 6 — Documentar código existente |
| `documentation` | `.agent/skills/documentation/SKILL.md` | Paso 6 — Actualizar `/prd/` |
| `debugger` | `.agent/skills/debugger/SKILL.md` | Debugging de errores |
| `react-patterns` | `.agent/skills/react-patterns/SKILL.md` | Patrones React modernos |
| `database` | `.agent/skills/database/SKILL.md` | Operaciones de base de datos |
| `github` | `.agent/skills/github/SKILL.md` | Issues, PRs, GitHub CLI |

> **Nota:** Para ver todos los skills disponibles, lista el directorio `.agent/skills/`.

<!-- 📋 COPIAR TAL CUAL — Descubrimiento de Skills -->

### Descubrimiento Automático de Skills (Obligatorio)

Al recibir cualquier tarea de implementación, el agente **DEBE** identificar y asignar skills relevantes:

1. **Escanear resúmenes** — Usar la lista de skills inyectada al inicio de la conversación. **NO leer cada `SKILL.md` individualmente.**
2. **Filtrar por relevancia** — Seleccionar solo los skills cuya descripción coincida con la tarea (2-5 skills).
3. **Leer `SKILL.md`** — Solo de los skills seleccionados.
4. **Asignar en el plan** — Incluir sección `Skills asignados` con skills globales y por subtarea.

**Categorías útiles:**

| Categoría | Cuándo buscar |
|---|---|
| `frontend` / `design` | UI, componentes, CSS, UX |
| `backend` / `database` | BD, queries, RLS, migraciones |
| `testing` / `code-quality` | Tests, linting, code review |
| `security` | Auth, RLS, vulnerabilidades |
| `devops` | Deploy, CI/CD |
| `workflow` / `planning` | Planificación, PRDs, documentación |

<!-- FIN sección 📋 -->

---

<!-- 📋 COPIAR TAL CUAL — Protocolo completo -->

# PROTOCOLO ESTRICTO DE IMPLEMENTACIÓN (Obligatorio para cada tarea)

> **REGLA INMUTABLE:** Cuando el usuario solicite implementar una nueva funcionalidad (feature, bugfix, módulo), DEBES seguir este ciclo de 6 pasos en orden estricto, sin saltarte ninguno.

## Paso 1 — Auditoría y Sincronización

**Acción:** Lee el directorio `/prd/` y el código fuente actual (`src/`).

- Verifica que todo código implementado esté documentado en el PRD correspondiente.
- Si encuentras funcionalidad implementada que NO está en el PRD, usa el skill `wiki-architect` para documentarla como `- [x]`.
- Si encuentras PRD con `- [x]` cuyo código no existe, marca el hallazgo al usuario.

**Salida:** Confirmación de que el PRD y el código están sincronizados.

## Paso 2 — Planificación

**Acción:** Usa el skill `writing-plans` para diseñar un plan de implementación técnico.

- **Descubrir skills:** Sigue el proceso de Descubrimiento Automático de Skills.
- El plan debe incluir: archivos a crear/modificar, rutas exactas, dependencias, y orden de ejecución.
- **Skills asignados:** El plan DEBE incluir una sección final con los skills asignados.
- Presenta el plan al usuario y **ESPERA aprobación explícita** antes de continuar.

**Salida:** Plan aprobado por el usuario, con skills asignados.

## Paso 3 — Actualización de Requerimientos (To Do)

**Acción:** Usa el skill `product-manager-toolkit` para escribir los nuevos requerimientos.

- Abre el archivo PRD correspondiente dentro de `/prd/modulos/<dominio>/` (o créalo si no existe).
- Agrega las nuevas tareas como `- [ ] Descripción técnica del requisito`.
- Estructura: `Épica → Feature → Sub-requisito`.

**Salida:** Archivo PRD actualizado con tareas `- [ ]`.

## Paso 4 — Ejecución del Código

**Acción:** Escribe el código, refactoriza y crea los componentes necesarios.

- Sigue el plan aprobado en el Paso 2 al pie de la letra.
- Usa obligatoriamente los skills que el usuario haya pasado en su prompt original.
- Respeta las reglas de código de este archivo.
- Haz commits frecuentes con Conventional Commits.

**Salida:** Código implementado, build exitoso.

## Paso 5 — Cierre de Requerimientos (Done)

**Acción:** Vuelve al archivo PRD modificado en el Paso 3.

- Cambia `- [ ]` a `- [x]` para cada tarea implementada.
- Agrega referencias al código real: rutas de archivos, números de línea si relevante.

**Salida:** PRD actualizado con todas las tareas completadas como `- [x]`.

## Paso 6 — Actualización de Documentación

**Acción:** Evalúa si la implementación cambió la arquitectura, APIs o dependencias.

- Si SÍ cambió: usa los skills `documentation` y `wiki-architect` para actualizar `/prd/`.
- Si se creó una tabla nueva: agregar a este `AGENTS.md`.
- Si NO cambió la arquitectura: omitir este paso y documentar por qué.

**Salida:** Documentación sincronizada con el código.

---

### Excepciones al Protocolo

- **Bugfix trivial** (1-3 líneas, sin cambio arquitectónico): Saltar pasos 2 y 6.
- **Pregunta investigativa** ("¿cómo funciona X?"): No aplica el protocolo.
- **Refactor de documentación** (sin cambio de código): Solo pasos 1 y 6.
- **Tarea operativa** (instalar deps, git push, config): No aplica. Ejecutar directamente.

<!-- FIN sección 📋 -->
````

### ─── FIN PLANTILLA AGENTS.md ───

---

## Fase 3 — Crear Estructura PRD

```
[ ] 3.1  Crear prd/ si no existe
[ ] 3.2  Crear prd/00-Vision-y-Arquitectura.md (usar plantilla abajo)
[ ] 3.3  Crear prd/core/ con al menos 01-Auth-y-Seguridad.md
[ ] 3.4  Crear prd/modulos/ con una carpeta por bounded context descubierto
[ ] 3.5  Crear un archivo por módulo: prd/modulos/<dominio>/01-<Nombre>.md
```

### ─── PLANTILLA 00-Vision-y-Arquitectura.md ───

````markdown
# {{NOMBRE_PROYECTO}} — Visión y Arquitectura Global

> **Tipo:** Lean PRD | **Versión:** 1.0 | **Última actualización:** {{FECHA}}
> **Optimizado para consumo LLM:** Sin marketing. Referencias exactas a código, tablas y componentes.

---

## 1. Definición del Producto

**{{NOMBRE_PROYECTO}}** es {{DESCRIPCIÓN_CORTA}}.

### Identidad Técnica

| Propiedad | Valor |
|---|---|
| Nombre | {{NOMBRE}} |
| Repositorio | {{REPO}} |
| Producción | {{URL}} |
| Tipo de aplicación | {{TIPO}} |
| Usuarios objetivo | {{USUARIOS}} |

---

## 2. Stack Técnico

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| {{tech}} | {{ver}} | {{propósito}} |

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| {{tech}} | {{ver}} | {{propósito}} |

### Infraestructura

| Servicio | Propósito |
|---|---|
| {{servicio}} | {{propósito}} |

---

## 3. Modelo de Seguridad Base

Documentar: autenticación (componentes, archivos), autorización (roles, RLS), excepciones.

---

## 4. Estructura del PRD (Domain-Driven Design)

```
prd/
├── 00-Vision-y-Arquitectura.md    ← Este archivo
├── core/
│   └── 01-Auth-y-Seguridad.md
└── modulos/
    ├── {{dominio_1}}/
    │   └── 01-{{Nombre}}.md
    └── {{dominio_2}}/
        └── 01-{{Nombre}}.md
```

---

## 5. Mapa de Módulos

### Core

| # | PRD | Estado | Épicas | Features |
|---|---|---|---|---|
| C1 | [Auth y Seguridad](core/01-Auth-y-Seguridad.md) | {{ESTADO}} | {{N}} | {{N}} |

### Módulos de Negocio

| # | Dominio | PRD | Estado | Épicas | Features |
|---|---|---|---|---|---|
| M1 | {{dominio}} | [{{Nombre}}](modulos/{{dominio}}/01-{{Nombre}}.md) | {{ESTADO}} | {{N}} | {{N}} |

---

## 6. Base de Datos Actual

| Tabla | Dominio propietario | Tipo |
|---|---|---|
| {{tabla}} | {{dominio}} | Data Maestra / Transaccional |

### Convención para nuevas tablas

- Nombre en `snake_case` plural
- RLS habilitado obligatoriamente
- Crear interface en tipos centrales
- Documentar en AGENTS.md

---

## 7. Despliegue

### Flujo CI/CD

```
Developer → git push {{BRANCH}} → {{CI}} → {{DEPLOY_TARGET}}
```

### Variables de Entorno

| Variable | Tipo | Configurar en |
|---|---|---|
| {{VAR}} | Pública/Secreta | {{DÓNDE}} |
````

### ─── FIN PLANTILLA 00-Vision ───

---

## Fase 4 — Auditoría Inversa (Código → PRD)

Para cada módulo descubierto en Fase 1:

```
[ ] 4.1  Usar skill @wiki-architect para recorrer el código de cada módulo
[ ] 4.2  Documentar cada feature existente como - [x] (ya implementada)
[ ] 4.3  Incluir referencias exactas: archivo, línea, tabla, columna
[ ] 4.4  Documentar deuda técnica como > [!WARNING] en los PRDs
[ ] 4.5  Cada PRD debe seguir la plantilla de módulo definida en AGENTS.md
```

**Salida:** PRDs completos con todo lo existente documentado como `[x]`.

---

## Fase 5 — Verificación Final

```
[ ] 5.1  Verificar que AGENTS.md tiene TODAS las secciones (identidad, código, archivos,
         seguridad, rutas, git, tablas, funciones, PRD, metodología, sincronización,
         skills, descubrimiento, protocolo 6 pasos, excepciones)
[ ] 5.2  Verificar que cada tabla de BD aparece en AGENTS.md Y en 00-Vision
[ ] 5.3  Verificar que cada módulo activo tiene su PRD en prd/modulos/
[ ] 5.4  Verificar que no hay código implementado sin documentar en algún PRD
[ ] 5.5  Ejecutar build para confirmar que nada se rompió
```

**Salida:** Confirmación de que el proyecto está completamente onboardeado.

---

## Después del Onboarding

A partir de aquí, toda nueva tarea de implementación sigue el **Protocolo de 6 Pasos** definido en AGENTS.md. El proyecto está gobernado.
