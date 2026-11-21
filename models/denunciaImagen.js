import { DataTypes } from "sequelize";
import sequelize from "./config.js";

export const DenunciaImagen = sequelize.define(
  "DenunciaImagen",
  {
    motivo: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: false },
    estado: {
      type: DataTypes.ENUM("pendiente", "desestimada", "aceptada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
  },
  {
    tableName: "denuncias_imagen",
    indexes: [{ unique: true, fields: ["UsuarioId", "ImagenId"] }],
  },
);

