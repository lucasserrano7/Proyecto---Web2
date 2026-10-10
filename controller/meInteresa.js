import express from "express";
import { MeInteresa } from "../models/meInteresa.js";
import { Mensaje } from "../models/mensaje.js";
import { Usuario } from "../models/usuario.js";
import { publicacion } from "../models/publicacion.js";
import { Imagen } from "../models/Imagen.js";
import { notificacion } from "../models/notificacion.js";
import { authMiddleware } from "../middlewares/auth.js";
import { Op } from "sequelize";

const meInteresaRt = express.Router();

function formatearImagen(campo) {
  if (!campo) return null;
  try {
    const buf = Buffer.isBuffer(campo) ? campo : Buffer.from(campo.data || campo);
    return "data:image/webp;base64," + buf.toString("base64");
  } catch (error) {
    return null;
  }
}

meInteresaRt.post("/:publicacionId", authMiddleware, async (req, res) => {
  try {
    const compradorId = req.session.usuario.id;
    const publicacionId = req.params.publicacionId;

    const post = await publicacion.findByPk(publicacionId);
    if (!post) {
      return res.status(404).json({ message: "Publicación no encontrada." });
    }

    const vendedorId = post.UsuarioId;

    if (vendedorId === compradorId) {
      return res.status(400).json({ message: "No podés marcar interés en tu propia publicación." });
    }

    const yaExiste = await MeInteresa.findOne({
      where: {
        comprador_id: compradorId,
        publicacion_id: publicacionId,
      },
    });

    if (yaExiste) {
      return res.status(200).json({
        success: true,
        message: "Ya marcaste interés en esta publicación. Podés ver la conversación en tus mensajes.",
        conversacionId: yaExiste.id,
        yaExistia: true,
      });
    }

    const interes = await MeInteresa.create({
      comprador_id: compradorId,
      vendedor_id: vendedorId,
      publicacion_id: publicacionId,
    });

    const comprador = await Usuario.findByPk(compradorId, {
      attributes: ["username"],
    });

    await notificacion.create({
      titulo: "¡Alguien está interesado!",
      mensaje: `@${comprador.username} está interesado en tu publicación "${post.title}"`,
      fecha: new Date(),
      leida: false,
      link_: `/me-interesa/chat/${interes.id}`,
      UsuarioId: vendedorId,
    });

    return res.status(201).json({
      success: true,
      message: "¡Interés registrado! Se notificó al autor. Podés chatear desde tus mensajes.",
      conversacionId: interes.id,
      yaExistia: false,
    });
  } catch (error) {
    console.error("Error al registrar interés:", error);
    return res.status(500).json({ message: "Error al registrar el interés." });
  }
});

