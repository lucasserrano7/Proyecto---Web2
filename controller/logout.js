import express from "express";
import session from "express-session";
import {Usuario} from "../models/usuario.js";

const logout = express.Router();

logout.get("/logout", async (req, res) => {
  try {
    if (req.session.usuario) {
        const usuarioId = req.session.usuario.id;
        await Usuario.update({ online: false }, { where: { id: usuarioId } });
        req.session.destroy((err) => {
            if (err) {
                console.error("Error al destruir la sesión:", err);
                return res.status(500).send("Error al cerrar sesión.");
            }
            res.clearCookie("connect.sid");

            return res.redirect("/welcome");
        });
    } else {
            return res.redirect("/welcome");
    }
    } catch (error) {
        console.error("Error al actualizar el estado del usuario:", error);
        res.status(500).send("Error al cerrar sesión.");
    }
});

export default logout;