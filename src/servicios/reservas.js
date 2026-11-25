const Reserva = require("../modelos/reserva");

function crearServicioReservas() {
  // Paso 1, 2, 3 y 4: Consultar reservas con filtro, orden + desempate por _id, paginación y proyección pública
  async function consultar(sala, orden = "estudiante", pagina = 1, limite = 2) {
    const filtro = {};

    if (typeof sala === "string") {
      const salaLimpia = sala.trim();
      if (salaLimpia.length > 0) {
        filtro.sala = salaLimpia;
      }
    }

    let criterioOrden;
    if (orden === "personas-asc") {
      criterioOrden = { personas: 1, _id: 1 };
    } else if (orden === "personas-desc") {
      criterioOrden = { personas: -1, _id: 1 };
    } else {
      criterioOrden = { estudiante: 1, _id: 1 };
    }

    const salto = (pagina - 1) * limite;
    const total = await Reserva.countDocuments(filtro);

    const documentos = await Reserva.find(filtro)
      .select("estudiante email sala fecha turno personas estado")
      .sort(criterioOrden)
      .skip(salto)
      .limit(limite)
      .lean();

    const datos = documentos.map((doc) => ({
      id: String(doc._id),
      estudiante: doc.estudiante,
      email: doc.email,
      sala: doc.sala,
      fecha: doc.fecha,
      turno: doc.turno,
      personas: doc.personas,
      estado: doc.estado,
    }));

    const paginas = Math.ceil(total / limite);

    return {
      datos,
      pagina,
      limite,
      total,
      paginas,
    };
  }

  // Obtener todas las reservas
  async function obtenerReservas(filtroSala = null) {
    const query = filtroSala ? { sala: filtroSala } : {};
    return await Reserva.find(query);
  }

  // Obtener una reserva por su ID de MongoDB
  async function obtenerReservaPorId(id) {
    return await Reserva.findById(id);
  }

  // Crear una nueva reserva
  async function crearReserva(datosCliente) {
    const nuevaReserva = new Reserva({
      estudiante: datosCliente.estudiante,
      email: datosCliente.email,
      sala: datosCliente.sala,
      fecha: datosCliente.fecha,
      turno: datosCliente.turno,
      personas: datosCliente.personas,
    });

    return await nuevaReserva.save();
  }

  // Actualización completa (PUT): exige los 7 campos editables (incluido estado)
  async function actualizarReservaCompleta(id, datos) {
    const reemplazo = {
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
      estado: datos.estado,
    };

    return await Reserva.findByIdAndUpdate(id, reemplazo, {
      new: true, // Devuelve el documento ya actualizado
      runValidators: true, // Aplica las validaciones del esquema de Mongoose
      upsert: false, // Evita crear un documento si el ID no existe
    });
  }

  // Actualización parcial (PATCH): permite modificar solo personas y/o estado
  async function actualizarReservaParcial(id, datos) {
    const actualizacion = {};
    if (datos.personas !== undefined) actualizacion.personas = datos.personas;
    if (datos.estado !== undefined) actualizacion.estado = datos.estado;

    return await Reserva.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      {
        new: true,
        runValidators: true,
        upsert: false,
      },
    );
  }

  // Eliminación física (DELETE): borra el documento por su ID
  async function eliminarReserva(id) {
    return await Reserva.findByIdAndDelete(id);
  }

  // Obtener la cantidad total de reservas (requerido para /estado)
  async function obtenerCantidad() {
    return await Reserva.countDocuments();
  }

  // Obtener las salas permitidas (alineadas con el enum del modelo Mongoose)
  async function obtenerSalasPermitidas() {
    return ["Sala Norte", "Sala Sur", "Sala Multimedia"];
  }

  // Obtener los turnos permitidos (requerido por el formulario web tradicional)
  async function obtenerTurnosPermitidos() {
    return ["Mañana", "Tarde", "Noche"];
  }

  return {
    consultar,
    obtenerReservas,
    obtenerReservaPorId,
    crearReserva,
    actualizarReservaCompleta,
    actualizarReservaParcial,
    eliminarReserva,
    obtenerCantidad,
    obtenerSalasPermitidas,
    obtenerTurnosPermitidos,
    // Alias para compatibilidad total con el controlador web tradicional:
    obtenerTodas: obtenerReservas,
  };
}

module.exports = { crearServicioReservas };
