import { Op } from "sequelize";
import { publicacion } from "../models/publicacion.js";
import { Imagen } from "../models/Imagen.js";
import { Usuario } from "../models/usuario.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import { Etiquetas } from "../models/etiquetas.js";

export const buscador = async (req, res) => {
  try {
    const { keyword, modo = "todo" } = req.query;
    const usuarioSesion = req.session.usuario || null;
    const idUsuario = usuarioSesion ? usuarioSesion.id : null;

    let condicionesPublicacion = {};
    const includeEtiquetas = {
      model: Etiquetas,
      attributes: ["id", "nombre"],
      through: { attributes: [] },
      required: false,
    };

    if (keyword && keyword.trim() !== "") {
      const limpio = keyword.trim().replace(/^#/, "");
      const termino = `%${limpio}%`;

      if (modo === "etiqueta") {
        includeEtiquetas.where = { nombre: { [Op.iLike]: termino } };
        includeEtiquetas.required = true;
      } else if (modo === "texto") {
        condicionesPublicacion[Op.or] = [
          { title: { [Op.iLike]: termino } },
          { description: { [Op.iLike]: termino } },
        ];
      } else {
        condicionesPublicacion[Op.or] = [
          { title: { [Op.iLike]: termino } },
          { description: { [Op.iLike]: termino } },
          { "$Etiquetas.nombre$": { [Op.iLike]: termino } },
        ];
      }
    }

    const publicacionesEncontradas = await publicacion.findAll({
      where: condicionesPublicacion,
      subQuery: false,
      distinct: true,
      order: [["createdAt", "DESC"]],
      include: [
        includeEtiquetas,
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
          attributes: ["id", "username", "foto_de_perfil"],
        },
      ],
    });

    const publis = await Promise.all(
      publicacionesEncontradas.map(async (instancia) => {
        const publi = instancia.toJSON();
        const listaImagenes = publi.Imagens || publi.imagenes || [];

        if (listaImagenes.length > 0) {
          publi.imagenes = await Promise.all(
            listaImagenes.map(async (imgDB) => {
              const image = imgDB.url;
              const bufferCrudo = Buffer.isBuffer(image)
                ? image
                : Buffer.from(image.data || image);

              const base64 =
                "data:image/webp;base64," + bufferCrudo.toString("base64");

              let votoUsuario = 0;
              if (idUsuario) {
                const valoracion = await Valoracion.findOne({
                  where: { UsuarioId: idUsuario, ImagenId: imgDB.id },
                });
                if (valoracion) votoUsuario = valoracion.puntaje;
              }

              return {
                id: imgDB.id,
                src: base64,
                promedio: imgDB.promedio || "0.0",
                comentarios: imgDB.comentarios || [],
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

    return res.render("explorar", {
      usuario: usuarioSesion,
      publicaciones: publis,
      modoSeleccionado: modo,
      palabraBuscada: keyword ? keyword.trim() : "",
    });
  } catch (error) {
    console.error("Error en el motor de busqueda:", error);
    return res.status(500).render("error", {
      titulo: "Error en el buscador",
      mensaje: "No se pudieron obtener las publicaciones solicitadas.",
    });
  }
};