const path = require("path");

// Use the existing dishes data.
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary.
const nextId = require("../utils/nextId");

// This function lists all existing dish data.
function list(req, res, next) {
  res.send({ data: dishes });
}

// TODO: Implement the /dishes handlers needed to make the tests pass
module.exports = {
  list
}