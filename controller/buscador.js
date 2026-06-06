import { Op } from "sequelize";
import express from "express";
import { publicacion } from "../models/publicacion.js";
import { Imagen } from "../models/Imagen.js";
import {Usuario} from "../models/usuario.js";

export const buscador = async (req, res) => {
    try {
        const { keyword } = req.query; 

        let condicionesPublicacion = {};

        if (keyword && keyword.trim() !== '') {
            const termino = `%${keyword.trim()}%`;
            condicionesPublicacion[Op.or] = [
                { title: { [Op.iLike]: termino } },     
                { description: { [Op.iLike]: termino } } 
            ];
        }

  
        const publicacionesEncontradas = await publicacion.findAll({
            where: condicionesPublicacion,
            order: [['createdAt', 'DESC']], 
            include: [
                {
                    model: Imagen,
                    attributes: ['id', 'url', 'promedio'] 
                },
                {
                    model: Usuario,
                    attributes: ["username", "foto_de_perfil"]
                }
            ]
        });

      
        const publis = publicacionesEncontradas.map((instancia) => {
            const publi = instancia.toJSON();

            if (publi.Imagens && publi.Imagens.length > 0) {
                publi.imagenes = publi.Imagens.map((imgDB) => {
                    const image = imgDB.url;
                    const bufferCrudo = Buffer.isBuffer(image)
                        ? image
                        : Buffer.from(image.data || image);
                    const base64 = "data:image/jpeg;base64," + bufferCrudo.toString("base64");
                    
                    return {
                        id: imgDB.id,
                        src: base64,
                        promedio: imgDB.promedio || '0.0'
                    };
                });
            }
            return publi;
        });

     
        return res.render('explorar', {
            publicaciones: publis,
            palabraBuscada: keyword || ''
        });

    } catch (error) {
        console.error("Error en el motor de busqueda:", error);
        return res.status(500).send("Error interno en el motor de busqueda");
    }
};