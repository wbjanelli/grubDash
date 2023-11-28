const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.send({ data: dishes });
}

const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((d) => d.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  } else {
    next({ status: 404, message: `No matching id is found for '${dishId}'` });
  }
};

function read(req, res, next) {
  const foundDish = res.locals.dish;
  res.send({ data: foundDish });
}

const validatesPrice = (req, res, next) => {
  const input = req.body.data.price;
  if (!input || input <= 0 || typeof input !== "number") {
    next({ status: 400, message: "Dish must have a price that is an integer greater than 0" });
  } else {
    next();
  }
};

const validateFor = (property) => {
  return function (req, res, next) {
    const input = req.body.data[property];
    if (!input) {
      next({ status: 400, message: `Dish must include a ${property}` });
    } else {
      next();
    }
  };
};

function create(req, res, next) {
  const { data: { name, description, price, image_url } } = req.body;
  let newDish = { id: nextId(), name, description, price, image_url };
  dishes.push(newDish);
  res.status(201).send({ data: newDish });
}

const validatesCorrectIdToUpdate = (req, res, next) => {
  const { dishId: routeId } = req.params;
  const dishId = req.body.data.id;
  if (dishId && routeId !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${dishId}, Route: ${routeId}`,
    });
  } else {
    next();
  }
};

function update(req, res, next) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } } = req.body;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.send({ data: foundDish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [validatesPrice, validateFor("name"), validateFor("description"), validateFor("image_url"), create],
  update: [dishExists, validatesCorrectIdToUpdate, validatesPrice, validateFor("name"), validateFor("description"), validateFor("image_url"), update],
};
