import express from 'express';
import { publicacion } from '../models/publicacion.js';

const newPubli = express.Router();

newPubli.get("/publicacion", (req, res) => {