import { Comentarios } from "../models/comentarios.js";
import { denunciaComentario } from "../models/denunciaComentario.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { publicacion } from "../models/publicacion.js";
import { notificacion } from "../models/notificacion.js";
import { authMiddleware } from "../middlewares/auth.js";
import express from "express";

const newComentarios = express.Router();

newComentarios.post("/new", async (req, res) => {
  try {
    if (!req.session?.usuario) {
      return res.status(401).json({
        message: "Tenes que iniciar sesión para poder comentar una imagen",
      });
    }
    const { ImagenId, texto } = req.body;

    const imagen = await Imagen.findByPk(ImagenId, {
      include: [
        {
          model: publicacion,
          attributes: ["id", "comments_allowed", "UsuarioId"],
        },
      ],
    });
    if (!imagen) {
      return res.status(404).json({ message: "La imagen no existe." });
    }
    if (!imagen.comments_allowed) {
      return res
        .status(403)
        .json({ message: "Los comentarios están cerrados para esta imagen" });
    }

    const nuevoComentario = await Comentarios.create({
      texto,
      fecha: new Date(),
      ImagenId,
      UsuarioId: req.session.usuario.id,
    });
    const autorId = imagen.publicacion?.UsuarioId;
    if (autorId !== req.session.usuario.id) {
      await notificacion.create({
        titulo: "Nuevo Comentario",
        mensaje: `${req.session.usuario.username} comento tu publicación.`,
        fecha: new Date(),
        leida: false,
        link: `/p/${imagen.publicacion.id}`,
        UsuarioId: autorId,
      });
    }

    const comentarioConUsuario = await Comentarios.findOne({
      where: { id: nuevoComentario.id },
      include: {
        model: Usuario,
        attributes: ["username", "foto_de_perfil"],
      },
    });
    res.status(200).json({
      message: "Comentario creado exitosamente",
      comentario: comentarioConUsuario,
    });
  } catch (error) {
    console.error("Error al crear el comentario:", error);
    res
      .status(500)
      .json({ message: "Error al crear el comentario", error: error.message });
  }
});

newComentarios.get("/imagen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const listaComentarios = await Comentarios.findAll({
      where: { ImagenId: id },
      include: {
        model: Usuario,
        attributes: ["id", "username", "foto_de_perfil"],
      },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: listaComentarios.length,
      comentarios: listaComentarios,
    });
  } catch (error) {
    console.error("Error al obtener los comentarios:", error);
    res.status(500).json({
      message: "Error al obtener los comentarios",
      error: error.message,
    });
  }
});

newComentarios.post("/denunciar/:id", authMiddleware, async (req, res) => {
  try {
    const comentarioId = req.params.id;
    const { motivo, description } = req.body;
    const denuncianteId = req.session.usuario.id;

    if (!motivo) {
      return res.status(400).json({ message: "El motivo es obligatorio" });
    }
    const comentario = await Comentarios.findByPk(comentarioId);
    if (!comentario) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }
    if (comentario.UsuarioId === denuncianteId) {
      return res
        .status(403)
        .json({ message: "No podes denunciar tu propio comentario" });
    }
    const yaDenuncio = await denunciaComentario.findOne({
      where: { comentarioId, denunciante_id: denuncianteId },
    });
    if (yaDenuncio) {
      return res
        .status(409)
        .json({ message: "Ya denunciaste este comentario" });
    }

    const denuncia = await denunciaComentario.create({
      motivo,
      description,
      contenido: comentario.texto,
      estado: true,
      denunciante_id: denuncianteId,
      comentarioId: comentarioId,
    });

    return res.status(201).json({
      success: true,
      message: "Comentario denunciado correctamente",
      denuncia,
    });
  } catch (error) {
    console.error("Error al denuncia el comentario", error);
    return res.status(500).json({
      message: "Error interno al registrar denuncia del comentario",
      error: error.mensaje,
    });
  }
});

async function comentarioDeMiPublicacion(comentarioId, usuarioId) {
  const comentario = await Comentarios.findByPk(comentarioId);
  if (!comentario) return null;
  const imagen = await Imagen.findByPk(comentario.ImagenId, {
    include: [{ model: publicacion, attributes: ["id", "UsuarioId"] }],
  });
  if (!imagen?.publicacion || imagen.publicacion.UsuarioId !== usuarioId) {
    return null;
  }
  return comentario;
}

newComentarios.get("/denuncias", authMiddleware, async (req, res) => {
  try {
    const misImagenes = await Imagen.findAll({
      attributes: ["id"],
      include: [
        {
          model: publicacion,
          where: { UsuarioId: req.session.usuario.id, eliminada: false },
          required: true,
          attributes: [],
        },
      ],
    });
    const ids = misImagenes.map((i) => i.id);

    const lista = ids.length
      ? await Comentarios.findAll({
          where: { ImagenId: ids },
          include: [
            { model: Usuario, attributes: ["id", "username"] },
            {
              model: denunciaComentario,
              required: true,
              where: { estado: true },
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
        })
      : [];

    const comentarios = lista.map((c) => {
      const j = c.toJSON();
      const clave = Object.keys(j).find((k) => /denuncia/i.test(k));
      j.denuncias = j[clave] || [];
      return j;
    });

    res.render("validador/comentarios", {
      titulo: "Comentarios Denunciados",
      comentarios: lista,
      usuario: req.session.usuario,
      base: "/comentarios",
      esAutor: true,
      rutaBaja: "/comentarios/borrar",
      rutaDesestimar: "/comentarios/descartar",
    });
  } catch (error) {
    console.error("Error al listar denuncias de comentarios:", error);
    res.status(500).send("Error interno del servidor");
  }
});

newComentarios.post("/borrar/:id", authMiddleware, async (req, res) => {
  try {
    const comentario = await comentarioDeMiPublicacion(
      req.params.id,
      req.session.usuario.id,
    );
    if (!comentario) {
      return res.status(404).json({ message: "Comentario no encontrado." });
    }
    const denuncias = await denunciaComentario.count({
      where: { comentarioId: comentario.id },
    });
    if (denuncias === 0) {
      return res
        .status(403)
        .json({ message: "Solo podés borrar comentarios denunciados." });
    }
    await denunciaComentario.destroy({
      where: { comentarioId: comentario.id },
    });
    await comentario.destroy();
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.json({ success: true, message: "Comentario borrado." });
    }
    return res.redirect("/comentarios/denuncias");
  } catch (error) {
    console.error("Error al borrar comentario:", error);
    return res.status(500).json({ message: "Error al borrar el comentario." });
  }
});

newComentarios.post("/descartar/:id", authMiddleware, async (req, res) => {
  try {
    const comentario = await comentarioDeMiPublicacion(
      req.params.id,
      req.session.usuario.id,
    );
    if (!comentario) {
      return res.status(404).json({ message: "Comentario no encontrado." });
    }
    await denunciaComentario.update(
      { estado: false },
      { where: { comentarioId: comentario.id } },
    );
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.json({ success: true, message: "Denuncias descartadas." });
    }
    return res.redirect("/comentarios/denuncias");
  } catch (error) {
    console.error("Error al descartar denuncias:", error);
    return res
      .status(500)
      .json({ message: "Error al descartar las denuncias." });
  }
});

export default newComentarios;
