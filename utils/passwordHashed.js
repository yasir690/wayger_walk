require("dotenv").config();

const bcrypt = require("bcryptjs");

const hashPassword = async (payload) => {
  return bcrypt.hashSync(payload, 10);
};

const comparePassword = async (password, inputPassword) => {
  return bcrypt.compareSync(password, inputPassword);
};

module.exports = { hashPassword, comparePassword };
