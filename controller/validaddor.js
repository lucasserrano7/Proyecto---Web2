import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/verificarRol.js";
import { Usuario } from "../models/usuario.js";
import { publicacion } from "../models/publicacion.js";
import { Imagen } from "../models/Imagen.js";
import { denunciaPublicacion } from "../models/denunciaPublicacion.js";

const validadorRT = express.Router();

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
      res.status(500).json("Error", {
        mensaje: "erroe ene le servidor",
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
      post.estado = false;
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

export default validadorRT;
