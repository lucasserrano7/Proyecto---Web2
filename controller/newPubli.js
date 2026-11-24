import express from "express";
import { publicacion } from "../models/publicacion.js";
import { Usuario } from "../models/usuario.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";
import { Comentarios } from "../models/comentarios.js";
import { Valoracion } from "../models/valoracion.js";
import { Etiquetas } from "../models/etiquetas.js";
import { Seguidores } from "../models/seguidor.js";
import Jimp from "jimp";

const newPubli = express.Router();

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;

async function ponerMarcaAgua(buffer, textoMarcaAgua) {
  try {
    const imagen = await Jimp.read(buffer);
    const { width, height } = imagen.bitmap;

    const fuente = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
    const anchoTexto = Jimp.measureText(fuente, textoMarcaAgua);
    const altoTexto = Jimp.measureTextHeight(
      fuente,
      textoMarcaAgua,
      anchoTexto + 20,
    );
    const capa = new Jimp(anchoTexto + 40, altoTexto + 40, 0x00000000);
    capa.print(fuente, 20, 20, textoMarcaAgua);

    capa.color([{ apply: "darken", params: [12] }]);
    capa.opacity(0.4);
    const objetivo = Math.min(width * 0.75, height * 1.3);
    capa.resize(objetivo, Jimp.AUTO);

    capa.rotate(30);

    const x = Math.round((width - capa.bitmap.width) / 2);
    const y = Math.round((height - capa.bitmap.height) / 2);
    imagen.composite(capa, x, y);

    return await imagen.getBufferAsync(Jimp.MIME_JPEG);
  } catch (error) {
    console.error("Error al procesar el buffer", error);
    throw error;
  }
}

function incluirPublicacion() {
  return [
    {
      model: Usuario,
      attributes: ["id", "username", "foto_de_perfil"],
    },
    {
      model: Etiquetas,
      attributes: ["id", "nombre"],
      through: { attributes: [] },
    },
    {
      model: Imagen,
      attributes: ["id", "promedio","url", "comments_allowed"],
      include: [
        {
          model: Comentarios,
          include: [
            {
              model: Usuario,
              attributes: ["username", "foto_de_perfil"],
            },
          ],
        },
        {
          model: Valoracion,
          attributes: ["UsuarioId", "puntaje"],
        },
      ],
    },
  ];
}

function armarPubli(instancia, idUsuario) {
  const publi = instancia.toJSON();

  publi.imagenes = (publi.Imagens || []).map((imgInstancia) => {
    const image = imgInstancia.url;
    const bufferCrudo = Buffer.isBuffer(image)
      ? image
      : Buffer.from(image?.data || image || []);

    const base64 = "data:image/jpeg;base64," + bufferCrudo.toString("base64");

    let votoUsuario = 0;
    if (idUsuario && imgInstancia.Valoracions) {
      const valoracion = imgInstancia.Valoracions.find(
        (v) => v.UsuarioId === idUsuario,
      );
      if (valoracion) votoUsuario = valoracion.puntaje;
    }

    return {
      id: imgInstancia.id,
      src: base64,
      promedio: imgInstancia.promedio,
      cantidadValoraciones: imgInstancia.Valoracions
        ? imgInstancia.Valoracions.length
        : 0,
      comentarios: imgInstancia.Comentarios || imgInstancia.comentarios || [],
      votoUsuario: votoUsuario,
      comentariosAbiertos: imgInstancia.comments_allowed,
      
    };
  });

  publi.comentarios = publi.imagenes[0]?.comentarios || [];

  const totalVotos = publi.imagenes.reduce(
    (acc, img) => acc + (img.cantidadValoraciones || 0),
    0,
  );

  publi.votos = totalVotos;
  publi.promedio = publi.imagenes[0]?.promedio || 0;

  return publi;
}

