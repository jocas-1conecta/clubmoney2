# Cobranza Diaria

## 1. Planificación Automática
**Actores:** Sistema (Automático), Supervisor. **Tiempo:** 7:00 AM 8:00 AM (Previo a salida).
* **Generación de Ruta:** El sistema consulta los prestamos activos y genera automáticamente el registro en rutas_cobranza para el día actual, filtrando por zona_id,.
* **Priorización Inteligente:** El sistema puebla la tabla ruta_clientes estableciendo un orden_visita lógico. Prioriza clientes con cuotas atrasadas (detectados en casos_morosidad) o promesas de pago vigentes, eliminando la coordinación manual por celular entre Asesor y Cobrador...
* **Visualización:** El Cobrador abre su app y ve su lista de carga ordenada con los saldos actualizados, sin necesidad de calcular montos manualmente en un cuaderno físico.

## 2. Ejecución y Validación en Campo
**Actores:** Cobrador. **Tiempo:** Durante la ruta.
* **Check-in Digital (Georreferenciado):** Al llegar donde el cliente, el cobrador marca su llegada en la app. El sistema crea un registro en visitas_presenciales capturando automáticamente lat, lon y hora exacta (fecha_ejecutada),.
* **Chat Interno y Colaborativo:** Se habilita un chat interno exclusivo dentro de la aplicación para que todos los miembros de la empresa (considerados socios con responsabilidad colectiva) se comuniquen. Permite el envío de mensajes, documentos e imágenes, centralizando la operación y eliminando el uso de apps externas.
* **Modo Offline (Sin Señal):** Si la zona no tiene cobertura, la App permite registrar el cobro y la foto localmente. La sincronización se realiza automáticamente apenas el dispositivo recupere conexión, manteniendo la hora y geolocalización originales de la transacción (evita pérdida de data en sótanos o zonas rurales).
* **Consulta de Historial:** El cobrador visualiza en la app el equivalente digital del cuaderno (cuadernos_cliente y registros_cuaderno), viendo las últimas notas y el saldo real sin depender del papel físico que tiene el cliente.
* **Alerta de Seguridad (Arqueo Intradía):** El sistema monitorea el efectivo acumulado en tiempo real. Si el saldo_mano del cobrador supera el límite seguro (ej. S/2,000), la App se bloquea preventivamente y obliga al cobrador a realizar un "Depósito Parcial" en un agente cercano antes de permitirle ver el siguiente cliente de la ruta..

## 3. Registro Unificado del Cobro
**Actores:** Cobrador, Cliente, Sistema. **Tiempo:** Tiempo real.
El sistema bifurca el flujo según el método de pago seleccionado en la tabla pagos,:

**A. Si el Pago es en Efectivo:**
1. **Captura Fotográfica de Billetes:** El cobrador debe tomar fotos de los billetes recibidos utilizando únicamente la cámara de la aplicación. El sistema detecta automáticamente los ID de los billetes (números de serie) y los registra en la base de datos para su trazabilidad.
2. **Validación:** El sistema genera un registro en pagos con estado "Recaudado en Campo".
3. **Recibo Digital:** Automáticamente se actualiza la tabla registros_cuaderno y se envía un SMS/WhatsApp automático al cliente confirmando el pago y el nuevo saldo, eliminando la necesidad de firmar y fotografiar el cuaderno físico,.

**B. Si el Pago es Digital (Yape/Plin/Transferencia):**
1. **Captura de Comprobante y OCR:** El motorizado toma foto del comprobante desde la app. El sistema capta automáticamente el ID de transferencia, el banco y los datos del emisor para el reporte inmediato.
2. **Almacenamiento:** Se guarda en la tabla vouchers y se vincula inmediatamente al pago_id..
3. **Estado:** El pago queda en estado "Pendiente de Conciliación" (se valida en el paso 5).

**C. Si No hay Pago:**
1. **Registro de Incidencia:** El cobrador marca el motivo en estado_visita (ej. "Ausente", "Sin dinero") dentro de ruta_clientes,..
2. **Alerta Temprana:** Si se superan los días de tolerancia, el sistema abre automáticamente un registro en casos_morosidad, alertando al Asesor Administrativo para iniciar gestión telefónica inmediata, sin esperar al reporte nocturno.

**D. Gestión de Reversos/Extornos:**
1. Si el banco notifica un extorno (devolución de un Yape/Transferencia) después de haber conciliado, el sistema permite revertir el estado del pago a "Anulado", reactiva la deuda en la cuenta del cliente y genera una alerta de "Posible Fraude" en el perfil del usuario para futuras evaluaciones.

## 4. Cierre de Ruta y Depósito
**Actores:** Cobrador. **Tiempo:** Final de la ruta.
* **Cuadre de Caja Móvil:** La app muestra al cobrador el total exacto recaudado en efectivo (suma de pagos donde medio_pago = 'EFECTIVO').
* **Depósito Bancario:** El cobrador deposita el efectivo en un agente bancario.
* **Contingencia (Falla de Agente/Horario):** Si el cobrador no puede depositar por factores externos (Agente cerrado/Sin sistema), solicita una autorización de "Cierre con Efectivo en Custodia" en la App. El Supervisor aprueba digitalmente y ese saldo se traslada automáticamente como "Saldo Inicial de Caja" para la ruta del día siguiente, obligando a un depósito prioritario a primera hora (8:00 AM).
* **Cierre Operativo:** Sube la foto del voucher de depósito global, cerrando su responsabilidad sobre el efectivo del día.

## 5. Conciliación Automática
**Actores:** Sistema (Motor de Conciliación), Administrativo (solo para excepciones). **Tiempo:** Continuo (o batch nocturno).
* **Cruce de Datos:** El sistema descarga los movimientos_bancarios y los compara contra los registros de pagos y vouchers,..
* **Validación Lógica:** Si coinciden fecha, monto y referencia, el sistema marca el campo coincide = TRUE en conciliacion_detalle y cambia el estado del pago a "Conciliado".
* **Gestión de Excepciones:** Solo si hay discrepancias (ej. monto no coincide), se genera una alerta en inconsistencias_pago para que el personal administrativo revise manualmente ese caso puntual.
* **Validación de Transferencias:** El supervisor o traductor sube el consolidado de movimientos bancarios para que el sistema realice la validación cruzada automática con los IDs de transferencia captados en campo.
* **Cierre de Caja y Cuadre de Billetes:** Al recibir el dinero físico, Tesorería identifica los IDs de los billetes (mediante contador de billetes o manual) y toma una fotografía. El sistema realiza el cierre de caja comparando los IDs registrados por el motorizado contra los recibidos físicamente, garantizando un cuadre perfecto.

## Requerimientos Técnicos del Modo Offline (App Móvil)
Para garantizar que los Cobradores/Verificadores no se detengan en zonas sin cobertura de red (sótanos, zonas rurales), la App Móvil debe contar con una arquitectura "Offline-First":

- **Base de Datos Local:** La aplicación utilizará una base de datos local en el dispositivo (ej. SQLite, WatermelonDB o MMKV) para almacenar una copia de la `ruta_clientes` descargada al inicio del día.
- **Cola de Sincronización (Sync Queue):** Cuando el cobrador registre un pago o un check-in (GPS) sin internet, los datos y fotos se guardarán localmente con estado `sync_pending = true`.
- **Sincronización en Segundo Plano:** El sistema móvil escuchará los cambios de estado de red. Al detectar conexión a internet, un background worker procesará la cola, enviando los datos a Supabase respetando el `timestamp` original de la transacción local, no la hora en que subió al servidor.