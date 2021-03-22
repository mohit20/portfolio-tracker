const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
//const basicAuth = require("express-basic-auth");
var http = require("http").createServer(app);
require("dotenv").config(".env");


var corsOptions = { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const db = require("./app/models");
db.sequelize.sync();

/*
app.use(
  basicAuth({
    authorizer: (username, password, cb) => {
      const userMatches = basicAuth.safeCompare(
        username,
        process.env.AUTH_USERNAME
      );
      const passwordMatches = basicAuth.safeCompare(
        password,
        process.env.AUTH_PASSWORD
      );
      if (userMatches & passwordMatches) return cb(null, true);
      else return cb(null, false);
    },
    authorizeAsync: true,
    unauthorizedResponse: (req) => {
      return `unauthorized. ip: ${req.ip}`;
    },
    challenge: true,
  })
);
*/
require("./app/routes/stock.routes")(app);

const PORT = process.env.SERVER_PORT || 8000;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
