import { Model,  DataTypes } from "sequelize";
import sequelize from "./config.js";

export class denunciaUsuario extends Model {}

denunciaUsuario.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  contenido: {
    type: DataTypes.STRING(255),
    allowNull: false,
},
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  motivo: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: "denuncia_usuario",
  tableName: "denuncias_usuarios",
  createdAt: true,
  deletedAt: true,
});