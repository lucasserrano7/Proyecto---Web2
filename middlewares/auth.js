export function authMiddleware(req, res, next) {
  const usuarioLogeado = req.app.locals.usuarioLogeado;

  const rutasProtegidas = ["/user", "/p", "/notis", "/welcome"];
  const necesiraLogin = rutasProtegidas.some((ruta) =>
    req.path.startsWith(ruta),
  );
  if (necesiraLogin && !usuarioLogeado) {
    return res.redirect("/registro");
  }
  return next();
}
