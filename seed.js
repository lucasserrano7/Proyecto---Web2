import bcrypt from "bcrypt";
import Jimp from "jimp";
import { Usuario } from "./models/usuario.js";
import { publicacion } from "./models/publicacion.js";
import { Imagen } from "./models/Imagen.js";
import { Comentarios } from "./models/comentarios.js";
import { Valoracion } from "./models/valoracion.js";
import { Etiquetas } from "./models/etiquetas.js";
import { notificacion } from "./models/notificacion.js";
import { DenunciaImagen } from "./models/denunciaImagen.js";
import { denunciaComentario } from "./models/denunciaComentario.js";
import { Coleccion } from "./models/coleccion.js";
import Seguidores from "./models/seguidor.js";


const CLAVE = "Fotaza123!";

async function foto(color1, color2, texto) {
  const img = new Jimp(640, 420, color1);
  img.scan(0, 0, 640, 420, function (x, y, idx) {
    const t = y / 420;
    const c1 = Jimp.intToRGBA(color1);
    const c2 = Jimp.intToRGBA(color2);
    this.bitmap.data[idx] = c1.r + (c2.r - c1.r) * t;
    this.bitmap.data[idx + 1] = c1.g + (c2.g - c1.g) * t;
    this.bitmap.data[idx + 2] = c1.b + (c2.b - c1.b) * t;
    this.bitmap.data[idx + 3] = 255;
  });
  const fuente = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  img.print(fuente, 20, 360, texto);
  return await img.quality(70).getBufferAsync(Jimp.MIME_JPEG);
}

async function crearPubli({ autor, title, description, tags, fotos, comentarios = true }) {
  const tieneCopy = fotos.some((f) => f.copyright);
  const p = await publicacion.create({
    title, description, tieneCopy,
    estado: true, eliminada: false,
    UsuarioId: autor.id,
  });
  const imagenes = [];
  for (const f of fotos) {
    imagenes.push(
      await Imagen.create({
        publicacionId: p.id,
        url: await foto(f.c1, f.c2, f.texto || title),
        tipo: "image/jpeg",
        copyright: !!f.copyright,
        marcaAgua: !!f.copyright,
        texto_personalizado: f.copyright ? f.marca || `@${autor.username}` : null,
        comments_allowed: comentarios,
        promedio: 0,
      }),
    );
  }
  for (const nombre of tags) {
    const [e] = await Etiquetas.findOrCreate({ where: { nombre } });
    await p.addEtiquetas(e);
  }
  return { p, imagenes };
}

async function valorar(imagen, votos) {
  // votos = [[usuario, puntaje], ...]
  for (const [u, puntaje] of votos) {
    await Valoracion.create({ puntaje, UsuarioId: u.id, ImagenId: imagen.id });
  }
  const prom = votos.reduce((a, [, n]) => a + n, 0) / votos.length;
  await imagen.update({ promedio: Number(prom.toFixed(1)) });
}

console.log(" [+] Cargando datos de prueba...");
const hash = await bcrypt.hash(CLAVE, 10);

// ---------- Usuarios----------
const mk = (username, email, extra = {}) =>
  Usuario.create({
    username, email, password: hash,
    rol: "usuario", estado: true, Nro_publicaciones_bajadas: 0, ofertas: false,
    ...extra,
  });

const validador = await mk("validador", "validador@fotaza.com", { rol: "validador" });
const autor = await mk("autor", "autor@fotaza.com");
const ana = await mk("ana", "ana@fotaza.com");
const beto = await mk("beto", "beto@fotaza.com");
const carla = await mk("carla", "carla@fotaza.com");
const dario = await mk("dario", "dario@fotaza.com");
const suspendido = await mk("suspendido", "suspendido@fotaza.com", {
  estado: false, Nro_publicaciones_bajadas: 3,
});

