import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Mensaje extends Model {}

Mensaje.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    texto: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Mensaje",
    tableName: "mensajes",
    createdAt: true,
    updatedAt: false,
  }
);
