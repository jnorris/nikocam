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
  debug("/");
  const files = await fsPromises.readdir(MOTION_DIR);
  debug(files);

  const getFilemap = (files) => {
    const re = /^(?<dt>(?<date>\d+)-(?<time>\d+))-(?<idx>\d+).(?<ext>\w+)$/;
    const filemap = {};
    for (const f of files) {
      const m = f.match(re);
      const info = {...m.groups, filename: f};
      info.dt = DateTime.fromFormat(info.dt, "yyyyMMdd-HHmmss");
      debug(info);
      // debug(m);
      const idx = m.groups.idx;
      if (!(idx in filemap)) {
        filemap[idx] = {};
      }
      const ff = filemap[idx];
      ff[m.groups.ext] = info;
    }
    return filemap;
  };

  const filemap = getFilemap(files);
  debug(filemap);
  res.render("index", { filemap });
});

/////////////////////////////////////
// App Listener
/////////////////////////////////////
app.listen(PORT, () => {
  debug(`Listening on Port ${PORT}`);
});
