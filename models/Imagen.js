import { Model,  DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Imagen extends Model {}

Imagen.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  url: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING(50),
  },
  promedio: {
    type: DataTypes.FLOAT,
  },
  copyright: {
    type: DataTypes.BOOLEAN,
  },
  marcaAgua: {
    type: DataTypes.BOOLEAN,
  },
  texto_personalizado: {
    type: DataTypes.STRING,
  },
      comments_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
}, {
  sequelize,
  modelName: "Imagen",
  tableName: "imagenes",
  createdAt: true,
  deletedAt: true,
});

