# Actores del Proceso

> **Versión:** 2.0
> **Última actualización:** 2026-04-14
> **Responsable:** Producto / Tecnología

---

## 1. El Sistema
El cerebro operativo que reemplaza la coordinación manual.

**Intervenciones Clave:**
* **Filtro de Seguridad:** Valida identidad con RENIEC/Biometría y detecta clientes recurrentes al instante.
* **Decisor Lógico:** Decide si un cliente va a "Verificación de Campo" o aplica a "Renovación Express" (Bypass) según su historial.
* **Jefe de Ruta:** Planifica la ruta de cobranza diaria priorizando morosos y promesas de pago, sin intervención humana.
* **Auditor de Caja e Identificación de Valores:** Bloquea la App del cobrador si excede el límite de efectivo. Además, utiliza tecnología de reconocimiento para registrar los IDs de los billetes y capturar automáticamente datos de transferencias bancarias (ID, banco, emisor).
* **Contador Automático:** Concilia pagos vs. bancos y "mata" los préstamos antiguos al refinanciar para mantener la data histórica limpia.
* **Gestor de Comunicación y Notificaciones:** Centraliza el Chat Interno para el envío de documentos y coordina el envío de las 7 alertas omnicanal (WhatsApp, SMS, Email) sobre el progreso de deuda.
* **Orquestador de Formalización:** Genera automáticamente contratos, pagarés y cronograma de cuotas al aprobarse un crédito. Bloquea el desembolso si el contrato no está firmado ni validado. Bloquea comisiones si el pagaré no fue recibido.

**Responsabilidad:** Garantizar la integridad de la data, la seguridad antifraude y la eficiencia logística.

---

## 2. El Asesor Comercial
De "tomador de pedidos" a "gestor de cumplimiento".

**Intervenciones Clave:**
* **Captación Estructurada:** Ingresa la solicitud de forma estructurada con DNI, documentos requeridos y condiciones del préstamo (no fotos sueltas en WhatsApp).
* **Facilitador de Firma:** Coordina la firma del contrato con el cliente (física o digital), imprime los documentos generados por el sistema y sube la foto del contrato firmado.
* **Custodio Temporal del Pagaré:** Recibe el pagaré firmado del cliente y lo entrega al Administrador al cierre del día.
* **Canal de Re-subida:** Si Tesorería devuelve un contrato por calidad insuficiente, el asesor recibe la notificación en su Activity Feed y re-sube la foto corregida.

**Responsabilidad Crítica (Accountability):** Cadena de Custodia Legal. Es el responsable de que el pagaré físico (título valor) llegue al archivo. Si pierde el papel, la empresa pierde la capacidad de juicio ejecutivo.

---

## 3. Tesorería
De "pagador" a "filtro de seguridad".

**Intervenciones Clave:**
* **Validación Visual de Contratos:** Recibe la orden de desembolso y revisa en pantalla que la foto del contrato/pagaré cargado sea legible, esté firmado y corresponda al DNI antes de soltar el dinero.
* **Decisión Validar/Devolver:** Si el documento está correcto, lo valida (`VALIDADO`). Si no, lo devuelve (`DEVUELTO`) con motivo, notificando automáticamente al asesor.
* **Ejecución del Desembolso:** Ejecuta la transferencia bancaria y registra el comprobante (número de operación, captura de pantalla) en el sistema.
* **Cuadre de Caja Físico:** Al recibir el efectivo, Tesorería debe identificar los IDs de los billetes (manual o con contador) y capturar la evidencia fotográfica. El sistema bloquea el Cierre de Caja si los IDs no coinciden con los registrados originalmente por el motorizado en campo y envía alertas a Gerencia.

**Responsabilidad Crítica:** Prevención de Errores/Colusión. Es la última barrera para evitar desembolsar dinero sobre documentos mal firmados, borrosos o fraudulentos subidos por un asesor.

---

## 4. El Cobrador/Verificador
El operador táctico georreferenciado.

**Intervenciones Clave:**
* **Verificación de Campo:** Recopila evidencia (fotos de fachada, negocio, DNI en mano) y completa el formulario de entorno con referencias vecinales, validando domicilios con GPS.
* **Ejecución de Cobranza:** Ejecuta la ruta dictada por la App, registrando pagos en efectivo (con foto de billetes) o digitales (con foto de voucher).
* **Gestión de Efectivo:** Registra cobros y realiza depósitos en agentes bancarios durante la ruta o al cierre del día.
* **Manejo de Contingencia:** Solicita autorización para "Cierre con Custodia" si fallan los agentes bancarios, trasladando el saldo como pendiente para el día siguiente.