// ---------- Publicaciones----------
const paisaje = await crearPubli({
  autor, title: "Atardecer en la montaña",
  description: "Foto tomada con teleobjetivo al final del día.",
  tags: ["paisaje", "atardecer", "montaña"],
  fotos: [
    { c1: 0xff7e5fff, c2: 0x2b1055ff, texto: "Atardecer 1" },
    { c1: 0xfeb47bff, c2: 0x3a1c71ff, texto: "Atardecer 2" },
  ],
});
const retrato = await crearPubli({
  autor, title: "Retrato en estudio",
  description: "Sesión con luz natural. Foto protegida.",
  tags: ["retrato", "estudio"],
  fotos: [{ c1: 0x606c88ff, c2: 0x3f4c6bff, texto: "Retrato", copyright: true, marca: "@autor" }],
});
const mar = await crearPubli({
  autor: ana, title: "Mar en calma",
  description: "Larga exposición en la costa.",
  tags: ["mar", "paisaje"],
  fotos: [{ c1: 0x2193b0ff, c2: 0x6dd5edff, texto: "Mar" }],
});
const ciudad = await crearPubli({
  autor: beto, title: "Ciudad de noche",
  description: "Luces de la avenida principal.",
  tags: ["ciudad", "noche"],
  fotos: [
    { c1: 0x141e30ff, c2: 0x243b55ff, texto: "Ciudad 1" },
    { c1: 0x0f2027ff, c2: 0x2c5364ff, texto: "Ciudad 2" },
  ],
});
const flores = await crearPubli({
  autor: carla, title: "Flores de primavera",
  description: "Macro de flores del jardín.",
  tags: ["naturaleza", "flores"],
  fotos: [{ c1: 0xf093fbff, c2: 0xf5576cff, texto: "Flores" }],
  comentarios: false,
});
const polemica = await crearPubli({
  autor: dario, title: "Foto polémica",
  description: "Publicación con varias denuncias para probar al validador.",
  tags: ["prueba"],
  fotos: [{ c1: 0x434343ff, c2: 0x000000ff, texto: "Denunciada" }],
});
const dudosa = await crearPubli({
  autor: carla, title: "Publicación dudosa",
  description: "Tiene solo 2 denuncias.",
  tags: ["prueba"],
  fotos: [{ c1: 0x7f7fd5ff, c2: 0x86a8e7ff, texto: "Dudosa" }],
});

// ---------- Valoracione ----------
await valorar(paisaje.imagenes[0], [[ana, 5], [beto, 5], [carla, 4], [dario, 5]]);
await valorar(mar.imagenes[0], [[autor, 5], [beto, 4], [carla, 5]]);
await valorar(ciudad.imagenes[0], [[autor, 3], [ana, 4]]);
await valorar(flores.imagenes[0], [[ana, 2]]);

// ---------- Comentarios   ----------
const c1 = await Comentarios.create({ texto: "¡Qué colores increíbles!", fecha: new Date(), ImagenId: paisaje.imagenes[0].id, UsuarioId: ana.id });
const c2 = await Comentarios.create({ texto: "Me encanta la composición.", fecha: new Date(), ImagenId: paisaje.imagenes[0].id, UsuarioId: beto.id });
await Comentarios.create({ texto: "Muy buena técnica.", fecha: new Date(), ImagenId: mar.imagenes[0].id, UsuarioId: autor.id });
const spam = await Comentarios.create({ texto: "Comprá seguidores baratos en mi web", fecha: new Date(), ImagenId: paisaje.imagenes[0].id, UsuarioId: dario.id });
// Comentarios cerrados en la 2ª foto del atardecer
await paisaje.imagenes[1].update({ comments_allowed: false });

// ---------- Seguidores ----------
const seg = (a, b) => Seguidores.create({ seguidor_id: a.id, seguido_id: b.id, fecha_inicio: new Date() });
await seg(ana, autor); await seg(beto, autor); await seg(carla, autor);
await seg(autor, ana); await seg(autor, beto); await seg(ana, beto);

// ---------- Colecciones (privadas) ----------
const col = await Coleccion.create({ titulo: "Paisajes", categoria: "Inspiración", publico: false, UsuarioId: ana.id });
await col.addPublicacion(paisaje.p);
await col.addPublicacion(ciudad.p);
await Coleccion.create({ titulo: "Ideas", categoria: "Ideas", publico: false, UsuarioId: ana.id });

// ---------- Denuncias de imágenes -------
for (const u of [ana, beto, carla, autor]) {
  await DenunciaImagen.create({
    motivo: "Contenido inapropiado",
    descripcion: "No corresponde con las normas de la comunidad.",
    ImagenId: polemica.imagenes[0].id, UsuarioId: u.id,
  });
}
for (const u of [ana, beto]) {
  await DenunciaImagen.create({
    motivo: "Spam", descripcion: "Parece publicidad.",
    ImagenId: dudosa.imagenes[0].id, UsuarioId: u.id,
  });
}

await denunciaComentario.create({
  motivo: "Spam", description: "Es publicidad.",
  contenido: spam.texto, estado: true,
  denunciante_id: ana.id, comentarioId: spam.id,
});

const noti = (u, titulo, mensaje, link_, leida = false) =>
  notificacion.create({ titulo, mensaje, fecha: new Date(), leida, link_, UsuarioId: u.id });
await noti(autor, "Nuevo Comentario", "@ana comentó tu publicación.", `/p/${paisaje.p.id}`);
await noti(autor, "Nueva Valoración", "@beto valoró tu imagen con 5 estrellas.", `/p/${paisaje.p.id}`);
await noti(autor, "Nuevo Seguidor", "@carla comenzó a seguirte.", `/user/${carla.id}`, true);
await noti(autor, "¡Alguien está interesado!", "@ana está interesada en tu publicación.", `/p/${retrato.p.id}`);

console.log(" [+] Datos de prueba cargados.");
console.log(` [+] Usuarios de prueba (clave: ${CLAVE}): validador, autor, ana, beto, carla, dario, suspendido`);