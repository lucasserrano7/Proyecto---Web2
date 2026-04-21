const express = require("express");
const pug = require("pug");
// CONSTANTES
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
//MOTOR DE PLANTILLAS
app.set("view engine", "pug");
app.set("views", "./views");

//RUTAS
app.get("/", (req, res) => {
  res.render("layout");
});
app.get("/index", (req, res) => {
  res.render("index");
});

// SERVIDOR
app.listen(PORT, (err) => {
  if (err) {
    console.error("Error al iniciar el servidor: ", err);
  }
  console.log(`Servidor corriendo en el puerto:${PORT}`);
});
