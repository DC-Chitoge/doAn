const User = require("../models/User");
const users = require("../faker");

const seed = async () => {
  await User.deleteMany({});
  await User.insertMany(users);
};

seed;
