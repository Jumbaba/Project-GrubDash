const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//The middleware

function statusIsValid(req, res, next) {
  const { data } = req.body;
  const { id, status } = data;
  //   next({
  //       message:`Status: ${(status !== "pending")}`,
  //   })
  if (
    !status ||
    status === "" ||
    status !== "pending" // ||
    // status !== "preparing" ||
    // status !== "out-for-delivery"
  ) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  res.locals.data = data;
  next();
}

function updateOrderIdIsValid(req, res, next) {
  const { orderId } = req.params;
  const { data } = req.body;
  const { id } = data;
  if (id && orderId !== data.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  res.locals.data = data;
  next();
}

function orderHasValidFields(req, res, next) {
  const { data = {} } = req.body;
  const { deliverTo, mobileNumber, dishes } = data;
  const VALID_FIELDS = ["deliverTo", "mobileNumber", "dishes"];

  //Are all required fields present
  for (const field of VALID_FIELDS) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }

  //Are dishes valid type and length
  if (
    deliverTo === "" ||
    mobileNumber === "" ||
    !Array.isArray(dishes) ||
    dishes.length <= 0
  ) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }

  for (const dish of dishes) {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      Number(dish.quantity) === 0
    ) {
      return next({
        status: 400,
        message: `Dish ${dishes.indexOf(
          dish
        )} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  res.locals.data = data;
  res.locals.orders = dishes;
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.orderId = orderId;
    res.locals.order = foundOrder;
    res.locals.data = req.body.data;
    next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

//The actual functions

const list = (req, res) => {
  res.json({
    data: orders,
  });
};

const read = (req, res) => {
  const { order } = res.locals;

  res.json({ data: order });
};

const create = (req, res) => {
  const { data } = res.locals;
  const newOrder = {
    id: nextId(),
    ...data,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

// const update = (req, res, next) => {
//   const { orderId } = req.params;
//   const { data = {} } = req.body;
//   const { id, deliverTo, mobileNumber, dishes, status } = data;

//   const updatedOrder = {

//     id: orderId,
//     deliverTo,
//     mobileNumber,
//     dishes,
//     status,
//   };

//   //const order = orders.find((order) => order.id === orderId);
//   Object.assign(res.locals.order, updatedOrder);

//   res.status(200).json({ data: updatedOrder });
// };

const update = (req, res, next) => {
  const { order } = res.locals;
  const { data } = res.locals;
  const { update } = data;
  for (let prop in update) {
    if (update[prop]) {
      order[prop] = update[prop];
    }
  }
  res.json({ data: order });
};

const destroy = (req, res, next) => {
  const { orderId } = res.locals;
  const { status } = res.locals.order;

  if (status === "pending") {
    const index = orders.findIndex((order) => order.id === orderId);

    orders.splice(index, 1);
    res.sendStatus(204);
  } else
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
};

module.exports = {
  list,
  create: [orderHasValidFields, create],
  read: [orderExists, read],
  update: [
    orderExists,
    orderHasValidFields,
    updateOrderIdIsValid,
    statusIsValid,
    update,
  ],
  delete: [orderExists, destroy],
};
