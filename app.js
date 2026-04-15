const express = require("express");
const pug = require("pug");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine',  'pug');
app.set('views',  './views');
app.use(express.static('public'))



app.get('/',( req, res)=> {
    res.render('layout')
});

const PORT = 3000;

app.listen(PORT, ()=>{
    console.log(`Servidor corriendo en el puerto:${PORT}`)
})