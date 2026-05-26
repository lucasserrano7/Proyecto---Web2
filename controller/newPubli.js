import express from "express";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";
import { Comentarios } from "../models/comentarios.js";

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
          publicacionId: nuevaPubli.id,
          url: buffer,
          tipo: img[i].type || "image/jpeg",
        });
       console.log("Imagen guardada en la base de datos");
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
newPubli.get("/index", async (req, res) => {
  try {
    const publicaciones = await publicacion.findAll({
      include: [
        {
          model: Usuario,
          attributes: ["username"],
        },
        {
          model: Imagen,
          attributes: ['id', "url"],
          include: [
            {
              model: Comentarios,
            }
          ]
          },
      ],
      order: [['createdAt', 'DESC']]
    });
const publis = publicaciones.map((instancia) => {
    const publi = instancia.toJSON();
    if (publi.Imagens && publi.Imagens.length > 0 && publi.Imagens[0].url) {
      const image = publi.Imagens[0].url;
      const imageData = publi.Imagens[0];
    const bufferCrudo = Buffer.isBuffer(image)
    ? image
    : Buffer.from(image.data || image);
    publi.img = 'data:image/jpeg;base64,' + bufferCrudo.toString('base64');
    publi.comentarios = imageData.comentarios || [];
    publi.ImagenId = imageData.id;

    } else {
      publi.img = '/img/camalardo.jpg';
    }
    return publi;
  });
    console.log(publicaciones);
    res.render("index", { publicaciones: publis, usuario: req.app.locals.usuarioLogeado });
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
});


export default newPubli;
