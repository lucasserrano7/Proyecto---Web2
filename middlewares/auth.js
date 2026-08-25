import { Usuario } from "../models/usuario.js";

export async function authMiddleware(req, res, next) {
  const sessionUser = req.session.usuario;
  if (!sessionUser) {
    res.render("iniciosSesion");
    return;
  }
  const userId = Number(sessionUser.id);

  try {
    const user = await Usuario.findByPk(userId, {
      attributes: ["id", 'foto_de_perfil', 'rol', 'estado'],
    });
    if (!user) {
      res.render("iniciosSesion");
      return;
    }

    if (!user.estado) {
      req.session.destroy();
      return res.status(403).render("error", {mensaje: 'Tu cuenta fue suspendida'});
    }
    res.locals.usuario = {
      id: user.id,
      perfilPicture: user.foto_de_perfil,
      rol: user.rol,
    };
    next();
  } catch (error) {
    console.error('Error al autenticar usuario',error);
    return res.status(500).render("error", {mensaje: 'Error en el servidor'});
  }
};
