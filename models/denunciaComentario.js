import { Model,  DataTypes } from "sequelize";
import sequelize from "./config.js";
export class denunciaComentario extends Model {}

denunciaComentario.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },    
  comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contenido: {
    type: DataTypes.STRING(255),
    allowNull: false,
},
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  motivo: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: "denuncia_comentario",
  tableName: "denuncias_comentarios",
  createdAt: true,
  deletedAt: true,
});