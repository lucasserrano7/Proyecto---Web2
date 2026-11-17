import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Seguidores extends Model {}

Seguidores.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seguidor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    seguido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
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
    indexes: [
      { unique: true, fields: ["seguidor_id", "seguido_id"] }
    ],
  },
  {
    sequelize,
    modelName: "seguidor",
    tableName: "seguidores",
    createdAt: true,
    deletedAt: true,
  },
);

export default Seguidores;