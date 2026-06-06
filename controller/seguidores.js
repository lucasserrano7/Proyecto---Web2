import e from "express";
import { Usuario } from "../models/usuario.js";
import { Seguidores } from "../models/seguidor.js";

const seguidoresRt = e.Router();

export const seguimientoUsers = async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res.status(401).json({ success: false, error: "Usuario no autenticado" });
    }
    const { creatorId } = req.body;
    const idUsuario = req.session.usuario.id;

    if (parseInt(creatorId) === idUsuario) {
      return res.status(400).json({ success: false, error: "No puedes seguirte a ti mismo" });
    }
    const ysSesiguen = await Seguidores.findOne({
      where: {
        seguidor_id: idUsuario, 
        seguido_id: creatorId,  
      },
    });

    if (ysSesiguen) {
      await Seguidores.destroy({
        where: {
          seguidor_id: idUsuario,
          seguido_id: creatorId,
        },
      });
      
      return res.status(200).json({ 
        success: true, 
        siguiendo: false, 
        message: "Has dejado de seguir al usuario" 
      });
    } else {
      await Seguidores.create({
        seguidor_id: idUsuario,
        seguido_id: creatorId,
      });

      return res.status(200).json({ 
        success: true, 
        siguiendo: true, 
        message: "Ahora sigues al usuario" 
      });
    }
  } catch (error) {
    console.error("Error al seguir al usuario:", error);
    return res.status(500).json({ success: false, error: "Error al seguir al usuario" });
  }
};

seguidoresRt.post("/seguir", seguimientoUsers);

export default seguidoresRt;