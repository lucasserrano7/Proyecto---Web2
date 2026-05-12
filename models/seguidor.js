import { Model, DataTypes } from "sequelize";
import sequelize from "./config.js";

export class seguidores extends Model { }

seguidores.init({
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    seguido_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    seguidor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true,
    },

}, {
    sequelize,
    modelName: "seguidor",
    tableName: "seguidores",
    createdAt: true,
    deletedAt: true,
});