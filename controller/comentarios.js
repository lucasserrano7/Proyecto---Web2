import { Comentarios } from "../models/comentarios.js";
import express from "express";

const newComentarios = express.Router();

newComentarios.post("/new", async (req, res) => {
  try {
    const { ImagenId, texto } = req.body;
    const nuevoComentario = await Comentarios.create({
      texto,
      fecha: new Date(),
      ImagenId,
    });
    res.status(200).json({
      message: "Comentario creado exitosamente",
      comentario: nuevoComentario,
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
    const listaComentatios = await Comentarios.findAll({
      where: { ImagenId: id },
    });
    res.json(comentarios);
  } catch (error) {
    console.error("Error al obtener los comentarios:", error);
    res.status(500).json({ message: "Error al obtener los comentarios", error: error.message });
  }    
});

export default newComentarios;
