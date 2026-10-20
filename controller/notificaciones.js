import e from "express";
import { notificacion } from "../models/notificacion.js";
import { authMiddleware } from "../middlewares/auth.js";


const notisRT = e.Router();

notisRT.get("/", authMiddleware, async (req, res) => {
  try {
    const notificaciones = await notificacion.findAll({
      where: { UsuarioId: req.session.usuario.id },
      order: [["fecha", "DESC"]],
    });

    res.render("notis", {
      notificaciones,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error("Error al obtener las notificaciones:", error);
    res.status(500).send("Error al obtener las notificaciones");
  }
});

notisRT.post("/:id/leer", authMiddleware, async (req, res) => {
  try {
    const [cantidadActualizada] = await notificacion.update(
      { leida: true },
      {
        where: {
          id: req.params.id,
          UsuarioId: req.session.usuario.id,
        },
      }
    );

    if (cantidadActualizada === 0) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Notificación marcada como leída",
    });
  } catch (error) {
    console.error("Error al marcar la notificación:", error);
    res.status(500).json({
      success: false,
      message: "Error al marcar la notificación como leída",
    });
  }
});

export default notisRT;