import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class Etiquetas extends Model { }

Etiquetas.init(
    {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "Etiquetas",
        tableName: "etiquetas",
        createdAt: true,
        deletedAt: true,
    }

);