newPubli.post("/p", async (req, res) => {
  try {
    if (!req.session?.usuario) {
      return res
        .status(401)
        .json({ message: "Tenes que iniciar sesion para poder publicar." });
    }

    const { img, comments_allowed, etiquetas } = req.body;
    const title = String(req.body.title || "").trim();
    const descripcion = String(req.body.descripcion || "").trim();

    if (title.length < 3 || title.length > 50) {
      return res
        .status(400)
        .json({ message: "El título debe tener entre 3 y 50 caracteres." });
    }
    if (descripcion.length > 255) {
      return res.status(400).json({
        message: "La descripción no puede superar los 255 caracteres.",
      });
    }
    if (!Array.isArray(img) || img.length === 0) {
      return res.status(400).json({ message: "Subí al menos una imagen." });
    }

    const etiquetasLimpias = Array.isArray(etiquetas)
      ? etiquetas.map((e) => String(e || "").trim()).filter(Boolean)
      : [];
    if (etiquetasLimpias.length === 0) {
      return res
        .status(400)
        .json({ message: "Agregá aunque sea una etiqueta" });
    }

    const imagenesProcesadas = [];
    for (const item of img) {
      const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(item?.src || "");
      if (!match || !TIPOS_PERMITIDOS.includes(match[1])) {
        return res.status(400).json({
          message: "Formato de imagen no permitido (JPG, PNG o WebP).",
        });
      }
      let buffer = Buffer.from(match[2], "base64");
      if (buffer.length > MAX_BYTES_IMAGEN) {
        return res
          .status(400)
          .json({ message: "Cada imagen debe pesar menos de 5 MB." });
      }

      const copyright = item.copyright === true;
      const marca = String(item.marca || "")
        .trim()
        .slice(0, 40);
      let tipo = match[1];

      if (copyright) {
        if (!marca) {
          return res.status(400).json({
            message: "Escribí la marca de agua en las imágenes con copyright.",
          });
        }
        buffer = await ponerMarcaAgua(buffer, marca);
        tipo = "image/jpeg"; // ponerMarcaAgua devuelve JPEG
      }
      imagenesProcesadas.push({ buffer, tipo, copyright, marca });
    }

    // la publicación "tiene copy" si alguna de sus imágenes lo tiene
    const tieneCopy = imagenesProcesadas.some((i) => i.copyright);

    const idUsuario = req.session.usuario.id;

    const nuevaPubli = await publicacion.create({
      title: title,
      description: descripcion,
      comments_allowed: comments_allowed ?? true,
      tieneCopy: tieneCopy,
      UsuarioId: idUsuario,
    });

    for (const item of imagenesProcesadas) {
      await Imagen.create({
        publicacionId: nuevaPubli.id,
        url: item.buffer,
        tipo: item.tipo,
        copyright: item.copyright,
        marcaAgua: item.copyright,
        texto_personalizado: item.copyright ? item.marca : null,
      });
    }

    for (const nombre of etiquetasLimpias) {
      const [etiquetaDB] = await Etiquetas.findOrCreate({
        where: { nombre },
      });
      await nuevaPubli.addEtiquetas(etiquetaDB);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al crear la publicación:", error);
    return res.status(500).json({ message: "Error al crear la publicación." });
  }
});

newPubli.get("/index", async (req, res) => {
  try {
    const idUsuario = req.session?.usuario ? req.session.usuario.id : null;

    const condicionBusquedaPublis = { estado: true, eliminada: false };

    if (!idUsuario) {
      condicionBusquedaPublis.tieneCopy = false;
    }

    const publicaciones = await publicacion.findAll({
      where: condicionBusquedaPublis,
      include: incluirPublicacion(),
      order: [
        ["createdAt", "DESC"],
        [Imagen, "id", "ASC"],
      ],
    });

    const publis = publicaciones.map((p) => armarPubli(p, idUsuario));

    let alertaFeed = undefined;
    if (req.query.subido === "true") {
      alertaFeed = {
        status: "success",
        text: "Publicación creada exitosamente ",
      };
    }

    const todasEtiquetas = await Etiquetas.findAll({
      attributes: ["nombre"],
    });

    publis.sort((a, b) => {
      const scoreA = a.promedio * 0.7 + Math.log10(a.votos + 1) * 0.3;
      const scoreB = b.promedio * 0.7 + Math.log10(b.votos + 1) * 0.3;
      return scoreB - scoreA;
    });

    res.render("index", {
      publicaciones: publis,
      etiquetas: todasEtiquetas,
      usuario: req.session?.usuario,
      alert: alertaFeed,
    });
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
});

newPubli.get("/siguiendo", async (req, res) => {
  try {
    const idUsuario = req.session?.usuario?.id;

    if (!idUsuario) {
      return res.redirect("/login");
    }

    const seguidores = await Seguidores.findAll({
      where: { seguidor_id: idUsuario },
      attributes: ["seguido_id"],
    });

    const idsSeguidores = seguidores.map((s) => s.seguidor_id);

    const condicionBusquedaPublis = {
      estado: true,
      eliminada: false,
      UsuarioId: idsSeguidores,
    };

    const publicaciones = await publicacion.findAll({
      where: condicionBusquedaPublis,
      include: incluirPublicacion(),
      order: [
        ["createdAt", "DESC"],
        [Imagen, "id", "ASC"],
      ],
    });

    const publis = publicaciones.map((p) => armarPubli(p, idUsuario));

    res.render("siguiendo", {
      publicaciones: publis,
      usuario: req.session?.usuario,
    });
  } catch (error) {
    console.error("Error al obtener publicaciones de seguidores:", error);
    res
      .status(500)
      .json({ message: "Error al obtener publicaciones de seguidores" });
  }
});

newPubli.get("/p/:id", async (req, res) => {
  try {
    const sesion = req.session?.usuario;
    const idUsuario = sesion?.id ?? null;

    const instancia = await publicacion.findByPk(req.params.id, {
      include: incluirPublicacion(),
      order: [[Imagen, "id", "ASC"]],
    });

    if (!instancia || instancia.eliminada) {
      return res.status(404).send("Publicación no encontrada");
    }

    const esDueno = idUsuario && idUsuario === instancia.UsuarioId;
    const esValidador = sesion?.rol === "validador";

    if (!instancia.estado && !esDueno && !esValidador) {
      return res.status(404).send("Publicación no encontrada");
    }
    if (instancia.tieneCopy && !idUsuario) {
      return res.status(404).send("Publicación no encontrada");
    }

    const etiquetas = await Etiquetas.findAll({ attributes: ["nombre"] });

    res.render("publicacion", {
      publicaciones: [armarPubli(instancia, idUsuario)],
      etiquetas: etiquetas,
      usuario: sesion,
    });
  } catch (error) {
    console.error("Error en /p/:id:", error);
    res.status(500).send("Error interno del servidor");
  }
});

newPubli.post("/imagen/:id/cerrar_comentarios", async (req, res) => {
  try {
    if (!req.session?.usuario) {
      return res.status(401).json({ message: "Tenes que iniciar sesion." });
    }

    const img = await Imagen.findByPk(req.params.id, {
      include: [
        { model: publicacion, attributes: ["id", "UsuarioId", "eliminada"] },
      ],
    });

    if (!img || !img.publicacion || img.publicacion.eliminada) {
      return res.status(404).json({ message: "Imagen no encontrada." });
    }
    if (img.publicacion.UsuarioId !== req.session.usuario.id) {
      return res.status(403).json({
        message: "No tenes los permisos para modificar esta imagen.",
      });
    }

    img.comments_allowed = false;
    await img.save();

    return res.status(200).json({
      success: true,
      message: "Comentarios cerrados para esta imagen",
      comments_allowed: false,
    });
  } catch (error) {
    console.error("Error al cerrar los comentarios", error);
    return res.status(500).json({ message: "Error" });
  }
});

newPubli.post("/p/:id/borrar_publicacion", async (req, res) => {
  try {
    if (!req.session?.usuario) {
      return res.status(401).json({ message: "Tenes que iniciar sesion." });
    }

    const post = await publicacion.findByPk(req.params.id);

    if (!post || post.eliminada) {
      return res.status(404).json({ message: "Publicacion no encontrada." });
    }
    if (post.UsuarioId !== req.session.usuario.id) {
      return res.status(403).json({
        message: "No tenes los permisos para borrar esta publicacion.",
      });
    }

    post.eliminada = true;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Publicacion borrada",
    });
  } catch (error) {
    console.error("Error al borrar la publicacion", error);
    return res.status(500).json({ message: "Error" });
  }
});

