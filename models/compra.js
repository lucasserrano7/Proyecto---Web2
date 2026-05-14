import { Model, DataTypes, Sequelize } from "sequelize";
import sequelize from "./config.js";

export class Compra extends Model {}

Compra.init(
  {},
  {
    sequelize,
    modelName: "compra",
    tableName: "compras",
    createdAt: true,
    deletedAt: true,
  },
);