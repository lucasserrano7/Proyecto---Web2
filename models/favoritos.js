import { Model, DataTypes, Sequelize } from "sequelize";
import sequelize from "./config.js";

export class Favoritos extends Model {}

Favoritos.init(
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
    modelName: "favoritos",
    tableName: "favoritos",
    createdAt: true,
    deletedAt: true,
  },
);
