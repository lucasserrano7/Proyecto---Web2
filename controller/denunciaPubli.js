import express from "express";
import { Imagen } from "../models/Imagen.js";
import { publicacion } from "../models/publicacion.js";
const denunciaPubli = express.Router();

denunciaPubli.post("/denunciar/imagen/:id", async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res
        .status(401)
        .json({
          message: "Tenés que iniciar sesión para denunciar una imagen",
        });
    }
    const imagenId = Number(req.params.id);
    const usuarioId = req.session.usuario.id;
    const motivo = req.body.motivo?.trim();
    const descripcion = (req.body.descripcion ?? req.body.description)?.trim();

    if (!Number.isInteger(imagenId)) {
      return res.status(400).json({ message: "Imagen inválida" });
    }
    if (!motivo || !descripcion) {
      return res
        .status(400)
        .json({ message: "La denuncia tiene que tener motivo y descripción" });
    }
    if (descripcion.length > 255) {
      return res
        .status(400)
        .json({
          message: "La descripción no puede superar los 255 caracteres",
        });
    }

    const imagen = await Imagen.findByPk(imagenId, {
      include: [{ model: publicacion }],
    });
    if (
      !imagen ||
      !imagen.publicacion ||
      imagen.publicacion.eliminada ||
      !imagen.publicacion.estado
    ) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }
    if (imagen.publicacion.UsuarioId === usuarioId) {
      return res
        .status(403)
        .json({ message: "No podés denunciar tu propia imagen" });
    }

    const yaDenuncio = await DenunciaImagen.findOne({
      where: { ImagenId: imagenId, UsuarioId: usuarioId },
    });
    if (yaDenuncio) {
      return res.status(409).json({ message: "Ya denunciaste esta imagen" });
    }

    try {
      await DenunciaImagen.create({
        motivo,
        descripcion,
        ImagenId: imagenId,
        UsuarioId: usuarioId,
      });
    } catch (e) {
      if (e.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Ya denunciaste esta imagen" });
      }
      throw e;
    }

    const totalDenuncias = await DenunciaImagen.count({
      where: { ImagenId: imagenId, estado: "pendiente" },
    });

    return res.status(200).json({
      success: true,
      message: "Denuncia registrada",
      totalDenuncias,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al procesar la denuncia" });
  }
});

export default denunciaPubli;
