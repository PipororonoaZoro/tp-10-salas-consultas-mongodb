# TP 10 — Consultas de reservas (`tp-10-salas-consultas-mongodb`)

Trabajo práctico individual de la Unidad 10 sobre la API y aplicación web de reservas de salas con Node.js, Express y MongoDB (Mongoose), incorporando filtrado, ordenamiento, paginación y proyección pública en el listado API sin alterar los documentos ni romper el CRUD heredado, las vistas HTML o `/estado`.

## Instalación y ejecución

1. Copiar la base del TP 09 en una nueva carpeta `tp-10-salas-consultas-mongodb` (sin `.git`, `node_modules` ni archivo `.env` privado) y configurar `.env.example` con marcadores (sin publicar credenciales ni URI privada).
2. Crear el archivo `.env` local apuntando a la base `reservas_salas_u10` y colección `reservas` en MongoDB Atlas.
3. Instalar dependencias y verificar el proyecto:

```bash
npm ci
npm run check
node --env-file=.env scripts/comprobar-conexion.js
node --env-file=.env src/index.js
```

## Variables de entorno (`.env.example`)

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/reservas_salas_u10?retryWrites=true&w=majority
```

## Contrato de consulta (`GET /api/reservas`)

El endpoint `GET /api/reservas` admite los siguientes parámetros opcionales en `req.query`:

- `sala`: igualdad exacta tras aplicar `.trim()` (no busca por fragmentos ni altera los documentos).
- `orden`: opciones permitidas `estudiante` (predeterminada), `personas-asc` y `personas-desc`, siempre agregando `_id: 1` como desempate determinista.
- `pagina`: entero entre `1` y `1000` (predeterminada `1`).
- `limite`: entero entre `1` y `20` (predeterminada `2`).

La respuesta exitosa (`200 OK`) devuelve un objeto con el siguiente formato:

```json
{
  "datos": [
    {
      "id": "...",
      "estudiante": "...",
      "email": "...",
      "sala": "...",
      "fecha": "...",
      "turno": "...",
      "personas": 1,
      "estado": "pendiente"
    }
  ],
  "pagina": 1,
  "limite": 2,
  "total": 6,
  "paginas": 3
}
```

- Cada elemento de `datos` expone únicamente `id` y los siete campos públicos (`estudiante`, `email`, `sala`, `fecha`, `turno`, `personas`, `estado`), sin exponer `_id` ni `__v`.
- Si `pagina` supera la cantidad de páginas disponibles, responde `200 OK` con `datos: []`, manteniendo `total` y `paginas` reales.
- Parámetros desconocidos, repetidos, vacíos, fuera de rango o no enteros (por ejemplo `pagina=0`, `pagina=1.5`, `limite=21`, `orden=otro` o `select=email`) se rechazan con `400 Bad Request` sin escribir datos.
- Se conservan las operaciones CRUD (`POST`, `PUT`, `PATCH`, `DELETE`, `GET /api/reservas/:id`), las vistas HTML (`/reservas`, `/reservas/nueva`, `/reservas/:id`) y `/estado`.

## Pruebas en Postman y evidencia

Las pruebas se organizan en la colección **`TP 10 - Reservas`** contra `http://localhost:3000/api/reservas` (con `Body` en `none` para solicitudes `GET` y `Params` cargados por fila):

- `GET http://localhost:3000/api/reservas` (sin `Params` activos): `200 OK`, 2 reservas, `pagina: 1`, `limite: 2`, `total: 6`, `paginas: 3`.
- `GET http://localhost:3000/api/reservas?sala=Sala Norte&orden=personas-asc&pagina=1&limite=2`: `200 OK`, 2 reservas, `total: 4`, `paginas: 2`.
- `GET http://localhost:3000/api/reservas?sala=Sala Norte&orden=personas-asc&pagina=2&limite=2`: `200 OK`, siguientes 2 reservas, `total: 4`, `paginas: 2`.
- `GET http://localhost:3000/api/reservas?sala=Sala Norte&pagina=3&limite=2`: `200 OK`, `datos: []`, `total: 4`, `paginas: 2`.
- `GET http://localhost:3000/api/reservas?sala=Sala inexistente`: `200 OK`, `datos: []`, `total: 0`, `paginas: 0`.
- Rechazos `400 Bad Request`: `pagina=0`, `pagina=1.5`, `limite=21`, dos filas `pagina` activas, `sala` vacía o repetida, `orden=otro` y `select=email`.
- Continuidad verificada sobre `GET /api/reservas/:id`, `POST`, `PUT`, `PATCH`, `DELETE`, listado/formulario HTML y `GET /estado`.

## Diseño conceptual de relaciones (salas y reservas)

Si incorporáramos información de las salas, una sala quedaría descrita por sus propios atributos estables (como nombre/código, ubicación, capacidad máxima, equipamiento o disponibilidad general), mientras que una reserva describiría el uso puntual de un espacio (estudiante, email, sala reservada, fecha, turno, cantidad de personas y estado). Considerar una referencia (por ejemplo, el identificador de la sala) tiene sentido cuando los datos de la sala cambian o se consultan de forma independiente sin duplicarlos en cada reserva, mientras que embeber un pequeño resumen o snapshot puntual solo convendría si interesa conservar exactamente cómo estaba un dato al momento de reservar; en este práctico se mantiene únicamente la justificación conceptual sin agregar otro modelo ni `populate`.