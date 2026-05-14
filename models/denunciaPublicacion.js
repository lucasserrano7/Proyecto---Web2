import { Model,  DataTypes } from "sequelize";
import sequelize from "./config.js";

export class denunciaPublicacion extends Model {}

denunciaPublicacion.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
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
  modelName: "denuncia_publicacion",
  tableName: "denuncias_publicaciones",
  createdAt: true,
  deletedAt: true,
});