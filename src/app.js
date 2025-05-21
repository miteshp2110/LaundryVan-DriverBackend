const express = require("express");
const app = express();
const cors = require("cors");
const jsonBodyValidator = require("./middleware/jsonBodyValidator");
const { getJwtToken } = require("./utils/jwtManager");
const { testConnection } = require("./config/db");
const path = require("path");

//test

//preloaders

testConnection();

app.use(cors());
app.use(express.json());

//custom middleware

app.use(jsonBodyValidator);

//static folder

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/test", (req, res) => {
  res.json({ message: "Test Route", jwt: getJwtToken({ body: "test" }) });
});

//routes
app.use("/api/auth", require("./routes/auth-routes"));
app.use("/api/address", require("./routes/address-routes"));
app.use("/api/services", require("./routes/services-routes"));
app.use("/api/promotions", require("./routes/promotions-routes"));
app.use("/api/order", require("./routes/order-routes"));
app.use("/api/driver", require("./routes/driver-routes"));

module.exports = app;
