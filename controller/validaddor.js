import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/verificarRol.js";
import { Usuario } from "../models/usuario.js";
import { publicacion } from "../models/publicacion.js";
import { Comentarios} from "../models/comentarios.js"
import {denunciaComentario} from "../models/denunciaComentario.js"
import { Imagen } from "../models/Imagen.js";
import { denunciaPublicacion } from "../models/denunciaPublicacion.js";

const validadorRT = express.Router();

validadorRT.get("/", (req, res) => {
  res.redirect("/validador/validar");
});

validadorRT.get(
  "/validar",
  authMiddleware,
  verificarRol("validador"),
  async (req, res) => {
    try {
      const publicacionesRevision = await publicacion.findAll({
        include: [
          {
            model: Usuario,
            attributes: [
              "id",
              "username",
              "email",
              "Nro_publicaciones_bajadas",
              "estado",
            ],
          },
          {
            model: Imagen,
          },
          {
            model: denunciaPublicacion,
            include: [
              {
                model: Usuario,
                as: "Denunciante",
                attributes: ["id", "username"],
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });

      if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.status(200).json({
          success: true,
          total: publicacionesRevision.length,
          publicaciones: publicacionesRevision,
        });
      }

      res.render("validador/validar", {
        titulo: "Panel de control",
        publicacion: publicacionesRevision,
        usuario: req.session.usuario,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: "error ene le servidor",
        detalle: err.message,
      });
    }
  },
);

validadorRT.post(
  "/rechazar/:id",
  authMiddleware,
  verificarRol("validador"),
  async (req, res) => {
    try {
      const publicacionId = req.params.id;

      const post = await publicacion.findByPk(publicacionId);
      if (!post) {
        return res.status(404).json({ message: "Publicacion no encontrada." });
      }
      await denunciaPublicacion.destroy({
        where: { publicacion_id: publicacionId },
      });
      post.estado = true;
      post.cantidad_denuncias = 0;
      await post.save();

      if (req.xhr || req.headers.accept?.includes("json")) {
        return res
          .status(200)
          .json({ success: true, message: "Denuncias rechazada." });
      }
      res.redirect("/validador/validar");
    } catch (err) {
      console.error("Error al rechazar denuncias:", err);
      res.status(500).json({ message: "Error al rechazar la denuncia." });
    }
  },
);

validadorRT.post(
  "/baja/:id",
  authMiddleware,
  verificarRol("validador"),
  async (req, res) => {
    try {
      const publicacionId = req.params.id;

      const post = await publicacion.findByPk(publicacionId, {
        include: [{ model: Usuario }],
      });

      if (!post) {
        return res.status(404).json({ message: "Publicacion no encontrada." });
      }

      post.estado = false;
      await post.save();

      const autor = await Usuario.findByPk(post.UsuarioId);
      let cuentaSuspendida = false;

      if (autor) {
        const publisBajadas = (autor.Nro_publicaciones_bajadas || 0) + 1;
        autor.Nro_publicaciones_bajadas = publisBajadas;

        if (publisBajadas >= 3) {
          autor.estado = false;
          cuentaSuspendida = true;
        }
        await autor.save();
      }

      if (req.xhr || req.headers.accept?.includes("json")) {
        return res.status(200).json({
          success: true,
          message: "Publicacion dada de baja.",
          strickesAutor: autor ? autor.Nro_publicaciones_bajadas : 0,
          cuentaSuspendida: cuentaSuspendida,
        });
      }
      res.redirect("/validador/validar");
    } catch (err) {
      console.error("Error al dar de baja:", err);
      res.status(500).json({ message: "Error al dar de baja." });
    }
  },
);

validadorRT.get(
  "/comentarios",
  authMiddleware,
  verificarRol("validador"),
  async (req, res) => {
    try {
      const comentariosDenunciados = await Comentarios.findAll({
        include: [
          {
            model: Usuario,
            attributes: ["id", "username", "email"],
          },
          {
            model: denunciaComentario,
            required: true,
            include: [
              {
                model: Usuario,
                as: "Denunciante",
                attributes: ["id", "username"],
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });

      if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.status(200).json({
          success: true,
          total: comentariosDenunciados.length,
          comentarios: comentariosDenunciados,
        });
      }

      res.render("validador/comentarios", {
        titulo: "Moderación de Comentarios",
        comentarios: comentariosDenunciados,
        usuario: req.session.usuario,
      });
    } catch (err) {
      console.error("Error al listar comentarios denunciados:", err);
      res.status(500).json({
        mensaje: "Error en el servidor al obtener comentarios",
        detalle: err.message,
      });
    }
  },
);
validadorRT.post(
  "/comentarios/rechazar/:id",
  authMiddleware,
  verificarRol("validador"),
  async (req, res) => {
    try {
      const comentarioId = req.params.id;

      const denunciasBorradas = await denunciaComentario.destroy({
        where: { comentarioId: comentarioId },
      });

      if (req.xhr || req.headers.accept?.includes("json")) {
        return res.status(200).json({
          success: true,
          message: "Denuncias de comentario desestimadas.",
          totalEliminadas: denunciasBorradas,
        });
      }

      res.redirect("/validador/comentarios");
    } catch (err) {
      console.error("Error al rechazar denuncias de comentario:", err);
      res.status(500).json({ message: "Error al desestimar las denuncias." });
    }
  },
);

validadorRT.post(
  "/comentarios/baja/:id",
  authMiddleware,
  verificarRol("validador"),
  async (req, res) => {
    try {
      const comentarioId = req.params.id;

      const comentario = await Comentarios.findByPk(comentarioId);
      if (!comentario) {
        return res.status(404).json({ message: "Comentario no encontrado." });
      }
await comentario.destroy();
await denunciaComentario.destroy({
        where: { comentarioId: comentarioId },
      });

      if (req.xhr || req.headers.accept?.includes("json")) {
        return res.status(200).json({
          success: true,
          message: "Comentario dado de baja correctamente.",
        });
      }

      res.redirect("/validador/comentarios");
    } catch (err) {
      console.error("Error al dar de baja comentario:", err);
      res.status(500).json({ message: "Error al dar de baja el comentario." });
    }
  },
);

export default validadorRT;
