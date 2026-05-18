var express = require("express");
var cors = require("cors");
var app = express();
var dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

var allowedOrigins = [
  "https://varification.hutchisonportsuaqi.com",
  "https://mujibnewproject.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(
    ...process.env.ALLOWED_ORIGINS.split(",").map(function (s) {
      return s.trim();
    })
  );
}

var corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin || true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

var PORT = process.env.PORT || 3030;
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
require("./database/db");
var admin = require("./router/admin");
app.use(admin);
var swaggerUi = require("swagger-ui-express"),
  swaggerDocument = require("./swagger.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

if (!process.env.VERCEL) {
  app.listen(PORT, function () {
    console.log("server is runing ".concat(PORT));
  });
}

module.exports = app;