**Responsabilidad Crítica:** Seguridad del Efectivo y Veracidad de Visita. Es responsable de depositar lo recaudado y de que el GPS demuestre que realmente visitó al cliente (evitando el "cobro desde casa").

---

## 5. El Supervisor
El gestor de riesgos y aprobador.

**Intervenciones Clave:**
* **Comité de Crédito:** Analiza el Tablero de Decisión (Score Seeker + Fotos + Mapa GPS + Referencias vecinales + Historial) para aprobar, rechazar u observar créditos nuevos.
* **Aprobador de Contingencias:** Autoriza digitalmente cuando un cobrador se queda con efectivo por falla de agentes (Cierre en Custodia).
* **Negociador de Refinanciamiento:** Define las condiciones de refinanciamiento (Novación), incluyendo posibles condonaciones parciales con justificación obligatoria.
* **Revisor de Renovaciones Express:** Recibe notificación informativa de auto-aprobaciones y puede revertir si detecta anomalías.

**Responsabilidad Crítica:** Calidad de la Cartera. Su firma digital es la que autoriza el riesgo crediticio y las excepciones operativas de caja.

---

## 6. Asesor Administrativo
Gestor de anomalías y custodio.

**Intervenciones Clave:**
* **Gestión de Inconsistencias:** Solo interviene cuando el robot de conciliación falla (ej. voucher ilegible, monto no coincide, depósito no figura).
* **Gestión de Mora Temprana:** Realiza llamadas y chats centralizados desde el sistema para clientes con atraso temprano (< 15 días).
* **Custodio de Títulos Valores:** Valida la recepción física de los pagarés entregados por los asesores mediante checklist digital. Marca cada pagaré como `RECIBIDO`, desbloqueando las comisiones del asesor.
* **Archivo Físico:** Almacena y organiza los pagarés originales en el archivo de la empresa, garantizando su disponibilidad para procesos judiciales futuros.

**Responsabilidad Crítica:** Resolución de Conflictos y Archivo. Asegura que las cuentas cuadren cuando la automatización no puede, y resguarda los activos legales (papeles).

---

## 7. Gerencia
Visión estratégica y supervisión macro de la operación.

**Intervenciones Clave:**
* **Dashboard Ejecutivo:** Supervisión a través de una App exclusiva con Dashboard global, métricas de cartera, indicadores de morosidad y alertas de riesgo en tiempo real.
* **Definición de Políticas:** Configura los parámetros del sistema (límites de efectivo, días de tolerancia para mora, umbrales de score, reglas de comisiones) desde el panel de Configuración.
* **Aprobación de Excepciones:** Interviene en procedimientos de excepción como reversión de dictámenes, anulación de desembolsos o condonaciones significativas.
* **Auditoría y Compliance:** Acceso completo a `audit_logs` para revisión de trazabilidad de decisiones, identificación de patrones anómalos y cumplimiento regulatorio.

**Responsabilidad:** Visión macro de la operación, validación de métricas de cumplimiento del colectivo y definición de la estrategia de crecimiento controlado.

---

## Matriz de Participación por Proceso

| Proceso | Sistema | Asesor | Tesorería | Cobrador | Supervisor | Administrativo | Gerencia |
|---|---|---|---|---|---|---|---|
| Solicitud y Pre-Filtrado | ✅ | ✅ | | | | | |
| Evaluación Automática | ✅ | | | | | | |
| Verificación en Campo | ✅ | | | ✅ | | | |
| Decisión y Aprobación | ✅ | | | | ✅ | | |
| Formalización y Contratos | ✅ | ✅ | ✅ | | | | |
| Desembolso | ✅ | | ✅ | | | | |
| Custodia de Pagarés | ✅ | ✅ | | | | ✅ | |
| Cobranza Diaria | ✅ | | | ✅ | | | |
| Consolidación y Conciliación | ✅ | | ✅ | | | ✅ | |
| Gestión de Morosidad | ✅ | | | ✅ | ✅ | ✅ | |
| Monitoreo Gerencial | ✅ | | | | | | ✅ |