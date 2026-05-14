import { Model, DataTypes, Sequelize } from "sequelize";
import sequelize from "./config.js";

export class Favoritos extends Model {}

Favoritos.init(
  {},
  {
    sequelize,
    modelName: "favoritos",
    tableName: "favoritos",
    createdAt: true,
    deletedAt: true,
  },
);
