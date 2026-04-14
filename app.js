const express = require("express");
const pug = require("pug");

const app = express();
const compiledFunction = pug.compileFile("template.pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
