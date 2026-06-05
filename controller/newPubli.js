import express from "express";
import session from "express-session";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import { Etiquetas } from "../models/etiquetas.js";

const newPubli = express.Router();

newPubli.post("/p", async (req, res) => {
  try {
    const { title, descripcion, img, comments_allowed, etiquetas } = req.body;

    const idUsuario = req.session.usuario.id;

    const nuevaPubli = await publicacion.create({
      title: title,
      description: descripcion,
      comments_allowed: comments_allowed ,
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

    if (etiquetas && etiquetas.length > 0) {
      for (let i = 0; i < etiquetas.length; i++) {
        const [etiquetaDB, creada] = await Etiquetas.findOrCreate({
          where: { nombre: etiquetas[i] },
        });
        await nuevaPubli.addEtiquetas(etiquetaDB);
      }
    }

    const todasEtiquetas = await Etiquetas.findAll();

    return res.status(200).json({
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
          attributes: ["id","username", "foto_de_perfil"],
        },
        {
          model: Imagen,
          attributes: ["id", "url", "promedio"],
          include: [
            {
              model: Comentarios,
              include: [
                {
                  model: Usuario,
                  attributes: ["username", "foto_de_perfil"],
                }
              ]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const idUsuario = req.session.usuario ? req.session.usuario.id : null;

    const publis = await Promise.all(publicaciones.map(async (instancia) => {
      const publi = instancia.toJSON();

      if (publi.Imagens && publi.Imagens.length > 0) {
        publi.imagenes = await Promise.all(publi.Imagens.map(async(ingInstancia) => {
          const image = ingInstancia.url;
          const bufferCrudo = Buffer.isBuffer(image)
            ? image
            : Buffer.from(image.data || image);
          const base64 =  "data:image/jpeg;base64," + bufferCrudo.toString("base64");
        
          let votoUsuario = 0;
          if (idUsuario) {
            const valoracionUsuario = await Valoracion.findOne({
              where: { UsuarioId: idUsuario, ImagenId: ingInstancia.id },
            });
            if (valoracionUsuario) {
              votoUsuario = valoracionUsuario.puntaje;
            }
          }



        return{
          id: ingInstancia.id,
          src: base64,
          promedio: ingInstancia.promedio,
          comentarios: ingInstancia.comentarios,
          votoUsuario: votoUsuario,
        };
   
      }));
      publi.comentarios = publi.imagenes[0].comentarios;
      } else {
        publi.imagenes = [];
        publi.comentarios = [];
      }

        return publi;
        }));
   
     

      const todasEtiquetas = await Etiquetas.findAll({
        attributes: ["nombre"],
      });

    res.render("index", { publicaciones: publis, etiquetas: todasEtiquetas, usuario: req.session.usuario });
   
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
});

export default newPubli;
