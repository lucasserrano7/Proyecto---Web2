import sequelize from "./config.js";
import { Coleccion } from "./coleccion.js";
import { Comentarios } from "./comentarios.js";
import { Compra } from "./compra.js";
import { denunciaComentario } from "./denunciaComentario.js";
import { denunciaPublicacion } from "./denunciaPublicacion.js";
import { denunciaUsuario } from "./denunciaUsuario.js";
import { Etiquetas } from "./etiquetas.js";
import { Favoritos } from "./favoritos.js";
import { Imagen } from "./Imagen.js";
import { notificacion } from "./notificacion.js";
import { publicacion } from "./publicacion.js";
import { Seguidores } from "./seguidor.js";
import { Usuario } from "./usuario.js";
import { Valoracion } from "./valoracion.js";
import { MeInteresa } from "./meInteresa.js";
import { Mensaje } from "./mensaje.js";
import { combineTableNames } from "sequelize/lib/utils";

// To create a One-To-One relationship, the hasOne and belongsTo associations are used together;
// To create a One-To-Many relationship, the hasMany and belongsTo associations are used together;
// To create a Many-To-Many relationship, two belongsToMany calls are used together

Usuario.hasMany(publicacion);
publicacion.belongsTo(Usuario);

Usuario.belongsToMany(Usuario, {
  as: "Seguidos",
  through: Seguidores,
  foreignKey: "user_id",
  otherKey: "seguido_id",
});
Usuario.belongsToMany(Usuario, {
  as: "Seguidores",
  through: Seguidores,
  foreignKey: "seguido_id",
  otherKey: "user_id",
});

Usuario.hasMany(Coleccion);
Coleccion.belongsTo(Usuario);

Usuario.hasMany(denunciaUsuario, { foreignKey: "denunciante_id" });
denunciaUsuario.belongsTo(Usuario, {
  foreignKey: "denunciante_id",
  as: "Denunciante",
});

Usuario.hasMany(denunciaComentario, { foreignKey: "denunciante_id" });
denunciaComentario.belongsTo(Usuario, {
  foreignKey: "denunciante_id",
  as: "Denunciante",
});

Usuario.hasMany(denunciaPublicacion, { foreignKey: "denunciante_id" });
denunciaPublicacion.belongsTo(Usuario, {
  foreignKey: "denunciante_id",
  as: "Denunciante",
});

Usuario.belongsToMany(publicacion, {
  as: "favoritosGuardados",
  through: Favoritos,
});
publicacion.belongsToMany(Usuario, {
  as: "usuariosQueGuardaronEnFavoritos",
  through: Favoritos,
});

Usuario.belongsToMany(publicacion, { as: "Compras", through: Compra });
publicacion.belongsToMany(Usuario, { as: "Compradores", through: Compra });

Coleccion.belongsToMany(publicacion, {
  through: "colecciones_publicaciones",
  foreignKey: "coleccion_id",
});
publicacion.belongsToMany(Coleccion, {
  through: "colecciones_publicaciones",
  foreignKey: "publicacion_id",
});

publicacion.hasMany(denunciaPublicacion, { foreignKey: "publicacion_id" });
denunciaPublicacion.belongsTo(publicacion, {
  foreignKey: "publicacion_id",
  as: "PubliDenunciada",
});

publicacion.hasMany(Imagen);
Imagen.belongsTo(publicacion);

Imagen.hasMany(Comentarios);
Comentarios.belongsTo(Imagen);

Usuario.hasMany(Comentarios);
Comentarios.belongsTo(Usuario);

publicacion.belongsToMany(Etiquetas, { through: "etiquetas_publicacion" });
Etiquetas.belongsToMany(publicacion, { through: "etiquetas_publicacion" });

Comentarios.hasMany(denunciaComentario);
denunciaComentario.belongsTo(Comentarios);

Imagen.hasMany(Valoracion);
Valoracion.belongsTo(Imagen);

Valoracion.belongsTo(Usuario);
Usuario.hasMany(Valoracion);

Usuario.hasMany(notificacion);
notificacion.belongsTo(Usuario);

Usuario.hasMany(MeInteresa, { foreignKey: "comprador_id", as: "Intereses" });
MeInteresa.belongsTo(Usuario, { foreignKey: "comprador_id", as: "Comprador" });

Usuario.hasMany(MeInteresa, { foreignKey: "vendedor_id", as: "Ventas" });
MeInteresa.belongsTo(Usuario, { foreignKey: "vendedor_id", as: "Vendedor" });

publicacion.hasMany(MeInteresa, { foreignKey: "publicacion_id" });
MeInteresa.belongsTo(publicacion, { foreignKey: "publicacion_id" });

MeInteresa.hasMany(Mensaje, { foreignKey: "conversacion_id" });
Mensaje.belongsTo(MeInteresa, { foreignKey: "conversacion_id" });

Usuario.hasMany(Mensaje, { foreignKey: "emisor_id" });
Mensaje.belongsTo(Usuario, { foreignKey: "emisor_id", as: "Emisor" });

export async function connectDatabase() {
  try {
    await sequelize.authenticate(); // testear la conexión
    console.log(" [+] Conexión a la BdD establecida.");

    await sequelize.sync({ alter  : true }); // sincronizar los modelos con la BdD
    console.log(" [+] sincronizado de modelos.");
  } catch (error) {
    console.error(" [x] No se pudo conectar a la BdD:", error);
    throw error;
  }
}
