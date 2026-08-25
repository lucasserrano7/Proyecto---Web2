import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { verificarRol } from '../middlewares/verificarRol.js';
import { publicacion  } from '../models/publicacion.js'

const validadorRT = express.Router();

validadorRT.get('/validar', authMiddleware, verificarRol('validador'), async (req, res) => {
    try {
        res.render('validador/validar', {titulo: 'Panel de control'});
    } catch (err) {
        console.error(err)
        res.status(500).render('Error', {mensaje: 'erroe ene le servidor'})
    }
});


export default validadorRT;