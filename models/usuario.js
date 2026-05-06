import { Model, DataTypes } from "sequelize";
import sequelize from "../db/config.js";

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
    },
    email: {
      type: DataTypes.STRING, // 255
      allowNull: false,
      unique: true,
  },
  phone: {
    type: DataTypes.STRING,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
  },
  avatar: {
    type: DataTypes.BLOB,
  },
    },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Usuario',
    tableName: 'usuarios',
    createdAt: true,
    deletedAt: true,
    // We need to choose the model name
  },
);

export default User;

// user
// id not null auntoincremental
// firstname notnull varchar 50
// lastname
// email not null varchar 255
// birthDate date
// -- auditoria
//createdAt
// deletedAt => null || date
