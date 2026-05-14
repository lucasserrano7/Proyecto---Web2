import { Model,  DataTypes } from "sequelize";
import sequelize from "./config.js";

export class notificacion extends Model {}

notificacion.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  titulo:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  mensaje:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    },
  leida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },  
  link_:{
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: "notificacion",
  tableName: "notificaciones",
  createdAt: true,
  deletedAt: true,
});