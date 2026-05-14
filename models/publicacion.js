import { Model,DataTypes } from "sequelize";
import sequelize from "./config.js";

export class publicacion extends Model {}

publicacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    comments_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    cantidad_denuncias: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cantidad_valoraciones: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    promedio_valoraciones: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },


  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'publicacion', // We need to choose the model name
    tableName: 'publicaciones',
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  },
);

export default publicacion;