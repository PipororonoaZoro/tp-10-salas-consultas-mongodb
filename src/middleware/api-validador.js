// Middleware de validación estricta para PUT
function validarPutApi(req, res, next) {
  const body = req.body;

  // Validar que el cuerpo exista y sea un objeto plano
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res
      .status(400)
      .json({ error: "Cuerpo de solicitud ausente o inválido." });
  }

  const camposPermitidos = [
    "estudiante",
    "email",
    "sala",
    "fecha",
    "turno",
    "personas",
    "estado",
  ];
  const llaves = Object.keys(body);

  // Rechazar _id, operadores de MongoDB ($) o campos desconocidos
  for (const llave of llaves) {
    if (
      llave === "_id" ||
      llave.startsWith("$") ||
      !camposPermitidos.includes(llave)
    ) {
      return res
        .status(400)
        .json({ error: `Campo no permitido o inválido en PUT: ${llave}` });
    }
  }

  // Exigir los 7 campos obligatoriamente
  for (const campo of camposPermitidos) {
    if (
      body[campo] === undefined ||
      body[campo] === null ||
      body[campo] === ""
    ) {
      return res
        .status(400)
        .json({ error: `El campo ${campo} es obligatorio para PUT.` });
    }
  }

  const { estudiante, email, sala, fecha, turno, personas, estado } = body;

  // Validaciones de tipos y formatos
  if (typeof estudiante !== "string" || !estudiante.trim()) {
    return res
      .status(400)
      .json({ error: "El campo estudiante debe ser un texto válido." });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return res
      .status(400)
      .json({ error: "El correo electrónico debe incluir un '@' válido." });
  }
  if (!["Sala Norte", "Sala Sur", "Sala Multimedia"].includes(sala)) {
    return res
      .status(400)
      .json({ error: "La sala seleccionada no es válida." });
  }
  if (typeof fecha !== "string" || !fecha.trim()) {
    return res.status(400).json({ error: "La fecha es obligatoria." });
  }
  if (!["Mañana", "Tarde", "Noche"].includes(turno)) {
    return res
      .status(400)
      .json({ error: "El turno seleccionado no es válido." });
  }
  if (!["pendiente", "confirmada"].includes(estado)) {
    return res
      .status(400)
      .json({ error: "El estado debe ser 'pendiente' o 'confirmada'." });
  }

  // Guarda estricta para personas (evitar booleanos, arrays u objetos)
  if (
    typeof personas === "boolean" ||
    Array.isArray(personas) ||
    typeof personas === "object"
  ) {
    return res.status(400).json({
      error: "El campo personas tiene un formato de tipo incorrecto.",
    });
  }

  const numPersonas = Number(personas);
  if (
    isNaN(numPersonas) ||
    !Number.isInteger(numPersonas) ||
    numPersonas < 1 ||
    numPersonas > 6
  ) {
    return res.status(400).json({
      error: "La cantidad de personas debe ser un número entero entre 1 y 6.",
    });
  }

  // Inyectar datos limpios y validados para el controlador/servicio
  req.datosValidados = {
    estudiante: estudiante.trim(),
    email: email.trim(),
    sala,
    fecha: fecha.trim(),
    turno,
    personas: numPersonas,
    estado,
  };

  next();
}

// Middleware de validación estricta para PATCH (Modificación parcial)
function validarPatchApi(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res
      .status(400)
      .json({ error: "Cuerpo de solicitud ausente o inválido." });
  }

  const camposPermitidos = ["personas", "estado"];
  const llaves = Object.keys(body);

  // Al menos un campo debe estar presente
  if (llaves.length === 0) {
    return res.status(400).json({
      error: "Se requiere al menos un campo (personas o estado) para PATCH.",
    });
  }

  // Validar que no envíen campos extra, _id u operadores
  for (const llave of llaves) {
    if (
      llave === "_id" ||
      llave.startsWith("$") ||
      !camposPermitidos.includes(llave)
    ) {
      return res
        .status(400)
        .json({ error: `Campo no permitido en PATCH: ${llave}` });
    }
  }

  const datosValidados = {};

  // Validar personas si viene en el body
  if (body.personas !== undefined) {
    const { personas } = body;
    if (
      typeof personas === "boolean" ||
      Array.isArray(personas) ||
      typeof personas === "object"
    ) {
      return res.status(400).json({
        error: "El campo personas tiene un formato de tipo incorrecto.",
      });
    }
    const numPersonas = Number(personas);
    if (
      isNaN(numPersonas) ||
      !Number.isInteger(numPersonas) ||
      numPersonas < 1 ||
      numPersonas > 6
    ) {
      return res.status(400).json({
        error: "La cantidad de personas debe ser un número entero entre 1 y 6.",
      });
    }
    datosValidados.personas = numPersonas;
  }

  // Validar estado si viene en el body
  if (body.estado !== undefined) {
    const { estado } = body;
    if (!["pendiente", "confirmada"].includes(estado)) {
      return res
        .status(400)
        .json({ error: "El estado debe ser 'pendiente' o 'confirmada'." });
    }
    datosValidados.estado = estado;
  }

  req.datosValidados = datosValidados;
  next();
}

module.exports = {
  validarPutApi,
  validarPatchApi,
};
