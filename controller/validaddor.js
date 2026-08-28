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
            attributes: ["id", "username", "email", "strikes", "estado"],
          },
          {
            model: Imagen,
          },
          {
            model: denunciaPublicacion,
            as: "PubliDenunciada",
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
      res.status(500).render("Error", { mensaje: "erroe ene le servidor" });
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
      post.estado = "activa";
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

      post.estado = "bajada";
      await post.save();

      const autor = await publicacion.findByPk(post.UsuarioId);
      let cuentaSuspendida = false;

      if (autor) {
        const newStrickes = (autor.strickes || 0) + 1;
        autor.strickes = newStrickes;

        if (newStrickes >= 3) {
          autor.estado = "inactivo";
          cuentaSuspendida = true;
        }
        await autor.save();
      }


      if (req.xhr || req.headers.accept?.includes("json")) {
        return res
          .status(200)
          .json({
            success: true,
            message: "Publicacion dada de baja.",
            strickesAutor: autor ? autor.strickes : 0,
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
