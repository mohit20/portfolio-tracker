const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
var http = require("http").createServer(app);
require("dotenv").config({ path: __dirname + "/../.env" });
const swaggerUi  = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

var corsOptions = { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api-docs", swaggerUi.serve, (...args) => swaggerUi.setup(swaggerDocument)(...args));
const db = require("./app/models");
db.sequelize.sync();

require("./app/routes/stock.routes")(app);

const PORT = process.env.SERVER_PORT || 8000;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
