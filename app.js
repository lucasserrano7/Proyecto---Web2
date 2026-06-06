import sequelize from "./models/config.js";
import "./models/usuario.js";
import "dotenv/config";
import express from "express";
import session from "express-session";
import pug from "pug";
import path from "path";
import "./models/sync.js";
import { connectDatabase } from "./models/sync.js";
import { publicacion } from "./models/publicacion.js";
import { Usuario } from "./models/usuario.js";
import { Imagen } from "./models/Imagen.js";
import { Valoracion } from "./models/valoracion.js";
import { notificacion } from "./models/notificacion.js";
import RegyLogin from "./controller/RegYLogin.js";
import newPubli from "./controller/newPubli.js";
import newComentarios from "./controller/comentarios.js";
import valoraciones from "./controller/valoraciones.js";
import seguidoresRt from "./controller/seguidores.js";
import perfil from "./controller/perfil.js";
import logout from "./controller/logout.js";
import { buscador } from "./controller/buscador.js";
import { authMiddleware } from "./middlewares/auth.js";
import { config } from "dotenv";

// CONSTANTES
const app = express();
const PORT = process.env.PORT;
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // cunado se sube al servidor poner true
    maxAge: 24 * 60 * 60 * 1000, //  un dia
    httpOnly: true,
    sameSite: 'lax', //SSR
  },
}));

// MIDDLEWARES
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
//MOTOR DE PLANTILLAS
app.set("view engine", "pug");
app.set("views", path.join(process.cwd()), "./views");


app.use((req, res, next)=>{
  res.locals.usuario = req.session.usuario || null;
  next();
});

app.use(RegyLogin);
app.use(valoraciones);
//RUTAS PUBLICAS
app.use('/', newPubli);
app.get("/", (req, res) => {
  if(req.session && req.session.usuario){
  res.render("index", { usuario: req.session.usuario });
  } else {
    res.render("bienvenida");
  }
});
// En cualquier ruta o controlador
app.get('/test', (req, res) => {
  console.log('DB_SSL:', process.env.DB_SSL);
  res.json({ db_ssl: process.env.DB_SSL });
});

app.get("/iniciosSesion", (req, res) => {
  res.render("iniciosSesion");
});
app.get("/welcome", (req, res) => {
  res.render("welcome");
});
app.get('/T&C', (req, res) => {
  res.render('T&C', {usuario: req.session ? req.session.usuario : null});
});
app.get("/profile", (req, res) => {
  if (req.session && req.session.usuario) {
    return res.redirect(`/user/${req.session.usuario.id}`);
  }
  res.redirect("/iniciosSesion");
});
app.use('/', perfil);

app.get("/explorar", buscador);

//RUTAS PRIVADAS (Despues de inicio de sesion)
app.use(authMiddleware);
app.use('/seguidores', seguidoresRt);
app.get("/notis", (req, res) => {
  res.render("notis");
});
app.get("/p", (req, res) => {
  res.render("nuevaPubli");
});
app.use('/comentarios' ,newComentarios);
app.use(logout);


// CONEXION A BASE DE DATOS
connectDatabase()
  .then(() => {
    app.listen(PORT, (err) => {
      if (err) {
        console.error(" [X] Error al iniciar el servidor: ", err);
      }
      console.log(` [✓] Servidor corriendo en el puerto:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(" [X] Error al conectar a la base de datos: ", err);
  });

export default app;
  // controladores
// app.post("/p", async (req, res) => {
//   try {
//     const { titulo, descripcion } = req.body;

//     const nuevaPublicacion = await publicacion.create({
//       title: titulo,
//       description: descripcion,
//       comments_allowed: true,
//       UsuarioId: receptor_id,
//     });
//     
//     console.log("publicacion y notificacion creada");
//     res.redirect(`/p/${nuevaPublicacion.id}`);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("fallo");
//   }
// });