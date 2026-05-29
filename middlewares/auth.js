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
      attributes: ["id", 'foto_de_perfil'],
    });
    if (!user) {
      res.render("iniciosSesion");
      return;
    }
    res.locals.usuario = {
      id: user.id,
      perfilPicture: user.foto_de_perfil,
    };
    next();
  } catch (error) {
    console.error('Error al autenticar usuario',error);
  }
};
