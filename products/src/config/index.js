const dotenv = require("dotenv");

if (process.env.NODE_ENV === "development") {
  const configFile = `.env.${process.env.NODE_ENV}`;
  dotenv.config({ path: configFile });
} else {
  dotenv.config();
}

console.log(process.env.PORT);

module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.APP_SECRET,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME,
  MSG_QUEUE_URL: process.env.MSG_QUEUE_URL,
  CUSTOMER_SERVICE: "customer_service",
  SHOPPING_SERVICE: "shopping_service",
  PRODUCT_SERVICE: "product_service",
  MAIN_URL: process.env.MAIN_URL,
};
