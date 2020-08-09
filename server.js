"use strict";

var express = require("express");
var mongo = require("mongodb");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var dns = require("dns");
var cors = require("cors");
var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: 'false' }));
app.use(express.json());
app.use(cors());
app.use("/public", express.static(process.cwd() + "/public"));

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: { type: 'String', required: true },
  short_url: { type: 'String', required: true },
  address: { type: 'String', required: true }
})

const Url = mongoose.model("Url", urlSchema)

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl/new", async function (req, res) {
  // Remove 'http(s)://' from string
  const originalUrl = req.body.url.replace(/(^\w+:|^)\/\//, '');
  dns.lookup(originalUrl, async function (err, addresses, family) {
    if (err) {
      res.status(400).json({ error: "invalid URL" });
    } else {
      const url = await createAndSaveUrl(originalUrl, addresses)
      res.json(url);
    }
  });
});

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  // Search for existing shortened Url
  const url = await Url.findOne({ short_url: req.params.shortUrl })

  if (url) {
    res.redirect("http://" + url.original_url);
  } else {
    res.status(400).json({ "error": ` shortened url ${req.params.shortUrl} not found` });
  }
});

async function createAndSaveUrl(reqUrl, address) {
  let newUrl = {}
  let shortUrl = null;
  // Create shortUrl: number of existing documents + 1 
  await Url.estimatedDocumentCount((err, numOfDocs) => {
    if (err) return console.log(err);
    shortUrl = numOfDocs + 1;
  });

  // If exist: loop through documents and find first gap from 1 to number of documents 
  await Url.findOne({ short_url: String(shortUrl) }, async (err, url) => {
    if (err) return console.log(err);
    if (url) {
      shortUrl = await getNumBetween(shortUrl)
    }
    newUrl = { original_url: reqUrl, short_url: shortUrl, address: address }
    const newUrlDoc = Url(newUrl)
    newUrlDoc.save();
  })
  return newUrl;
}

async function getNumBetween(shortUrl) {
  // Get all documents
  await Url.find({}, (err, query) => {
    if (err) return console.lg(err)

    // Order documents by short_url
    const shortUrls = query.map(e => Number(e.short_url)).sort((a, b) => a - b)

    // Find first gap and assign it to new shortened Url
    for (let i = 0; i < shortUrls.length; i++) {
      if (i + 1 !== shortUrls[i]) {
        shortUrl = i + 1;
        return;
      }
    }
    return shortUrl;
  })
  return shortUrl;
}

app.listen(port, function () {
  console.log("Node.js listening ...");
});
