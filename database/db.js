const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
var dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
var DATABASE = process.env.DATABASE;

if (!DATABASE) {
  console.error("Error: DATABASE environment variable is not set in config.env");
  console.error("Please set DATABASE in your config.env file");
  process.exit(1);
}

const MONGODB_URL = DATABASE;
mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((e) => {
    console.error("Database connection error:", e.message);
    console.error("Please check:");
    console.error("1. Your MongoDB Atlas username and password are correct");
    console.error("2. Your IP address is whitelisted in MongoDB Atlas");
    console.error("3. Special characters in password are URL-encoded");
    process.exit(1);
  });
