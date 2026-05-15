import sequelize from "./models/config.js";
import "./models/usuario.js";
import "dotenv/config";
import express from "express";
import pug from "pug";
import "./models/sync.js";
import { connectDatabase } from "./models/sync.js";
import { publicacion } from "./models/publicacion.js";
import { Usuario } from "./models/usuario.js";
import { notificacion } from "./models/notificacion.js";
import RegyLogin from "./controller/RegYLogin.js"

// CONSTANTES
const app = express();
const PORT = process.env.PORT;

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
//MOTOR DE PLANTILLAS
app.set("view engine", "pug");
app.set("views", "./views");
app.use(RegyLogin);

//RUTAS
app.get("/index", (req, res) => {
  res.render("index");
});
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/iniciosSesion", (req, res) => {
  res.render("iniciosSesion");
});
app.get("/notis", (req, res) => {
  res.render("notis");
});
app.get("/user", (req, res) => {
  res.render("user");
});
app.get("/p", (req, res) => {
  res.render("nuevaPubli");
});


// controladores
app.post("/p", async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    const receptor_id = 1;

    const nuevaPublicacion = await publicacion.create({
      title: titulo,
      description: descripcion,
      comments_allowed: true,
      UsuarioId: receptor_id,
    });
    await notificacion.create({
      titulo: "Nueva publicación",
      mensaje: `Sesubio la publicaion "${titulo}" correctamente`,
      fecha: new Date(),
      leida: false,
      link_: `/p/${nuevaPublicacion.id}`,
      UsuarioId: receptor_id,
    });
    console.log("publicacion y notificacion creada");
    res.redirect(`/p/${nuevaPublicacion.id}`);
  }catch(err){
    console.error(err);
    res.status(500).send("fallo");
  }});
// CONEXION A BASE DE DATOS
connectDatabase().then(() => {
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
