import express from "express";
import session from "express-session";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import Seguidores from "../models/seguidor.js";

const perfil = express.Router();


perfil.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const perfilUsuario = await Usuario.findByPk(id);
    if (!perfilUsuario) return res.status(404).send("Usuario no encontrado");


    const constSeguidores = await Seguidores.count({ where: { seguido_id: id } });
    const constSeguidos = await Seguidores.count({ where: { seguidor_id: id } });

    const publicaciones = await publicacion.findAll({ 
      where: { UsuarioId: perfilUsuario.id } ,
      include: [
        {
          model: Imagen,
          attributes: ['id', 'url', 'promedio'],
          include: [
            {
              model: Comentarios,
              include: [{ model: Usuario, attributes: ['username'] }],
            }
          ]
            },
        {
          model: Usuario,
          attributes: ['id', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],

    }
  );

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


    let yaLoSigo = false;
    if (req.session.usuario) {
      const vinculo = await Seguidores.findOne({
        where: { seguidor_id: req.session.usuario.id, seguido_id: perfilUsuario.id }
      });
      if (vinculo) yaLoSigo = true;
    }

    res.render("profile", { 
      usuarioPerfil: perfilUsuario, 
      publicaciones: publis, 
      yaLoSigo,
      constSeguidores,
      constSeguidos
    });

  } catch (error) {
    res.status(500).send("Error en el servidor");
  }
});

export default perfil;