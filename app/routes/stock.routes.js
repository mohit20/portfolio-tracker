module.exports = app => {
    const stock = require("../controllers/stock.controller.js");
    var router = require("express").Router(); 

    router.post("/",stock.addTrade);
    router.get("/",stock.getTrade);
    router.delete("/:id",stock.deleteTrade);
    router.put("/:id",stock.updateTrade);
    router.get("/portfolio",stock.getPortfolio);
    router.get("/returns",stock.getReturns);
    router.get("/:id",stock.getOneTrade);
    app.use('/trade', router);
  };
  