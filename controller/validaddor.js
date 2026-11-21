import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/verificarRol.js";
import { Usuario } from "../models/usuario.js";
import { publicacion } from "../models/publicacion.js";
import { Comentarios } from "../models/comentarios.js";
import { denunciaComentario } from "../models/denunciaComentario.js";
import { Imagen } from "../models/Imagen.js";
import { denunciaPublicacion } from "../models/denunciaPublicacion.js";

const validadorRT = express.Router();

function pideJson(req) {
  return req.xhr || req.headers.accept?.includes("json");
}

function imagenABase64(url) {
  const buffer = Buffer.isBuffer(url) ? url : Buffer.from(url?.data || url || []);
  return "data:image/jpeg;base64," + buffer.toString("base64");
}

validadorRT.get("/", (req, res) => {
  res.redirect("/validador/validar");
});

validadorRT.get("/validar", authMiddleware, verificarRol("validador"), async (req, res) => {
  try {
    const imagenes = await Imagen.findAll({
      include: [
        {
          model: publicacion,
          required: true,
          where: { estado: true, eliminada: false },
          include: [{ model: Usuario, attributes: ["id", "username", "email", "Nro_publicaciones_bajadas", "estado"] }],
        },
        {
          model: DenunciaImagen,
          required: true,
          where: { estado: "pendiente" },
          include: [{ model: Usuario, as: "Denunciante", attributes: ["id", "username"] }],
        },
      ],
    });

    const items = imagenes
      .map((inst) => inst.toJSON())
      .filter((img) => img.DenunciaImagens.length > 3)
      .map((img) => ({
        imagenId: img.id,
        src: imagenABase64(img.url),
        publicacion: {
          id: img.publicacion.id,
          titulo: img.publicacion.titulo,
          descripcion: img.publicacion.descripcion,
        },
        autor: img.publicacion.Usuario,
        denuncias: img.DenunciaImagens,
      }));

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(200).json({ success: true, total: items.length, items });
    }
    res.render("validador/validar", {
      titulo: "Panel de control",
      items,
      usuario: req.session.usuario,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error en el servidor", detalle: err.message });
  }
});

validadorRT.post("/rechazar/:id", authMiddleware, verificarRol("validador"), async (req, res) => {
  try {
    const [n] = await DenunciaImagen.update(
      { estado: "desestimada" },
      { where: { ImagenId: req.params.id, estado: "pendiente" } }
    );
    if (!n) return res.status(404).json({ message: "No hay denuncias pendientes para esa imagen" });

    if (pideJson(req)) return res.status(200).json({ success: true, message: "Denuncias desestimadas" });
    res.redirect("/validador/validar");
  } catch (err) {
    console.error("Error al desestimar denuncias:", err);
    res.status(500).json({ message: "Error al desestimar la denuncia." });
  }
});

validadorRT.post("/baja/:id", authMiddleware, verificarRol("validador"), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const imagen = await Imagen.findByPk(req.params.id, { include: [{ model: publicacion }], transaction: t });
    const post = imagen?.publicacion;
    if (!post) { await t.rollback(); return res.status(404).json({ message: "Imagen no encontrada" }); }
    if (post.eliminada) { await t.rollback(); return res.status(409).json({ message: "La publicación ya fue eliminada por su dueño" }); }
    if (!post.estado) { await t.rollback(); return res.status(409).json({ message: "La publicación ya fue dada de baja" }); }

    await post.update({ estado: false }, { transaction: t });
    await DenunciaImagen.update(
      { estado: "aceptada" },
      { where: { ImagenId: imagen.id, estado: "pendiente" }, transaction: t }
    );

    const autor = await Usuario.findByPk(post.UsuarioId, { transaction: t });
    let cuentaSuspendida = false;
    if (autor) {
      autor.Nro_publicaciones_bajadas = (autor.Nro_publicaciones_bajadas || 0) + 1;
      if (autor.Nro_publicaciones_bajadas >= 3) {
        autor.estado = false;
        cuentaSuspendida = true;
      }
      await autor.save({ transaction: t });
    }

    await t.commit();
    if (pideJson(req)) {
      return res.status(200).json({
        success: true,
        message: "Publicación dada de baja.",
        strikesAutor: autor ? autor.Nro_publicaciones_bajadas : 0,
        cuentaSuspendida,
      });
    }
    res.redirect("/validador/validar");
  } catch (err) {
    await t.rollback();
    console.error("Error al dar de baja:", err);
    res.status(500).json({ message: "Error al dar de baja." });
  }
});

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

      if (pideJson(req)) {
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

      await denunciaComentario.destroy({
        where: { comentarioId: comentarioId },
      });
      await comentario.destroy();

      if (pideJson(req)) {
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