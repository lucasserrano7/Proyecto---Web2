import sequelize from "./models/config.js";
import "./models/usuario.js";
import "dotenv/config";
import express from "express";
import pug from "pug";
import "./models/sync.js";
import { connectDatabase } from "./models/sync.js";

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
