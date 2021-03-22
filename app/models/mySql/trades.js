module.exports = (sequelize, Sequelize) => {
  const Trade = sequelize.define("trades", {
    userid: {
      type: Sequelize.STRING,
      require: true,
      defaultValue: "Mohit"
    },
    type: {
      type:   Sequelize.ENUM,
      values: ['BUY', 'SELL'],
      require: true
    },
    company: {
      type: Sequelize.STRING,
      require: true
    },
    tickr: {
      type: Sequelize.STRING,
      require: true
    },
    quantity: {
      type: Sequelize.INTEGER,
      require: true
    },
    price: {
      type: Sequelize.DECIMAL(10,2),
      require: true
    }
  });
  return Trade;
};
