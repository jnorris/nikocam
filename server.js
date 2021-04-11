'use strict';

require("dotenv").config();
const debug = require("debug")("nikocam");
const express = require("express");
const methodOverride = require("method-override");
const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
const connect = require("connect-mongodb-session")(session);

const fsPromises = require("fs/promises");
const { DateTime } = require("luxon");

// const mongoose = require("./db/connection");

const PORT = process.env.PORT || "2021";
const SECRET = process.env.SECRET || "secret"
const MOTION_DIR = process.env.MOTION_DIR;

const app = express();
app.set("view engine", "ejs");

app.use(cors());
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use("/m", express.static(MOTION_DIR));
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// SESSION MIDDLEWARE REGISTRATION (adds req.session property)
app.use(
  session({
    secret: SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    saveUninitialized: true, // create session regardless of changes
    resave: true, //save regardless of changes
    store: new connect({
      uri: process.env.MONGODB_URL,
      databaseName: "sessions",
      collection: "sessions",
    }),
  })
);

/////////////////////////////////////
// Routes and Routers
/////////////////////////////////////

//HomeRouter
//app.use("/", HomeRouter);

app.get("/", async (req, res) => {
  const files = await fsPromises.readdir(MOTION_DIR);

  const getFilemap = (files) => {
    const re = /^(?<dt>(?<date>\d+)-(?<time>\d+))-(?<idx>\d+).(?<ext>\w+)$/;
    const extmap = { mp4: "video", jpg: "image" };
    const filemap = new Map();
    for (const f of files) {
      const m = f.match(re);
      if (!m) continue;
      const type = extmap[m.groups.ext];
      if (!type) continue;
      const info = {...m.groups, type: type, filename: f};
      info.dt = DateTime.fromFormat(info.dt, "yyyyMMdd-HHmmss");
      const idx = info.idx;
      let ff = filemap.get(idx);
      if (!ff) {
        filemap.set(idx, ff = {});
      }
      ff[type] = info;
    }
    return filemap;
  };

  const filemap = getFilemap(files);

  const list = [];
  for (const [k, v] of filemap.entries()) {
    if (v.image && v.video) {
      list.push(v);
    }
  }
  list.sort((a, b) => a.video.dt.toMillis() - b.video.dt.toMillis());
  list.reverse();
  debug(list);

  res.render("index", { filemap, list, DateTime });
});

/////////////////////////////////////
// App Listener
/////////////////////////////////////
app.listen(PORT, () => {
  debug(`Listening on Port ${PORT}`);
});
