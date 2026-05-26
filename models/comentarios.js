import { Model,DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Comentarios extends Model {}

Comentarios.init(
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
    texto: {
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

export default Comentarios;