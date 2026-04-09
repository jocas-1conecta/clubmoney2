# Gestión de Morosidad

## 1. Detección Automática y Segmentación
**Actores:** Sistema (Automático). **Tiempo:** 6:00 AM (Proceso Batch Diario).
* **Disparador Automático:** En lugar de generar un reporte manual de clientes con más de 5 días de retraso, el sistema escanea diariamente la tabla prestamos y sus pagos.
* **Creación del Caso:** Si un cliente incumple su fecha de pago, el sistema crea (o actualiza) automáticamente un registro en la tabla casos_morosidad. Calcula automáticamente los dias_sin_pago y asigna un estado inicial (ej. "Mora Temprana"). Esto elimina la "ceguera operativa" de los primeros días de atraso, que hoy dependen de que el cobrador avise que "no pagó"..

## 2. Gestión Remota
**Actores:** Asesor Administrativo / Cobranza Telefónica. **Tiempo:** 8:30 AM - 12:00 PM.
* **Bandeja de Trabajo:** El asesor no revisa chats de WhatsApp al azar. Accede a un módulo que lista los casos_morosidad priorizados por gravedad.
* **Registro de Acciones:** Cada llamada o mensaje de WhatsApp se registra en la tabla acciones_morosidad (tipo: 'Llamada', 'WhatsApp', 'Notificación').
* **Mejora:** Si el cliente promete pagar, se registra la "Promesa de Pago" con fecha en el sistema. Si la fecha llega y no hay pago en la tabla pagos, el sistema lanza una alerta inmediata..
* **Centralización de Comunicaciones:** Los mensajes se gestionan desde la interfaz del sistema (tabla chats y mensajes_chat), permitiendo que cualquier usuario autorizado vea el historial de negociación, evitando la dependencia del celular personal del asesor.
* **Sistema de 7 Alertas Omnicanal:** Se activan 7 tipos de alertas enviadas por tres medios (Correo Electrónico, WhatsApp y SMS). Estas notificaciones informan al deudor sobre su progreso de pago (cuánto lleva cancelado y cuánto tiene pendiente) para incentivar el cumplimiento voluntario.
* **Responsabilidad Colectiva:** Los procesos tratan a cada miembro del equipo como socios, elevando el compromiso en la recuperación de cartera.

## 3. Escalada a Campo
**Actores:** Supervisor/Cobrador. **Tiempo:** Planificación de ruta del día siguiente.
Si la gestión remota falla o el cliente "bloquea contacto", el sistema interviene en la ruta física:
* **Inserción en Ruta:** El sistema inserta automáticamente al cliente moroso en la tabla rutas_cobranza y ruta_clientes del cobrador de la zona correspondiente.
* **Prioridad Alta:** Se marca con una prioridad especial en orden_visita para asegurar que sea visitado.
* **Instrucción Específica:** El cobrador ve en su app no solo "Cobrar cuota", sino una instrucción de "Recuperación / Notificación de Embargo" basada en el historial de acciones_morosidad previo.

## 4. Resolución y Reestructuración
**Actores:** Supervisor (Decisión), Sistema (Cálculo). **Tiempo:** Al momento del acuerdo.
Cuando se logra contactar al cliente, el sistema estructura la solución en lugar de dejarla en un acuerdo verbal o de papel:
* **Opción A: Pago Total/Parcial:** Se registra el pago normalmente y el sistema cierra automáticamente el caso_morosidad cambiando su estado a "Recuperado".
* **Opción B: Refinanciamiento (Novación):** Si el cliente refinancia, el supervisor ingresa las condiciones.
* **Trazabilidad Contable:** El sistema no sobrescribe el préstamo original. En su lugar:
  * i. Marca el préstamo antiguo como "Cancelado por Refinanciación" (congelando su estado de mora para estadísticas reales).
  * ii. Genera un Nuevo Préstamo vinculado, con el nuevo monto y cronograma.
  * Esto permite medir correctamente el riesgo real (Vintage) y evita "maquillar" la cartera morosa.