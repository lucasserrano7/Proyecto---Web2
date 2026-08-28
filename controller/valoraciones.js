import e from "express";
import session from "express-session";
import {Valoracion} from "../models/valoracion.js";
import {Imagen} from "../models/Imagen.js";
import {publicacion} from "../models/publicacion.js"
import { Usuario } from "../models/usuario.js";


const valoraciones = e.Router();

valoraciones.post("/valoraciones", async (req, res) => {
  try {
    const { puntaje, imagenId } = req.body;

    if (!req.session || !req.session.usuario) {
      return res.status(401).json({ message: "¡Tenes que iniciar sesión para poder valorar una imagen!" });
    }

    const idUsuario = req.session.usuario.id;

    const img = await Imagen.findByPk(imagenId,{
      include: [{model: Publicacion}]
    })
    if(!img){
      return res.status(404).json({message: "La imagen no existe"})
    }

    const Idautor = img.Publicacion ? img.Publicacion.UsuarioId : null;

     if(Idautor === idUsuario){
      return res.status(403).json({message: "No podes valorar tus publicaciones."})
    }
    const valoracionExistente = await Valoracion.findOne({
      where: { UsuarioId: idUsuario, ImagenId: imagenId },
    });

if (valoracionExistente) {
      return res.status(400).json({ message: "Ya has valorado esta publicación" });
    }else {
    await Valoracion.create({
      puntaje: puntaje,
      UsuarioId: idUsuario,
      ImagenId: imagenId,
    });

    const resultado = await Valoracion.findAll({
      where: { ImagenId: imagenId },
      attributes: [[Valoracion.sequelize.fn("AVG", Valoracion.sequelize.col("puntaje")), "promedio"]],
      raw: true,
    });
    const promedio = resultado[0].promedio ? parseFloat(resultado[0].promedio).toFixed(1) : '0.0';

    await Imagen.update(
      { promedio: promedio },
      { where: { id: imagenId } }
    );
    return res.status(200).json({ message: "Valoración creada exitosamente", promedio: promedio });
}
    } catch (error) {
    console.error("Error al crear la valoración:", error);
    return res
      .status(500)
      .json({ message: "Error al crear la valoración", error: error.message });
  }
});

export default valoraciones;