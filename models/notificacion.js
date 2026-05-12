import { Model,  DataTypes } from "sequelize";
import sequelize from "./config.js";

export class notificacion extends Model {}

notificacion.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },    
  comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  valoracion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
},
  denuncia_publicacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  denuncia_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  denuncia_comentario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "notificacion",
  tableName: "notificaciones",
  createdAt: true,
  deletedAt: true,
});