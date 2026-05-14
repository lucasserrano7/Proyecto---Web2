import sequelize from "./config.js";
import { Coleccion } from "./coleccion.js";
import { Comentario } from "./comentario.js";
import { Compra } from "./compra.js";
import { denunciaComentario } from "./denunciaComentario.js";
import { denunciaPublicacion } from "./denunciaPublicacion.js";
import { denunciaUsuario } from "./denunciaUsuario.js";
import { Etiquetas } from "./etiquetas.js";
import { Favoritos } from "./favoritos.js";
import { Imagen } from "./Imagen.js";
import { notificacion } from "./notificacion.js";
import { publicacion } from "./publicacion.js";
import { seguidores } from "./seguidor.js";
import { Usuario } from "./usuario.js";
import { Validador } from "./validador.js";
import { Valoracion } from "./valoracion.js";
import { combineTableNames } from "sequelize/lib/utils";

// To create a One-To-One relationship, the hasOne and belongsTo associations are used together;
// To create a One-To-Many relationship, the hasMany and belongsTo associations are used together;
// To create a Many-To-Many relationship, two belongsToMany calls are used together

Usuario.hasMany(publicacion);
publicacion.belongsTo(Usuario);

Usuario.belongsToMany(Usuario, {
  as: "Seguidos",
  through: seguidores,
  foreignKey: "user_id",
  otherKey: "seguido_id",
});
Usuario.belongsToMany(Usuario, {
  as: "Seguidores",
  through: seguidores,
  foreignKey: "seguido_id",
  otherKey: "user_id",
});

Usuario.hasMany(Coleccion);
Coleccion.belongsTo(Usuario);

Usuario.hasMany(denunciaUsuario);
denunciaUsuario.belongsTo(Usuario);

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

publicacion.hasMany(denunciaPublicacion);
denunciaPublicacion.belongsTo(publicacion);

publicacion.hasMany(Imagen);
Imagen.belongsTo(publicacion);

publicacion.hasMany(Comentario);
Comentario.belongsTo(publicacion);

publicacion.hasMany(Etiquetas);
Etiquetas.belongsTo(publicacion);

publicacion.hasMany(Validador);
Validador.belongsTo(publicacion);

Comentario.hasMany(denunciaComentario);
denunciaComentario.belongsTo(Comentario);

Imagen.hasMany(Valoracion);
Valoracion.belongsTo(Imagen);

Usuario.hasMany(notificacion);
notificacion.belongsTo(Usuario);



export async function connectDatabase() {
  try {
    await sequelize.authenticate(); // testear la conexión
    console.log(" [+] Conexión a la BdD establecida.");

    // await sequelize.sync({ alter: true}); // sincronizar los modelos con la BdD
    // console.log(" [+] sincronizado de modelos.");
  } catch (error) {
    console.error(" [x] No se pudo conectar a la BdD:", error);
    throw error;
  }
}
