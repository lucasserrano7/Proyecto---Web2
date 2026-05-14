import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class seguidores extends Model {}

seguidores.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seguidor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seguido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "seguidor",
    tableName: "seguidores",
    createdAt: true,
    deletedAt: true,
  },
);
