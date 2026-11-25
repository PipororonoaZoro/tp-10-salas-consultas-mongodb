const { Router } = require("express");
const mongoose = require("mongoose");
const { crearControladorReservas } = require("../controladores/reservas");

function crearApiReservasRouter(servicioReservas) {
  const router = Router();
  const controladorReservas = crearControladorReservas(servicioReservas);

  // GET /api/reservas (delega en listarApi -> servicioReservas.consultar)
  router.get("/", controladorReservas.listarApi);

  // GET /api/reservas/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID mal formado." });
      }

      const reserva = await servicioReservas.obtenerReservaPorId(id);
      if (!reserva) {
        return res.status(404).json({ error: "Recurso no encontrado." });
      }

      return res.status(200).json(reserva);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/reservas
  router.post("/", async (req, res) => {
    try {
      const datos = req.body;

      if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return res
          .status(400)
          .json({ error: "Cuerpo de solicitud ausente o inválido." });
      }

      // Validar que el cliente no intente inyectar _id o estado al crear
      if (
        datos._id !== undefined ||
        datos.id !== undefined ||
        datos.estado !== undefined
      ) {
        return res
          .status(400)
          .json({ error: "No se permite asignar _id, id ni estado al crear." });
      }

      const nuevaReserva = await servicioReservas.crearReserva(datos);

      res.setHeader("Location", `/api/reservas/${nuevaReserva.id}`);
      return res.status(201).json(nuevaReserva);
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Creación inválida.", detalle: error.message });
    }
  });

  // PUT /api/reservas/:id (Reemplazo completo: exige los 7 campos editables)
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const datos = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID mal formado." });
      }

      if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return res
          .status(400)
          .json({ error: "Cuerpo de solicitud ausente o inválido." });
      }

      // Validar campos desconocidos o prohibidos en PUT
      const permitidos = [
        "estudiante",
        "email",
        "sala",
        "fecha",
        "turno",
        "personas",
        "estado",
      ];
      const claves = Object.keys(datos);

      // PUT exige exactamente los 7 campos (ninguno puede faltar)
      if (claves.length !== 7 || !permitidos.every((p) => claves.includes(p))) {
        return res
          .status(400)
          .json({ error: "PUT exige exactamente los siete campos editables." });
      }

      // Validar que personas no sea array u objeto
      if (
        Array.isArray(datos.personas) ||
        (typeof datos.personas === "object" && datos.personas !== null)
      ) {
        return res.status(400).json({
          error: "El campo personas no puede ser un arreglo u objeto.",
        });
      }

      const reservaActualizada =
        await servicioReservas.actualizarReservaCompleta(id, datos);

      if (!reservaActualizada) {
        return res
          .status(404)
          .json({ error: "Recurso no encontrado para actualizar." });
      }

      return res.status(200).json(reservaActualizada);
    } catch (error) {
      return res.status(400).json({
        error: "Actualización completa inválida.",
        detalle: error.message,
      });
    }
  });

  // PATCH /api/reservas/:id (Actualización parcial: solo personas y/o estado)
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const datos = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID mal formado." });
      }

      if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(datos) ||
        Object.keys(datos).length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Cuerpo de solicitud ausente, vacío o inválido." });
      }

      // Validar campos permitidos en PATCH (solo personas, estado o $set explícito si aplica)
      const permitidos = ["personas", "estado"];
      const claves = Object.keys(datos);

      if (!claves.every((c) => permitidos.includes(c))) {
        return res
          .status(400)
          .json({ error: "PATCH solo admite modificar personas o estado." });
      }

      if (datos.personas !== undefined) {
        if (
          Array.isArray(datos.personas) ||
          (typeof datos.personas === "object" && datos.personas !== null)
        ) {
          return res.status(400).json({
            error: "El campo personas no puede ser un arreglo u objeto.",
          });
        }
      }

      const reservaActualizada =
        await servicioReservas.actualizarReservaParcial(id, datos);

      if (!reservaActualizada) {
        return res
          .status(404)
          .json({ error: "Recurso no encontrado para modificar." });
      }

      return res.status(200).json(reservaActualizada);
    } catch (error) {
      return res.status(400).json({
        error: "Actualización parcial inválida.",
        detalle: error.message,
      });
    }
  });

  // DELETE /api/reservas/:id (Eliminación física)
  router.delete("/:id", async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID mal formado." });
      }

      const resultado = await servicioReservas.eliminarReserva(id);

      if (!resultado) {
        return res
          .status(404)
          .json({ error: "Recurso no encontrado para eliminar." });
      }

      // El PDF exige estrictamente 204 sin cuerpo si eliminó
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { crearApiReservasRouter };