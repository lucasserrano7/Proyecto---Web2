import { Op } from "sequelize";
import { publicacion } from "../models/publicacion.js";
import { Imagen } from "../models/Imagen.js";
import { Usuario } from "../models/usuario.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import { Etiquetas } from "../models/etiquetas.js";

export const buscador = async (req, res) => {
  try {
    const {
      keyword,
      modo = "todo",
      autor = "",
      desde = "",
      hasta = "",
      licencia = "",
      minPromedio = "",
      minVotos = "",
      orden = "",
    } = req.query;
    const usuarioSesion = req.session.usuario || null;
    const idUsuario = usuarioSesion ? usuarioSesion.id : null;

    let condicionesPublicacion = {
      estado: true,
      eliminada: false,
      ...(usuarioSesion ? {} : { tieneCopy: false }),
    };

    if (autor.trim()) {
  condicionesPublicacion["$Usuario.username$"] = {
    [Op.iLike]: `%${autor.trim()}%`,
  };
}

const rangoFechas = {};
if (desde) rangoFechas[Op.gte] = new Date(`${desde}T00:00:00`);
if (hasta) rangoFechas[Op.lte] = new Date(`${hasta}T23:59:59.999`);
if (desde || hasta) condicionesPublicacion.createdAt = rangoFechas;

if (usuarioSesion && licencia === "con") condicionesPublicacion.tieneCopy = true;
if (usuarioSesion && licencia === "sin") condicionesPublicacion.tieneCopy = false;

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
          attributes: ["id", "promedio", "comments_allowed"],
          include: [
            {
              model: Comentarios,
              include: [{ model: Usuario, attributes: ["id", "username"] }],
            },
            {
              model: Valoracion,
              attributes: ["UsuarioId", "puntaje"],
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
              let votoUsuario = 0;
              if (idUsuario && imgDB.Valoracions) {
                const val = imgDB.Valoracions.find(
                  (v) => v.UsuarioId === idUsuario,
                );
                if (val) votoUsuario = val.puntaje;
              }

              return {
                id: imgDB.id,
                src: `/imagen/${imgDB.id}`,
                promedio: imgDB.promedio || "0.0",
                cantidadValoraciones: imgDB.Valoracions
                  ? imgDB.Valoracions.length
                  : 0,
                comentarios: imgDB.comentarios || [],
                votoUsuario,
              };
            }),
          );
          publi.comentarios = publi.imagenes[0].comentarios || [];
        } else {
          publi.imagenes = [];
          publi.comentarios = [];
        }

        return publi;
      }),
    );

    let resultado = publis;

const promMin = parseFloat(minPromedio);
if (!Number.isNaN(promMin)) {
  resultado = resultado.filter((p) =>
    p.imagenes.some((i) => parseFloat(i.promedio || 0) >= promMin),
  );
}

const votosMin = parseInt(minVotos, 10);
if (!Number.isNaN(votosMin)) {
  resultado = resultado.filter(
    (p) => p.imagenes.reduce((a, i) => a + i.cantidadValoraciones, 0) >= votosMin,
  );
}

const votosDe = (p) => p.imagenes.reduce((a, i) => a + i.cantidadValoraciones, 0);
const mejorPromedio = (p) =>
  Math.max(0, ...p.imagenes.map((i) => parseFloat(i.promedio || 0)));

if (orden === "valoradas") {
  resultado = [...resultado].sort((a, b) => mejorPromedio(b) - mejorPromedio(a));
} else if (orden === "votadas") {
  resultado = [...resultado].sort((a, b) => votosDe(b) - votosDe(a));
}


    return res.render("explorar", {
      usuario: usuarioSesion,
      publicaciones: resultado,
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
