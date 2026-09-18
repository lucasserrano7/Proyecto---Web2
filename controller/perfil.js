import express from "express";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import Seguidores from "../models/seguidor.js";

const perfil = express.Router();

perfil.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioSesion = req.session.usuario || null;
    const idUsuario = usuarioSesion ? usuarioSesion.id : null;

    const perfilUsuario = await Usuario.findByPk(id);
    if (!perfilUsuario) {
      return res.status(404).render("error", {
        titulo: "Usuario no encontrado",
        mensaje: "El perfil que buscás no existe o fue dado de baja.",
      });
    }

    let fotoPerfilSrc = null;
    if (perfilUsuario.foto_de_perfil) {
      const bufferFoto = Buffer.isBuffer(perfilUsuario.foto_de_perfil)
        ? perfilUsuario.foto_de_perfil
        : Buffer.from(perfilUsuario.foto_de_perfil.data || perfilUsuario.foto_de_perfil);
      fotoPerfilSrc = `data:image/webp;base64,${bufferFoto.toString("base64")}`;
    }

    const constSeguidores = await Seguidores.count({ where: { seguido_id: id } });
    const constSeguidos = await Seguidores.count({ where: { seguidor_id: id } });

    const publicaciones = await publicacion.findAll({
      where: { UsuarioId: perfilUsuario.id },
      include: [
        {
          model: Imagen,
          attributes: ["id", "url", "promedio"],
          include: [
            {
              model: Comentarios,
              include: [{ model: Usuario, attributes: ["id", "username"] }],
            },
          ],
        },
        {
          model: Usuario,
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const publis = await Promise.all(
      publicaciones.map(async (instancia) => {
        const publi = instancia.toJSON();
        const listaImagenes = publi.Imagens || publi.imagenes || [];

        if (listaImagenes.length > 0) {
          publi.imagenes = await Promise.all(
            listaImagenes.map(async (imgInstancia) => {
              const image = imgInstancia.url;
              const bufferCrudo = Buffer.isBuffer(image)
                ? image
                : Buffer.from(image.data || image);
              
              const base64 = "data:image/webp;base64," + bufferCrudo.toString("base64");

              let votoUsuario = 0;
              if (idUsuario) {
                const valoracionUsuario = await Valoracion.findOne({
                  where: { UsuarioId: idUsuario, ImagenId: imgInstancia.id },
                });
                if (valoracionUsuario) {
                  votoUsuario = valoracionUsuario.puntaje;
                }
              }

              return {
                id: imgInstancia.id,
                src: base64,
                promedio: imgInstancia.promedio,
                comentarios: imgInstancia.comentarios || [],
                votoUsuario,
              };
            })
          );

          publi.comentarios = publi.imagenes[0].comentarios || [];
        } else {
          publi.imagenes = [];
          publi.comentarios = [];
        }

        return publi;
      })
    );

    let yaLoSigo = false;
    const esMiPerfil = idUsuario === perfilUsuario.id;

    if (idUsuario && !esMiPerfil) {
      const vinculo = await Seguidores.findOne({
        where: { seguidor_id: idUsuario, seguido_id: perfilUsuario.id },
      });
      if (vinculo) yaLoSigo = true;
    }

    res.render("profile", {
      usuario: usuarioSesion,
      usuarioPerfil: perfilUsuario,
      fotoPerfilSrc,
      publicaciones: publis,
      yaLoSigo,
      esMiPerfil,
      constSeguidores,
      constSeguidos,
    });
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    res.status(500).render("error", {
      titulo: "Error en el perfil",
      mensaje: "No se pudo cargar la información del usuario.",
    });
  }
});

export default perfil;