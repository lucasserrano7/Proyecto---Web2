import { Model, DataTypes, Sequelize } from "sequelize";
import sequelize from "./config.js";

export class Compra extends Model {}

Compra.init(
  {
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "compra",
    tableName: "compras",
    createdAt: true,
    deletedAt: true,
  },
);