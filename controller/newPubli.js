import express from "express";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";

const newPubli = express.Router();

newPubli.post("/p", async (req, res) => {

  try {
    const { title, descripcion, img , comentario_allowed} = req.body;

    const idUsuario = req.app.locals.usuarioLogeado.id;


    const nuevaPubli = await publicacion.create({
      title: title,
      description: descripcion,
      comments_allowed: comentario_allowed || true,
      UsuarioId: idUsuario,
    });


    if (img && img.length > 0) {
      for (let i = 0; i < img.length; i++) {
        const base64Data = img[i].src.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");

        await Imagen.create({
          PublicacionId: nuevaPubli.id,
          url: buffer,
        });
      }
    }
    await notificacion.create({
      titulo: "Nueva publicación",
      mensaje: `Se subio la publicaion "${title}" correctamente`,
      fecha: new Date(),
      leida: false,
      link_: `/p/${nuevaPubli.id}`,
      UsuarioId: idUsuario,
    });

    return res
      .status(200)
      .json({
        message: "Publicación creada exitosamente",
        publicacion: nuevaPubli,
      });
  } catch (error) {
    console.error("Error al crear la publicación:", error);
    return res
      .status(500)
      .json({ message: "Error al crear la publicación", error: error.message });
  }
});

export default newPubli;
