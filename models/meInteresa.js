import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class MeInteresa extends Model {}


MeInteresa.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "MeInteresa",
    tableName: "meInteresa",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
