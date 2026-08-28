import { Usuario } from "../models/usuario.js";

export const verificarRol = (rolRequerido) =>{
    return (req, res, next)=>{
        const usuario = res.locals.usuario;

        if (usuario && usuario.rol === rolRequerido) {
            return next();
        }

        return res.status(403).render("error", {mensaje: 'Acceso prohibido, no estas autorizado para esto.'});
    }
}