import express from "express";
import session from "express-session";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import { Etiquetas } from "../models/etiquetas.js";
import { text } from "stream/consumers";
import Jimp from "jimp";

const newPubli = express.Router();

newPubli.post("/p", async (req, res) => {
  try {

    if(!req.session?.usuario){
      return res.status(401).json({message: "Tenes que iniciar sesion para poder publicar."})
    }
    const { title, descripcion, img, comments_allowed, etiquetas, tieneCopy, textoMarcaAgua } = req.body;

    const idUsuario = req.session.usuario.id;


    const nuevaPubli = await publicacion.create({
      title: title,
      description: descripcion,
      comments_allowed: comments_allowed ?? true,
      tieneCopy: tieneCopy,
      UsuarioId: idUsuario,
    });



    if (img && img.length > 0) {
      for (let i = 0; i < img.length; i++) {
        
        const base64Data = img[i].src.split(",")[1];
        let buffer = Buffer.from(base64Data, "base64");

        async function ponerMarcaAgua(buffer, textoMarcaAgua) {
          try {
            const img = await Jimp.read(buffer);
            const fuente = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
            
            img.print(
              fuente,
              0,
              0,
              textoMarcaAgua
              );
            
            const bufferSalida = await img.getBufferAsync(Jimp.MIME_JPEG);
            return bufferSalida ;


          } catch (error) {
            console.error("Errro al procesar el buffer");
            throw error;
          }
        }

        if(tieneCopy){
          buffer = await ponerMarcaAgua(buffer, textoMarcaAgua)
        }

        await Imagen.create({
          publicacionId: nuevaPubli.id,
          url: buffer,
          tipo: img[i].type || "image/jpeg",
        });
        console.log("Imagen guardada en la base de datos");
      }
    }

     if (etiquetas && etiquetas.length > 0) {
      for (let i = 0; i < etiquetas.length; i++) {
        const [etiquetaDB, creada] = await Etiquetas.findOrCreate({
          where: { nombre: etiquetas[i] },
        });
        await nuevaPubli.addEtiquetas(etiquetaDB);
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

   

    const todasEtiquetas = await Etiquetas.findAll();

    return res.status(200).json({success: true});
  } catch (error) {
    console.error("Error al crear la publicación:", error);
    return res
      .status(500).json({})
  }
});
newPubli.get("/index", async (req, res) => {
  try {
    const idUsuario = req.session.usuario ? req.session.usuario.id : null;

    let condicicionBusquedaPublis={};

    if (!idUsuario) {
      condicicionBusquedaPublis.tieneCopy = false;
    }



    const publicaciones = await publicacion.findAll({
      where: condicicionBusquedaPublis,
      include: [
        {
          model: Usuario,
          attributes: ["id","username", "foto_de_perfil"],
        },
        {
          model: Etiquetas,
          attributes: ["id", "nombre"],
          through: {attributes: []},
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
                },
              ],
            },
            {
              model: Valoracion,
              attributes: ["UsuarioId", "puntaje"]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    

    const publis = publicaciones.map((instancia) => {
      const publi = instancia.toJSON();

      publi.imagenes = (publi.Imagens || []).map((imgInstancia) => {
        const image = imgInstancia.url;
        const bufferCrudo = Buffer.isBuffer(image)
          ? image
          : Buffer.from(image?.data || image || []);
        
        const base64 = "data:image/jpeg;base64," + bufferCrudo.toString("base64");
        
          let votoUsuario = 0;
          if (idUsuario && imgInstancia.Valoracion) {
            const valoracion = imgInstancia.Valoracion.find((v) => v.UsuarioId === idUsuario);
          if (valoracion) votoUsuario = valoracion.puntaje;
            
          }

   



        return{
          id: imgInstancia.id,
          src: base64,
          promedio: imgInstancia.promedio,
          comentarios: imgInstancia.Comentarios,
          votoUsuario: votoUsuario,
        };
   
      });
      publi.comentarios = publi.imagenes[0]?.comentarios || [];

        return publi;
        });
   
        let alertaFeed = undefined;
    if (req.query.subido === 'true') {
      alertaFeed = { status: 'success', text: 'Publicación creada exitosamente '};
    }
     

      const todasEtiquetas = await Etiquetas.findAll({
        attributes: ["nombre"],
      });

    res.render("index", { publicaciones: publis, etiquetas: todasEtiquetas, usuario: req.session.usuario, alert: alertaFeed });
   
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
});

newPubli.post("/p/:id/cerrar_comentarios", async (req, res ) =>{
  try {
    if (!req.session?.usuario) {
       return res.status(401).json({message: "Tenes que iniciar sesion."})
    }
    const publicacionID = req.params.id;
    const IdUsuario = req.session.usuario.id;

    const post = await publicacion.findByPk(publicacionID);

    if (!post) {
       return res.status(404).json({message: "Publicacion no encontrada."})
    }
    if (post.UsuarioId !== IdUsuario) {
       return res.status(403).json({message: "No tenes los permisos para modificar esta publicaion."})
    }

    post.comments_allowed = false;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comentarios desactivados",
      comments_allowed: post.comments_allowed
    });
  } catch (error) {
    console.error("Error al cerrar los comentarios", error);
    return res.status(500).json({message: "Error"});
  }
});

export default newPubli;
