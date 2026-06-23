import express from "express";
import { Coleccion } from "../models/coleccion.js"

const coleccionRt = express.Router();

coleccionRt.get("/", async (req, res)=>{
try {

     const idUsuario = req.session.usuario.id;
        const colecciones = await Coleccion.findAll({
            where: {
                UsuarioId: idUsuario,
            }
        })
    res.render("colecciones", {colecciones: colecciones});
} catch (error) {
    console.error("error: ", error);
    res.status(500).send("Error en el servidor");
}

});


export default coleccionRt;