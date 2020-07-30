"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;


// mongoose.connect(process.env.DB_URI);
let shortUrlList = { 3: "www.freecodecamp.org/forum/" };

app.use(cors());

app.use(express.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl/new", function (req, res) {
  dns.lookup(req.body.url, function (err, addresses, family) {
    if (err) {
      console.log(err);
      res.json({ error: "invalid URL" });
    } else {
      const id = Math.floor(Math.random() * 1000 + 1);
      shortUrlList[id] = addresses;
      res.json({ orgina_url: req.body.url, short_url: id });
    }
  });
});

app.get("/api/shortcut/:id", (req, res) => {
  console.log("id:", req.params.id);
  if (req.params.id) {
    res.redirect("http://" + shortUrlList[req.params.id]);
  } else {
    res.send(`<h1>Error... short Url ${req.params.id} not found `);
  }
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
