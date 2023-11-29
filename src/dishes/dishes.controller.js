const path = require("path");

// Use the existing dish data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// This function outputs a list of all existing dish data.
function list(req, res, next) {
  res.send({ data: dishes });
}

// This middleware checks if the dish exists. If it does, it'll move on to the next function. If no matching dish is found, it will return 404.
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

// This function responds with the details of a specific dish.
function read(req, res, next) {
  const foundDish = res.locals.dish;
  res.send({ data: foundDish });
}

// This middleware validates the price property of a dish. It checks if the price is missing, less than or equal to 0, or not a number.
const validatesPrice = (req, res, next) => {
  const input = req.body.data.price;
  if (!input || input <= 0 || typeof input !== "number") {
    next({ status: 400, message: "Dish must have a price that is an integer greater than 0" });
  } else {
    next();
  }
};

// This higher-order function generates middleware to validate the presence of a specified property in the dish data.
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

// This function creates a new dish, adds it to the dishes array, and responds with the newly created dish.
function create(req, res, next) {
  const { data: { name, description, price, image_url } } = req.body;
  let newDish = { id: nextId(), name, description, price, image_url };
  dishes.push(newDish);
  res.status(201).send({ data: newDish });
}

// This middleware validates if the route id matches the dataId when updating a dish.
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

// This function updates the details of an existing dish and responds with the updated dish.
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
