const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// This function outputs a list of all existing order data.
function list(req, res, next) {
  res.send({ data: orders });
}

// This function validates the order's deliverTo property. It checks:
// 1) that the deliverTo property exists and 2) that the deliverTo property is not empty.
const validatesDeliverTo = (req, res, next) => {
  const {
    data: { deliverTo },
  } = req.body;
  if (!deliverTo) {
    next({ status: 400, message: "Order must include a deliverTo" });
  }
  next();
};

// This function validates the order's mobile number property. It checks:
// 1) that the mobile number property exists and 2) that the mobile number property is not empty.
const validatesMobileNumber = (req, res, next) => {
  const {
    data: { mobileNumber },
  } = req.body;
  if (!mobileNumber) {
    next({ status: 400, message: "Order must include a mobileNumber" });
  }
  next();
};

// This function validates all dishes' quantity property by iterating through each dish and checking:
// if 1) the dish quantity property is missing 2) the dish quantity is not 0 or less 3) checks that dish price quantity is not an integer
const validatesDishQuantity = (req, res, next) => {
  const { data: { dishes } = [] } = req.body;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
};

// This function validates the order's dishes property. It checks:
// 1) if the dishes property is missing 2) if the dishes property is an array and 3) if the dishes array is not empty.
const validatesDishes = (req, res, next) => {
  const {
    data: { dishes },
  } = req.body;
  if (!dishes) {
    next({ status: 400, message: "Order must include a dish" });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    next({ status: 400, message: "Order must include at least one dish" });
  } else {
    next();
  }
};

// This function will save the order and send the newly created order.
function create(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  let newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}

// This function checks if the order exists. If it does, it'll move onto the next function. But if no matching order is found, it will return 404.
const orderExists = (req, res, next) => {
  const { orderId } = req.params;

  const foundOrder = orders.find((o) => {
    return o.id === orderId;
  });
  res.locals.order = foundOrder;

  if (foundOrder) {
    next();
  } else {
    next({ status: 404, message: `Order "${orderId}" does not exist.` });
  }
};

// This function will respond with the order where id === :orderId.
function read(req, res, next) {
  const order = res.locals.order;
  res.send({ data: order });
}

// This function validates if the route id matches the dataId if a dataId is given in the update object.
const checkIdMatches = (req, res, next) => {
  const { orderId } = req.params;
  const dataId = req.body.data.id;
  if (dataId && dataId !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${dataId}, Route: ${orderId}.`,
    });
  }
  next();
};

// This function validates the status property of an update. It checks:
// 1. if the status is property is missing 2. if the status property is empty and 3. if the status property of an existing order === "delivered".
const validatesStatus = (req, res, next) => {
  const {
    data: { status },
  } = req.body;
  if (!status) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    next({ status: 400, message: `A delivered order cannot be changed` });
  } else if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery"
  ) {
    next();
  } else {
    next({ status: 400, message: `Invalid status` });
  }
};

// This function will update the order where id === :orderId, or return 404 if no matching order is found.
function update(req, res, next) {
  const order = res.locals.order;
  const {
    data: { id, deliverTo, mobileNumber, status, dishes },
  } = req.body;

  order.id = id ? id : order.id;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.send({ data: order });
}

// This function will delete the order and return a 204 where id === :orderId, or return 404 if no matching order is found.
function destroy(req, res, next) {
  const { id, status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  }
  const orderIndex = orders.findIndex((o) => o.id === id);
  orders.splice(orderIndex, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    validatesDeliverTo,
    validatesMobileNumber,
    validatesDishes,
    validatesDishQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    checkIdMatches,
    validatesStatus,
    validatesDeliverTo,
    validatesMobileNumber,
    validatesDishes,
    validatesDishQuantity,
    update,
  ],
  destroy: [orderExists, destroy],
};
