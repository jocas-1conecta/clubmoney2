# Estructura de Permisos

Se garantiza la segregación de funciones: quien vende no aprueba, quien cobra no concilia, y quien paga no audita.

Cultura de Responsabilidad Colectiva: Cada rol dentro de Club Money es tratado bajo el modelo de Socio. Esto implica que la responsabilidad sobre la veracidad de la data y el resguardo de los activos es compartida, elevando el nivel de rendición de cuentas en cada interacción con el sistema.

---

## Árbol de Permisos del Sistema

### 1. ROL: ASESOR COMERCIAL
**Perfil:** Operativo/Ventas. Acceso limitado a sus propios prospectos.

**Módulo: Originación**
* CREAR Solicitud de Préstamo (Ingreso de datos estructurados).
* LEER/CARGAR Documentos (Subir fotos DNI, Recibos).
* LEER Estado de Solicitud (Solo visualiza: En Evaluación / Aprobado / Rechazado).

**Módulo: Formalización**
* LEER/IMPRIMIR Contratos y Pagarés (Generados por sistema).
* CARGAR Evidencia de Contrato (Subir foto de contrato firmado).

**PROHIBIDO:** Aprobar créditos, Modificar Score, Desembolsar dinero.

---

### 2. ROL: COBRADOR/VERIFICADOR
**Perfil:** Operativo/Móvil. Acceso estricto por Geolocalización y Ruta asignada.

**Módulo: Originación (Verificación)**
* LEER Visitas Asignadas (Solo ve clientes en su cola de trabajo).
* ESCRIBIR Check-in (Registra Lat/Lon automático, no editable).
* ESCRIBIR Referencias de Entorno (Formulario digital).
* CARGAR Fotos de Fachada/Negocio.

**Módulo: Cobranza Diaria**
* LEER Ruta del Día (Lista ordenada por prioridad).
* LEER Cuaderno Digital (Saldo actual y últimas notas).
* ESCRIBIR Registro de Cobro (Efectivo): Captura obligatoria de fotos de los billetes mediante la App para identificación de sus IDs. No se permite el ingreso manual sin respaldo digital de los valores.
* CARGAR Voucher (Digital): Toma de fotografía del comprobante de transferencia para que el sistema extraiga automáticamente el ID de operación y banco.
* GESTIONAR Chat Interno: Uso del canal oficial para reportar incidencias, enviar imágenes de evidencias o documentos legales durante la ruta.
* SOLICITAR Cierre con Custodia (Pide permiso para no depositar).
* CARGAR Cierre de Ruta (Foto de voucher de depósito global).

**Restricciones de Sistema:**
* Bloqueo Automático: Si saldo_mano > S/ 2,000, se revocan permisos de lectura de ruta hasta depositar.

**PROHIBIDO:** Ver clientes de otras zonas, Editar saldos históricos, Eliminar pagos.

---

### 3. ROL: SUPERVISOR
**Perfil:** Táctico/Aprobador. Acceso a excepciones y riesgos.

**Módulo: Originación**
* LEER Tablero de Decisión Completo (Score + Fotos + Mapas).
* EJECUTAR Dictamen (Aprobar/Rechazar/Observar).
* EDITAR Condiciones Finales (Ajustar monto o tasa sugerida).

**Módulo: Cobranza**
* APROBAR Solicitud de Cierre con Custodia (Autoriza al cobrador a llevarse efectivo).

**Módulo: Morosidad**
* ESCRIBIR Refinanciamiento (Ingresar nuevas condiciones para novación).

**PROHIBIDO:** Modificar la tabla de pagos conciliados (caja cerrada), Ejecutar desembolsos (función de Tesorería).

---

### 4. ROL: TESORERÍA
**Perfil:** Administrativo/Pagador. Acceso a flujo de dinero saliente.

**Módulo: Formalización**
* LEER Cola de Desembolso (Solo préstamos aprobados).
* VALIDAR Documentos Legales (Check visual de calidad de foto contrato).
* RECHAZAR Documento (Devuelve flujo al Asesor para corrección).
* EJECUTAR Desembolso (Registra la transferencia y fecha).

**Módulo: Consolidación**
* LEER Inconsistencias de Pago.

**PROHIBIDO:** Aprobar créditos, Crear clientes.

---

### 5. ROL: ASESOR ADMINISTRATIVO
**Perfil:** Gestión y Auditoría Operativa.

**Módulo: Consolidación y Pagos**
* LEER Alertas de Inconsistencia (Pagos no cruzados).
* EDITAR Resolución de Pago (Corregir monto, validar voucher manual).
* LEER Movimientos Bancarios (Para cruce manual).

**Módulo: Morosidad**
* LEER Bandeja de Casos de Morosidad.
* ESCRIBIR Acciones de Gestión (Registrar llamadas, chats, promesas).
* LEER Historial de Chats Centralizados.

**Módulo: Custodia**
* VALIDAR Recepción de Pagaré (Check físico que libera comisiones del asesor).

**PROHIBIDO:** Tocar dinero (Caja), Aprobar refinanciamientos (Rol Supervisor).

---

## Matriz de Segregación de Riesgos (SOD)

| Acción | Quién la inicia | Quién la valida | Riesgo Evitado |
| :--- | :--- | :--- | :--- |
| **Nuevo Crédito** | Asesor Comercial | Supervisor (Decisión) | Créditos fantasma / Amiguismo |
| **Salida de Dinero** | Supervisor (Aprobación) | Tesorería (Validación Doc.) | Desembolso sin contrato legal |
| **Ingreso de Efectivo** | Cobrador | Sistema (Conciliación Auto) | Robo de recaudación ("Jineteo") |
| **Excepción de Caja** | Cobrador | Supervisor | Robo por "falso asalto" o pérdida |
| **Pagaré Físico** | Asesor Comercial | Asesor Administrativo | Pérdida de valor legal del título |
| **Consolidación de Efectivo** | (Foto Cobrador Billetes) | Tesorería (Validación ID Billetes) | Intercambio de billetes falsos o faltantes físicos. |
| **Conciliación Bancaria** | Motorizado (Foto Voucher) | Supervisor (Subida de Consolidado) | Error en la digitación de IDs de transferencia o depósitos fantasmales. |
| **Comunicación Operativa** | Socio Empleado | Sistema (Log de Chat Interno) | Fuga de información o acuerdos informales fuera de los canales oficiales. |

---

## Seguridad y Privacidad de Datos (Compliance)
Dado que se maneja información financiera y personal (PII), el sistema debe regirse por estrictas reglas de seguridad a nivel de código y base de datos:

- **Role-Level Security (RLS):** Supabase debe tener políticas RLS activadas en TODAS las tablas. Un Asesor Comercial nunca debe poder hacer una consulta SQL (vía API) que le devuelva los prospectos de otro Asesor.
- **Enmascaramiento de Datos (Data Masking):** En los paneles web, datos sensibles como números de cuenta bancaria completos o números de teléfono de clientes morosos deben mostrarse parcialmente ocultos (ej. `***-***-1234`) para roles que no requieran ver el dato completo.
- **Gestión de Secretos:** Las claves de las APIs (RENIEC, WhatsApp, Seeker) deben vivir estrictamente en variables de entorno (`.env`) en el backend/Edge Functions. Bajo ninguna circunstancia deben exponerse en el código del Frontend o la App Móvil.