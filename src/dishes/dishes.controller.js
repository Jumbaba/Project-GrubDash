const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//The middleware
function dishHasValidFields(req, res, next) {
  const { data } = req.body;

  const VALID_FIELDS = ["name", "price", "description", "image_url"];

  //Are all required fields present
  for (const field of VALID_FIELDS) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Field "${field}" is required`,
      });
    }
  }

  //Is valid price range
  if (typeof data.price !== "number" || data.price < 0) {
    return next({
      status: 400,
      message: `Field price must be a number greater than zero`,
    });
  }
  res.locals.data = data;
  next();
}

function dishExists(req, res, next) {
  const { data } = req.body;
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    res.locals.dishId = dishId;
    res.locals.data = data;
    next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

//The actual functions

const list = (req, res) => {
  res.json({
    data: dishes,
  });
};

const read = (req, res) => {
  const foundDish = res.locals.dish;

  res.json({ data: foundDish });
};

const update = (req, res, next) => {
  const { dishId } = res.locals;
  const { data } = res.locals;
  const { id, name, description, price, image_url } = data;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Data id field ${id} does not match route id: ${dishId}`,
    });
  }

  const updatedDish = {
    id,
    name,
    description,
    price,
    image_url,
  };

  const dish = dishes.find((dish) => dish.id === dishId);
  Object.assign(dish, updatedDish);

  res.status(200).json({ data: updatedDish });
};

const create = (req, res) => {
  const {data} = res.locals;
  const newDish = {
    ...data,
    id: nextId(),
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

module.exports = {
  list,
  read: [dishExists, read],
  update: [dishExists, dishHasValidFields, update],
  create: [dishHasValidFields, create],
};

