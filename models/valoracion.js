import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Valoracion extends Model {}

Valoracion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    puntaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
 
  },
  {
    sequelize,
    modelName: "Valoracion",
    tableName: "valoraciones",
       indexes:[
      {unique: true, fields: ['UsuarioId', 'ImagenId']},
      {fields: ['ImagenId'],
    }],
    createdAt: true,
    deletedAt: true,
  },
);
