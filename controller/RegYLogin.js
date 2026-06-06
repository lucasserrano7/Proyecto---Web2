import express from "express";
import { Usuario } from "../models/usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const RegYLogin = express.Router();


const clave = process.env.JWT_SECRET || 'fotazaapp' ;

const verificarToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if(token && token.startsWith("Bearer ")){
    token = token.slice(7, token.length);
  }
  if(token){
    jwt.verify(token, clave, (err, decoded) => {
      if(err){
        return res.status(401).json({ success: false, message: "Token no valido" });
      } else {
        req.usuarioId = decoded.id;
        next();
  }
});
  }
  else {
    return res.status(403).json({ success: false, message: "No se proporciono token" });
  }
};
RegYLogin.get("/login", (req, res) => {
  res.render("iniciosSesion");
});

RegYLogin.post("/login", async (req, res) => {
  const { email, contrasenia } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({success: false,  error: "El Email no existe." });
    }

    const claveDB = String(usuario.password).trim();
    const claveEscrita = String(contrasenia).trim();
    const passwordMatch = await bcrypt.compare(claveEscrita, claveDB);
    if (!passwordMatch) {
      return res.status(404).json({success: false,  error: "Contraseña  incorrecta." });
    }
    console.log("Usuario logeado:", usuario);

    let token = jwt.sign({ id: usuario.id }, clave , { expiresIn: "24h" });
    
    req.session.usuario={
      id: usuario.id,
    };
    res.json({success: true, 
      message: 'Autenticacion existosa', 
      token: token });


  } catch (error) {
    console.error("Error en el proceso de login:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor.", success: false });
  }
});

// registrarse
RegYLogin.get("/registro", (req, res) => {
  res.render("registrarse");
});

// recibir registro
RegYLogin.post("/registro", async (req, res) => {
  try {
    const { usuario, contrasenia, email } = req.body;
    const ofertas = req.body.ofertas === "on";
    const claveEncriptada = await bcrypt.hash(contrasenia, 10);
    const creado = await Usuario.crearUsuario(
      usuario,
      claveEncriptada,
      email,
      ofertas,
    );
    if (creado) {
      res.status(201).json({ success: true, message: "Üsuario creado con exito"});
    } else {
      res.status(400).json({success: false, error:  "Usuario o Email ya en uso" })
    }
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
});

RegYLogin.get("/welcome", (req, res) => {
  res.render("welcome");
});

RegYLogin.get("/revisarEmail", async (req, res) => {
  const { email } = req.query;
  const respuesta = await Usuario.revisarEmail(email);
  res.json({ respuesta });
});

RegYLogin.get("/revisarUsuario", async (req, res) => {
  const { usuario } = req.query;
  const respuesta = await Usuario.revisarUsuario(usuario);
  res.json({ respuesta });
});

export default RegYLogin;
