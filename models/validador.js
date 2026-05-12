import { DataTypes, Model } from 'sequelize';
import sequelize from "./config.js";

export class Validador extends Model {}

Validador.init(
    {
        id_validador: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pendiente',
        },
    },
    {
        sequelize,
        modelName: 'Validador',
    }
);