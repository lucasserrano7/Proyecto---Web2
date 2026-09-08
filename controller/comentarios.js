import { Comentarios } from "../models/comentarios.js";
import { denunciaComentario } from "../models/denunciaComentario.js";
import { Usuario } from "../models/usuario.js";
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
    const nuevoComentario = await Comentarios.create({
      texto,
      fecha: new Date(),
      ImagenId,
      UsuarioId: req.session.usuario.id,
    });
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
    const { motivo, desciption } = req.body;
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
        .status(404)
        .json({ message: "No podes denunciar tu propio comentario" });
    }

    const denuncia = await denunciaComentario.create({
      motivo,
      desciption: desciption,
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

export default newComentarios;
