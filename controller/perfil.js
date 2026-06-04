import express from "express";
import session from "express-session";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import Seguidores from "../models/seguidor.js";

const perfil = express.Router();


perfil.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const perfilUsuario = await Usuario.findOne({ where: { username } });
    if (!perfilUsuario) return res.status(404).send("Usuario no encontrado");

    const publicaciones = await publicacion.findAll({ 
      where: { UsuarioId: perfilUsuario.id } 
    });

    let yaLoSigo = false;
    if (req.session.usuario) {
      const vinculo = await Seguidores.findOne({
        where: { seguidor_id: req.session.usuario.id, seguido_id: perfilUsuario.id }
      });
      if (vinculo) yaLoSigo = true;
    }

    res.render("profile", { 
      usuarioPerfil: perfilUsuario, 
      publicaciones, 
      yaLoSigo 
    });

  } catch (error) {
    res.status(500).send("Error en el servidor");
  }
});

export default perfil;