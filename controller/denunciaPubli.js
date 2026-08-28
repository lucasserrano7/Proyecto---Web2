import express from "express";
import { denunciaPublicacion } from "../models/denunciaPublicacion.js";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";

const denunciaPubli = express.Router();

denunciaPubli.post("/denunciar/publicacion/:id", async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res.status(401).json({
        message: "Tenes que iniciar sesión para poder valorar una imagen",
      });
    }
    const publicacionId = req.params.id;
    const usuarioId = req.session.usuario.id;
    const { motivo, justificacion } = req.body;

    if (!motivo || !justificacion) {
      return res.status(400).json({
        message: "La denuncia tiene que tener motivo y justificacion",
      });
    }

    const post = await publicacion.findByPk(publicacionId);
    if (!post) {
      return res.status(404).json({
        message: "Publicacion no encontrada",
      });
    }

    if (post.UsuarioId === usuarioId) {
      return res.status(403).json({
        message: "No podes denunciar tu publicacion",
      });
    }
    const yaDenuncio = await denunciaPublicacion.findOne({
      where: {
        publicacionId: publicacionId,
        UsuarioId: usuarioId,
      },
    });

    if (yaDenuncio) {
      return res.status(400).json({
        message: "Ya denunciaste esta publicacion",
      });
    }

    await denunciaPublicacion.create({
      motivo: motivo,
      justificacion: justificacion,
      publicacionId: publicacionId,
      UsuarioId: usuarioId,
    });

    const totalDenuncias = await denunciaPublicacion.count({
      where: {
        publicacionId: publicacionId,
      },
    });

    const nuevoEstado = post.estado;
    if (totalDenuncias > 3) {
      nuevoEstado = "enRevision";
    }

    await post.update({
      cantidad_denunncias: totalDenuncias,
      estado: nuevoEstado,
    });

    return res.status(200).json({
      success: true,
      message: "Denuncia registrada",
      totalDenuncias: totalDenuncias,
      estado: estado,
    });
  } catch (error) {
    console.error("Error al registrar la denuncia", error);
    return res.status(500).json({ message: "Error interno al denunciar" });
  }
});

export default denunciaPubli;
