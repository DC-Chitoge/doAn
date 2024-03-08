const bcrypt = require("bcryptjs");

const users = [
  {
    name: "Basir",
    email: "admin@example.com",
    password: bcrypt.hashSync("123456"),
    isAdmin: true,
  },
  {
    name: "John",
    email: "user@example.com",
    password: bcrypt.hashSync("123456"),
    isAdmin: false,
  },
];

module.exports = users;
