require("dotenv").config();
const debug = require("debug")("nikocam");
const express = require("express");
const methodOverride = require("method-override");
const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
const connect = require("connect-mongodb-session")(session);

// const mongoose = require("./db/connection");

const PORT = process.env.PORT || "2021";
const SECRET = process.env.SECRET || "secret"

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

/////////////////////////////////////
// App Listener
/////////////////////////////////////
app.listen(PORT, () =>
  debug(`Listening on Port ${PORT}`)
);