newPubli.post("/p/:id/editar_publicacion", async (req, res) => {
  try {
    if (!req.session?.usuario) {
      return res.status(401).json({ message: "Tenes que iniciar sesion." });
    }

    const post = await publicacion.findByPk(req.params.id);

    if (!post || post.eliminada) {
      return res.status(404).json({ message: "Publicacion no encontrada." });
    }
    if (post.UsuarioId !== req.session.usuario.id) {
      return res.status(403).json({
        message: "No tenes los permisos para editar esta publicacion.",
      });
    }

    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();

    if (title.length < 3) {
      return res
        .status(400)
        .json({ message: "El título debe tener al menos 3 caracteres." });
    }
    if (title.length > 50) {
      return res
        .status(400)
        .json({ message: "El título no puede superar los 50 caracteres." });
    }
    if (description.length > 255) {
      return res.status(400).json({
        message: "La descripción no puede superar los 255 caracteres.",
      });
    }
    const denunciada = await DenunciaImagen.count({
      where: { estado: "pendiente" },
      include: [
        { model: Imagen, where: { publicacionId: id }, required: true },
      ],
    });
    if (denunciada > 0) {
      return res
        .status(403)
        .json({ error: "Publicación denunciada: no se puede modificar" });
    }

    post.title = title;
    post.description = description;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Publicacion editada correctamente",
    });
  } catch (error) {
    console.error("Error al editar la publicacion", error);
    return res.status(500).json({ message: "Error" });
  }
});

export default newPubli;
