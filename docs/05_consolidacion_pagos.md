# Consolidación y Verificación de Pagos

## 1. Ingesta y Preparación de Datos
**Actores:** Sistema (Automático) o Asesor Administrativo (Supervisión). **Tiempo:** 8:00 AM - 8:30 AM (Siguiente día hábil o cierre de turno).
* **Importación de Movimientos:** En lugar de imprimir los movimientos de las cuentas de "Josselin y Doris", el sistema importa las transacciones directamente a la tabla movimientos_bancarios, registrando fecha, monto, referencia y cuenta de origen. Cambio clave: Se elimina la impresión de papel y el resaltador físico.
* **Centralización de Vouchers:** El sistema ya cuenta con los vouchers y los pagos registrados durante el día anterior por los cobradores y clientes en la app. No es necesario buscar fotos en chats de WhatsApp dispersos.

## 2. Motor de Conciliación Automática
**Actores:** Sistema (Proceso Batch/Automático). **Tiempo:** Inmediato tras la ingesta de datos.
El sistema ejecuta un algoritmo de cruce entre lo declarado (App) y lo real (Banco):
* **Lógica de Emparejamiento:** El sistema busca coincidencias entre la tabla pagos (filtrando por métodos digitales) y la tabla movimientos_bancarios. Criterios: Coincidencia de monto, fecha (con margen de tolerancia) y referencia (número de operación).
* **Resultado Exitoso:** Si los datos calzan, el sistema crea un registro en conciliacion_detalle marcando el campo coincide = TRUE y cambia el estado del pago a "Conciliado" automáticamente.
* **Resultado Fallido:** Si hay un pago registrado en la app sin su contraparte en el banco (o viceversa), el sistema genera una alerta en la tabla inconsistencias_pago.

## 3. Gestión de Inconsistencias
**Actores:** Asesor Administrativo / Tesorería. **Tiempo:** 8:30 AM - 9:30 AM (Solo gestión de problemas).
En lugar de revisar todo, el personal solo abre el módulo de "Inconsistencias":
* **Revisión de Alertas:** El asesor ve una lista filtrada de inconsistencias_pago (ej. "Monto difiere", "Voucher ilegible", "Depósito no figura").
* **Resolución:**
  1. Visualiza el voucher digital cargado en el sistema lado a lado con el posible movimiento bancario sugerido.
  2. Si es un error de digitación, corrige y valida manualmente.
  3. Si el pago no existe, inicia una gestion_inconsistencia, contactando al cliente vía WhatsApp/Llamada directamente desde el registro del error.
* **Acción Correctiva:** El sistema permite registrar la resolución (ej. "Cliente envió voucher falso", "Error de banco") en el campo resolucion.

## 4. Cierre Contable y Actualización de Saldos
**Actores:** Sistema. **Tiempo:** Tiempo real tras validación.
* **Impacto en Cartera:** Una vez que el pago pasa a estado "Conciliado", el saldo del prestamo se actualiza oficialmente como "Amortizado".
* **Bloqueo de Seguridad:** Se cierra la conciliacion_id del día anterior con estado "Finalizada", impidiendo modificaciones posteriores a los registros de caja de esa fecha.