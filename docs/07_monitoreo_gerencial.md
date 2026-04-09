# Monitoreo Estratégico y Gerencial

## 1. Aplicación de Gerencia:
* **Actores:** Gerencia General/Dueños.
* **Funcionalidades:** Acceso exclusivo a un Dashboard Global con métricas de rendimiento en tiempo real, reportes consolidados y un sistema de alertas críticas sobre anomalías operativas o financieras. Permite una vista macro de la operación de todos los "socios" y el estado de la recaudación por zonas.

## Módulo de Auditoría y Logs del Sistema (Audit Trail)

Para garantizar la transparencia exigida por la Gerencia y mitigar riesgos de fraude interno, el sistema debe contar con un rastro de auditoría inmutable.

- **Tabla Universal de Logs (`audit_logs`):** Debe existir una tabla en la base de datos (o un servicio dedicado) que registre automáticamente las acciones críticas.
- **Estructura del Log:** Cada registro debe capturar obligatoriamente:
  - `usuario_id` (Quién hizo la acción).
  - `fecha_hora` (Cuándo, con precisión de milisegundos).
  - `accion_realizada` (Ej. "APROBACION_CREDITO", "EDICION_PAGO", "DESEMBOLSO_BANCARIO").
  - `tabla_afectada` y `registro_id` (Dónde se hizo el cambio).
  - `valor_anterior` (Payload JSON de cómo estaba antes).
  - `valor_nuevo` (Payload JSON de cómo quedó después).
  - `ip_address` o `geolocalizacion` (Desde dónde se hizo).
- **Inmutabilidad:** Los registros de esta tabla son de solo escritura (Append-Only). Ningún usuario, ni siquiera el administrador de base de datos, debería poder hacer un `UPDATE` o `DELETE` sobre la tabla de logs.
- **Visualización:** El Dashboard de Gerencia tendrá una pantalla de "Auditoría" para filtrar estos logs por empleado o por cliente ante cualquier sospecha o descuadre de caja.