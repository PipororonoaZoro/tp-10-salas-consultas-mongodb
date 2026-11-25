function crearControladorReservas(servicioReservas) {
  return {
    listarApi: async (req, res, next) => {
      try {
        const clavesPermitidas = ["sala", "orden", "pagina", "limite"];
        const clavesRecibidas = Object.keys(req.query || {});

        const hayClaveDesconocida = clavesRecibidas.some(
          (clave) => !clavesPermitidas.includes(clave),
        );
        if (hayClaveDesconocida) {
          return res.status(400).json({
            error:
              "Parámetro de consulta no permitido. Solo se admiten 'sala', 'orden', 'pagina' y 'limite'.",
          });
        }

        if (Object.prototype.hasOwnProperty.call(req.query, "sala")) {
          const valorSala = req.query.sala;

          if (Array.isArray(valorSala) || typeof valorSala !== "string") {
            return res.status(400).json({
              error: "El parámetro 'sala' no puede repetirse.",
            });
          }

          if (valorSala.trim().length === 0) {
            return res.status(400).json({
              error: "El parámetro 'sala' no puede estar vacío.",
            });
          }
        }

        let orden = "estudiante";
        if (Object.prototype.hasOwnProperty.call(req.query, "orden")) {
          const valorOrden = req.query.orden;

          if (Array.isArray(valorOrden) || typeof valorOrden !== "string") {
            return res.status(400).json({
              error: "El parámetro 'orden' no puede repetirse.",
            });
          }

          const ordenLimpio = valorOrden.trim();
          const ordenesValidas = [
            "estudiante",
            "personas-asc",
            "personas-desc",
          ];

          if (!ordenesValidas.includes(ordenLimpio)) {
            return res.status(400).json({
              error:
                "Valor de 'orden' no válido. Use 'estudiante', 'personas-asc' o 'personas-desc'.",
            });
          }

          orden = ordenLimpio;
        }

        let pagina = 1;
        if (Object.prototype.hasOwnProperty.call(req.query, "pagina")) {
          const valorPagina = req.query.pagina;

          if (Array.isArray(valorPagina) || typeof valorPagina !== "string") {
            return res.status(400).json({
              error: "El parámetro 'pagina' no puede repetirse.",
            });
          }

          const textoPagina = valorPagina.trim();
          if (textoPagina.length === 0) {
            return res.status(400).json({
              error: "El parámetro 'pagina' no puede estar vacío.",
            });
          }

          const numeroPagina = Number(textoPagina);
          if (
            !Number.isInteger(numeroPagina) ||
            numeroPagina < 1 ||
            numeroPagina > 1000
          ) {
            return res.status(400).json({
              error:
                "El parámetro 'pagina' debe ser un número entero entre 1 y 1000.",
            });
          }

          pagina = numeroPagina;
        }

        let limite = 2;
        if (Object.prototype.hasOwnProperty.call(req.query, "limite")) {
          const valorLimite = req.query.limite;

          if (Array.isArray(valorLimite) || typeof valorLimite !== "string") {
            return res.status(400).json({
              error: "El parámetro 'limite' no puede repetirse.",
            });
          }

          const textoLimite = valorLimite.trim();
          if (textoLimite.length === 0) {
            return res.status(400).json({
              error: "El parámetro 'limite' no puede estar vacío.",
            });
          }

          const numeroLimite = Number(textoLimite);
          if (
            !Number.isInteger(numeroLimite) ||
            numeroLimite < 1 ||
            numeroLimite > 20
          ) {
            return res.status(400).json({
              error:
                "El parámetro 'limite' debe ser un número entero entre 1 y 20.",
            });
          }

          limite = numeroLimite;
        }

        const resultado = await servicioReservas.consultar(
          req.query.sala,
          orden,
          pagina,
          limite,
        );
        return res.status(200).json(resultado);
      } catch (error) {
        next(error);
      }
    },

    listar: async (req, res, next) => {
      try {
        const reservas = await servicioReservas.obtenerReservas();
        res.render("reservas/lista", {
          titulo: "Listado de reservas",
          reservas,
        });
      } catch (error) {
        next(error);
      }
    },

    mostrarFormulario: async (req, res, next) => {
      try {
        const salasPermitidas = await servicioReservas.obtenerSalasPermitidas();
        res.render("reservas/nueva", {
          titulo: "Nueva reserva",
          error: null,
          valores: {},
          salasPermitidas,
          turnosPermitidos: ["Mañana", "Tarde", "Noche"],
        });
      } catch (error) {
        next(error);
      }
    },

    mostrarDetalle: async (req, res, next) => {
      try {
        const reserva = await servicioReservas.obtenerReservaPorId(
          req.params.id,
        );

        if (!reserva) {
          return res.status(404).render("no-encontrado", {
            titulo: "Reserva No Encontrada",
            mensaje: `No existe ninguna reserva con el identificador #${req.params.id}.`,
          });
        }

        res.render("reservas/detalle", {
          titulo: `Detalle de Reserva #${reserva._id}`,
          reserva,
        });
      } catch (error) {
        next(error);
      }
    },

    crear: async (req, res, next) => {
      try {
        await servicioReservas.crearReserva(req.reservaValida);
        res.redirect("/reservas");
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { crearControladorReservas };