meInteresaRt.get("/conversaciones", authMiddleware, async (req, res) => {
  try {
    const userId = req.session.usuario.id;

    const conversaciones = await MeInteresa.findAll({
      where: {
        [Op.or]: [{ comprador_id: userId }, { vendedor_id: userId }],
      },
      include: [
        {
          model: Usuario,
          as: "Comprador",
          attributes: ["id", "username", "foto_de_perfil"],
        },
        {
          model: Usuario,
          as: "Vendedor",
          attributes: ["id", "username", "foto_de_perfil"],
        },
        {
          model: publicacion,
          attributes: ["id", "title"],
          include: [{ model: Imagen, attributes: ["id", "url"] }],
        },
        {
          model: Mensaje,
          attributes: ["id"],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    const chats = conversaciones.map((conv) => {
      const c = conv.toJSON();
      const esComprador = c.comprador_id === userId;
      const otroUsuario = esComprador ? c.Vendedor : c.Comprador;

      return {
        id: c.id,
        rol: esComprador ? "Comprador" : "Vendedor",
        otroUsuario: {
          id: otroUsuario?.id,
          username: otroUsuario?.username,
          fotoPerfil: formatearImagen(otroUsuario?.foto_de_perfil),
        },
        publicacion: {
          id: c.publicacion?.id,
          title: c.publicacion?.title,
          miniatura: formatearImagen(c.publicacion?.Imagens?.[0]?.url),
        },
        totalMensajes: c.Mensajes ? c.Mensajes.length : 0,
        updatedAt: c.updated_at || c.updatedAt,
      };
    });

    res.render("mensajes", {
      usuario: req.session.usuario,
      conversaciones: chats,
    });
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).render("error", {
      titulo: "Error",
      mensaje: "No se pudieron cargar las conversaciones.",
    });
  }
});

meInteresaRt.get("/chat/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.session.usuario.id;
    const conversacionId = req.params.id;

    const conv = await MeInteresa.findByPk(conversacionId, {
      include: [
        { model: Usuario, as: "Comprador", attributes: ["id", "username", "foto_de_perfil"] },
        { model: Usuario, as: "Vendedor", attributes: ["id", "username", "foto_de_perfil"] },
        {
          model: publicacion,
          attributes: ["id", "title"],
          include: [{ model: Imagen, attributes: ["id", "url"] }],
        },
        {
          model: Mensaje,
          separate: true,
          order: [["createdAt", "ASC"]],
          include: [{ model: Usuario, as: "Emisor", attributes: ["id", "username"] }],
        },
      ],
    });

    if (!conv) {
      return res.status(404).render("error", { titulo: "Chat no encontrado", mensaje: "La conversación no existe." });
    }

    if (conv.comprador_id !== userId && conv.vendedor_id !== userId) {
      return res.status(403).render("error", { titulo: "Acceso denegado", mensaje: "No tenés acceso a esta conversación." });
    }

    await Mensaje.update(
      { leido: true },
      {
        where: {
          conversacion_id: conversacionId,
          emisor_id: { [Op.ne]: userId },
          leido: false,
        },
      }
    );

    const listaConv = await MeInteresa.findAll({
      where: {
        [Op.or]: [{ comprador_id: userId }, { vendedor_id: userId }],
      },
      include: [
        { model: Usuario, as: "Comprador", attributes: ["id", "username", "foto_de_perfil"] },
        { model: Usuario, as: "Vendedor", attributes: ["id", "username", "foto_de_perfil"] },
        {
          model: publicacion,
          attributes: ["id", "title"],
          include: [{ model: Imagen, attributes: ["id", "url"] }],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    const conversacionesSidebar = listaConv.map((c) => {
      const json = c.toJSON();
      const esComprador = json.comprador_id === userId;
      const otro = esComprador ? json.Vendedor : json.Comprador;

      return {
        id: json.id,
        otroUsername: otro?.username || "Usuario",
        tituloPublicacion: json.publicacion?.title || "Publicación",
        miniatura: formatearImagen(json.publicacion?.Imagens?.[0]?.url),
      };
    });

    const esComprador = conv.comprador_id === userId;
    const otroUsuario = esComprador ? conv.Vendedor : conv.Comprador;

    const mensajes = (conv.Mensajes || []).map((m) => ({
      id: m.id,
      texto: m.texto,
      emisor_id: m.emisor_id,
      Emisor: { username: m.Emisor?.username || "Usuario" },
      emisor: m.Emisor?.username || "Usuario",
      esMio: m.emisor_id === userId,
      fecha: m.createdAt,
    }));

    res.render("chat", {
      usuario: req.session.usuario,
      conversacionId: conv.id,
      otroUsuario: {
        id: otroUsuario?.id,
        username: otroUsuario?.username || "Usuario",
        foto: formatearImagen(otroUsuario?.foto_de_perfil),
      },
      publicacion: {
        id: conv.publicacion?.id,
        title: conv.publicacion?.title || "Publicación",
        miniatura: formatearImagen(conv.publicacion?.Imagens?.[0]?.url),
      },
      mensajes,
      conversaciones: conversacionesSidebar,
      rol: esComprador ? "Comprador" : "Vendedor",
    });
  } catch (error) {
    console.error("Error al cargar chat:", error);
    res.status(500).render("error", { titulo: "Error", mensaje: "No se pudo cargar el chat." });
  }
});

meInteresaRt.post("/chat/:id/enviar", authMiddleware, async (req, res) => {
  try {
    const userId = req.session.usuario.id;
    const conversacionId = req.params.id;
    const { texto } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío." });
    }

    const conv = await MeInteresa.findByPk(conversacionId);
    if (!conv) {
      return res.status(404).json({ message: "Conversación no encontrada." });
    }

    if (conv.comprador_id !== userId && conv.vendedor_id !== userId) {
      return res.status(403).json({ message: "No tenés acceso a esta conversación." });
    }

    const mensaje = await Mensaje.create({
      texto: texto.trim(),
      emisor_id: userId,
      conversacion_id: conversacionId,
    });

    await MeInteresa.update(
      { updated_at: new Date() },
      { where: { id: conversacionId } }
    );

    const emisor = await Usuario.findByPk(userId, { attributes: ["username"] });

    return res.status(201).json({
      success: true,
      mensaje: {
        id: mensaje.id,
        texto: mensaje.texto,
        emisor: emisor?.username || "Usuario",
        esMio: true,
        fecha: mensaje.createdAt,
      },
    });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    return res.status(500).json({ message: "Error al enviar el mensaje." });
  }
});

export default meInteresaRt;
export { meInteresaRt };