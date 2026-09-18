import express from "express";
import { Coleccion } from "../models/coleccion.js";
import { publicacion } from "../models/publicacion.js";
import { Imagen } from "../models/Imagen.js";
import { Usuario } from "../models/usuario.js";

const coleccionRt = express.Router();

coleccionRt.get("/", async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res.redirect("/login");
    }

    const colecciones = await Coleccion.findAll({
      where: { UsuarioId: req.session.usuario.id },
      include: [
        {
          model: publicacion,
          include: [{ model: Imagen }],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.render("colecciones", {
      colecciones,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error("Error al cargar colecciones:", error);
    res.status(500).render("error", {
      titulo: "Error en colecciones",
      mensaje: "No pudimos cargar tus carpetas.",
    });
  }
});

coleccionRt.post("/toggle-publicacion", async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res
        .status(401)
        .json({ success: false, message: "Iniciá sesión primero." });
    }

    const { coleccionId, publicacionId } = req.body;

    const coleccion = await Coleccion.findOne({
      where: {
        id: coleccionId,
        UsuarioId: req.session.usuario.id, // Seguridad: solo el dueño edita
      },
    });

    if (!coleccion) {
      return res
        .status(404)
        .json({ success: false, message: "Colección no encontrada." });
    }
    const yaEstaEnColeccion = await coleccion.hasPublicacion(publicacionId);

    if (yaEstaEnColeccion) {
      await coleccion.removePublicacion(publicacionId);
      return res.json({
        success: true,
        agregado: false,
        message: "Publicación eliminada de la colección.",
      });
    } else {
      await coleccion.addPublicacion(publicacionId);
      return res.json({
        success: true,
        agregado: true,
        message: `¡Guardada en ${coleccion.titulo}!`,
      });
    }
  } catch (error) {
    console.error("Error al gestionar publicación en colección:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error en el servidor." });
  }
});
coleccionRt.get("/mis-colecciones", async (req, res) => {
  try {
    if (!req.session.usuario) return res.json({ colecciones: [] });

    const colecciones = await Coleccion.findAll({
      where: { UsuarioId: req.session.usuario.id },
      attributes: ["id", "titulo", "categoria"],
    });

    res.json({ success: true, colecciones });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

coleccionRt.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioSesion = req.session.usuario;

    const coleccion = await Coleccion.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ["id", "username", "foto_de_perfil"],
        },
        {
          model: publicacion,
          include: [
            { model: Imagen },
            {
              model: Usuario,
              attributes: ["id", "username", "foto_de_perfil"],
            },
          ],
        },
      ],
      order: [[{ model: publicacion }, "createdAt", "DESC"]],
    });

    if (!coleccion) {
      return res.status(404).render("error", {
        titulo: "Colección no encontrada",
        mensaje: "El álbum que buscás no existe o fue eliminado.",
      });
    }

    const esDuenio = usuarioSesion && usuarioSesion.id === coleccion.UsuarioId;
    if (!coleccion.publico && !esDuenio) {
      return res.status(403).render("error", {
        titulo: "Colección privada",
        mensaje: "Este álbum es privado y solo su creador puede ver el contenido.",
      });
    }


    const publicacionesProcesadas = (coleccion.publicacions || []).map((pub) => {
      const p = pub.toJSON();

   
      const imagenesOriginales = p.Imagens || p.imagenes || [];

     
      const imagenesFormateadas = imagenesOriginales.map((img) => {
        let base64 = "";

        if (img.url && Buffer.isBuffer(img.url)) {
          base64 = img.url.toString("base64");
        } else if (img.url && typeof img.url === "string") {
          if (img.url.startsWith("data:")) {
            return { ...img, src: img.url };
          }
          base64 = Buffer.from(img.url).toString("base64");
        }

        const srcFinal = base64 ? `data:image/webp;base64,${base64}` : (img.url || "");

        return {
          ...img,
          src: srcFinal, 
          url: srcFinal,
        };
      });

      p.imagenes = imagenesFormateadas;
      p.Imagens = imagenesFormateadas;

      return p;
    });

    res.render("coleccionDetalle", {
      coleccion,
      publicaciones: publicacionesProcesadas,
      usuario: usuarioSesion,
      esDuenio,
    });
  } catch (error) {
    console.error("Error al cargar detalle de la colección:", error);
    res.status(500).render("error", {
      titulo: "Error al cargar el álbum",
      mensaje: "Ocurrió un error al obtener las publicaciones de la colección.",
    });
  }
});

coleccionRt.delete("/:id", async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const { id } = req.params;
    const coleccion = await Coleccion.findOne({
      where: { id, UsuarioId: req.session.usuario.id },
    });

    if (!coleccion) {
      return res
        .status(404)
        .json({ success: false, message: "Colección no encontrada." });
    }

    await coleccion.destroy();
    return res.json({
      success: true,
      message: "Colección eliminada con éxito.",
    });
  } catch (error) {
    console.error("Error al borrar colección:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al eliminar la colección." });
  }
});
coleccionRt.post("/crear", async (req, res) => {
  try {
    if (!req.session || !req.session.usuario) {
      return res.status(401).json({ success: false, message: "Iniciá sesión primero." });
    }

    const { titulo, categoria, publico } = req.body;

    if (!titulo || !categoria) {
      return res.status(400).json({ success: false, message: "Título y categoría requeridos." });
    }

    const nuevaColeccion = await Coleccion.create({
      titulo: titulo.trim(),
      categoria: categoria.trim(),
      publico: publico === "true" || publico === true,
      UsuarioId: req.session.usuario.id,
    });

    return res.status(201).json({
      success: true,
      message: "¡Colección creada con éxito!",
      coleccion: nuevaColeccion,
    });
  } catch (error) {
    console.error("Error al crear colección:", error);
    return res.status(500).json({ success: false, message: "Error al guardar en base de datos." });
  }
});
coleccionRt.get("/para-guardar/:publicacionId", async (req, res) => {
  try {
    if (!req.session || !req.session.usuario) {
      return res.status(401).json({ success: false, message: "Iniciá sesión primero." });
    }

    const { publicacionId } = req.params;
    const usuarioId = req.session.usuario.id;

    const colecciones = await Coleccion.findAll({
      where: { UsuarioId: usuarioId },
      attributes: ["id", "titulo", "categoria"],
      include: [
        {
          model: publicacion,
          where: { id: publicacionId },
          attributes: ["id"],
          required: false,
          },
      ],
      order: [["titulo", "ASC"]],
    });

    const resultado = colecciones.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      categoria: c.categoria,
      guardada: c.publicacions && c.publicacions.length > 0,
    }));

    res.json({ success: true, colecciones: resultado });
  } catch (error) {
    console.error("Error al obtener colecciones para guardar:", error);
    res.status(500).json({ success: false, message: "Error al cargar colecciones." });
  }
});
export default coleccionRt;
