import { Model,DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Comentario extends Model {}

Comentario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'comentario',
    tableName: 'comentarios',
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  },
);