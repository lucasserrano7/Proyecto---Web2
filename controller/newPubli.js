import express from 'express';
import { publicacion } from '../models/publicacion.js';
import { Usuario } from '../models/usuario.js';
import { Imagen } from '../models/imagenes.js';

const newPubli = express.Router();

newPubli.post("/p", async (req, res) => {
    try {
        const { titulo, descripcion, imagen } = req.body;

        const nuevaPubli = await publicacion.create({
            title: titulo,
            description: descripcion,
        });

        let imagenes= req.body.imgBase64;

        if(imagenes ){
            if (!Array.isArray(imagenes)) {
                imagenes = [imagenes];
            }
            
            for (let i = 0 ; i < imagenes.length; i++){
            const base64Data = imagenes[i].split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
        
            await Imagen.create({
            publicacionId: nuevaPubli.id,
            data: buffer,
            });
        }
    }
        
        return res.redirect("/index");

    } catch (error) {
        return res.status(500).json({ message: "Error al crear la publicación", error: error.message });
    }
});


export default newPubli;