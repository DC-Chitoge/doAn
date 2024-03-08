const express = require("express");
const cors = require("cors");

const dbConnection = require("./config/database");
const { order } = require("./routes");
const { PORT } = require("./config");
const { CreateChannel, SubscribeMessage } = require("./utils");

const StartServer = async () => {
  const app = express();
  await dbConnection();

  app.use(express.json());
  app.use(cors());

  const channel = await CreateChannel();

  SubscribeMessage(channel);

  order(app, channel);

  app.listen(PORT, () => {
    console.log(`Server user is running on port ${PORT}`);
  });
};

StartServer();
