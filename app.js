const express = require("express");
const pug = require("pug");
// CONSTANTES
const app = express();
const PORT = 3000;

// 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//MOTOR DE PLANTILLAS
app.set('view engine',  'pug');
app.set('views',  './views');
app.use(express.static('public'))



app.get('/',( req, res)=> {
    res.render('layout')
});



app.listen(PORT, ()=>{
    console.log(`Servidor corriendo en el puerto:${PORT}`)
})