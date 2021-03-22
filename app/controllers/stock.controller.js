const Portfolio = require('../models/mongoDb/portfolio');
const db = require("../models");
const Trades = db.trades;
//const Op = db.Sequelize.Op;
const logIt = require('../logger/logger');
const validateAuth = require("../validation/stock");
const createError = require('http-errors');
//const redis = require('../utils/redisConnection');
const Enum = require("enum");
const TYPE = new Enum([
  "BUY",
  "SELL"
]);
const sendError=(e,res)=>{
	logIt.logIt("ERROR","Somthing went wrong!"+e);
	const err = new createError.InternalServerError();
	res.status(500).send(err);
  }
  
exports.addTrade = async (req, res) => {
  const initialTime = Date.now();
  // Validate request
    logIt.logIt("INFO","POST /api/trade to add a new trade");
    
    const { errors, isValid } = validateAuth.validateTrade(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    
   try{
     let check = 1;
     if(req.body.type===TYPE.SELL.toString()){
      check = await sellCheck(req.body);
     }
     if(check){
        Trades.create(req.body)
        .then(async (data) => {
          //calculate portfolio
          let portfolio = await Portfolio.findOne({userId:"Mohit"});
          if(portfolio){
            let holdings = portfolio.holdings;
            let stock = holdings.find(x => x.tickr === data.tickr);
            if(data.type === TYPE.BUY.toString()){
              let newTrade = await addNewTrade(req.body);
              if(newTrade == 1){
                logIt.logIt("INFO","Trade added in " + (Date.now()-initialTime) + "ms");
                res.status(200).send({"Message":"Trade added successfully", id: data.id});
              }else{
                logIt.logIt("ERROR","Failed to add Trade in " + (Date.now()-initialTime) + "ms");
                const err = new createError.InternalServerError()
                res.status(500).send(err)
              }
            }else{
              if(stock){
                if(stock.quantity >= data.quantity){
                  stock.quantity -= data.quantity;
                  portfolio.total_amt -= data.quantity*data.price;
                  portfolio.total_quantity -= data.quantity;
                  await portfolio.save();
                  logIt.logIt("INFO","Trade added in " + (Date.now()-initialTime) + "ms");
                  res.status(200).send({"Message":"Trade added successfully", id: data.id});
                }else{
                  logIt.logIt("INFO","Unable to add trade in " + (Date.now()-initialTime) + "ms");
                  await Trades.destroy({where: {id:data.id}});
                  res.status(401).send({"Message":"Trade not allowed, Not enough shares"});
                }
              }else{
                logIt.logIt("INFO","Unable to add trade in " + (Date.now()-initialTime) + "ms");
                await Trades.destroy({where: {id:data.id}});
                res.status(401).send({"Message":"Trade not allowed, Not enough shares"});
              }
            }
          }else{
            let arr = []
            let holding = {
              company: req.body.company,
              price : req.body.price,
              quantity: req.body.quantity,
              tickr : req.body.tickr
            }
            arr.push(holding);
            let returns_amt = (100 - req.body.price) * req.body.quantity;
            //let returns_cent = returns_amt/eq.body.quantity*req.body.price * 100;

            const port = {
              returns_amt: (100 - req.body.price) * req.body.quantity,
              returns_cent :  roundTo2((returns_amt * 100)/(req.body.quantity*req.body.price)),
              total_amt: req.body.price * req.body.quantity,
              total_quantity: req.body.quantity,
              holdings : arr
            }
            let p = await Portfolio.create(port);
            logIt.logIt("INFO","Trade added in " + (Date.now()-initialTime) + "ms");
            res.status(200).send({"Message":"Trade added successfully", id: data.id});
          }
        }).catch(e => {
          logIt.logIt("ERROR","something went wrong " + e)
          const err = new createError.InternalServerError()
          res.status(500).send(err)
        });
      }else{
        logIt.logIt("ERROR","Trade cannot be added as not enough shares to SELL");
        res.status(405).send({message:"Trade cannot be added as not enough shares to SELL"});
      }
    }catch(e){
      logIt.logIt("ERROR","something went wrong " + e);
      const err = new createError.InternalServerError()
      res.status(500).send(err)
    }
};

exports.getTrade = (req, res) => {
	const initialTime = Date.now();
    logIt.logIt("INFO","GET /api/trade to get all the trades");

    Trades.findAll({
      attributes: {exclude: ['userid']}
    }).then(data => {
        const endTime = Date.now();
        logIt.logIt("INFO","Got all Trades in " + (endTime-initialTime) + "ms");
        res.status(200).send(data);
    }).catch(err => {
        logIt.logIt("ERROR","Something went wrong " + err)
        res.status(500).send({
        message:
            err.message || "Some error occurred while fetching Trades."
        });
      })

};
//to change and add delete trade
exports.updateTrade = async (req, res) => {
  const initialTime = Date.now();
  
  const { paramsError, paramsIsValid } = validateAuth.validateTradeId(req.params);
	if (!paramsIsValid) {
		return res.status(400).json(paramsError);
  }

  const { errors, isValid } = validateAuth.validateTrade(req.body);
  if (!isValid) {
      return res.status(400).json(errors);
  }
  
  try{
    logIt.logIt("DEBUG","PATCH /api/trade/id to edit a trade");
    let trade = await Trades.findOne({where:{id:req.params.id}});
    if(!trade){
      logIt.logIt("Error","Trade not found");
      res.status(404).send({message:"Trade not found"});
    }
    else{
      let trade = await Trades.findOne({where:{id:req.params.id}});
      if(req.body.type===TYPE.SELL.toString()){
        let check = await sellCheck(req.body);
        if(check){
          let rollback = await rollbackTrade(trade)
          if(rollback){
            logIt.logIt("INFO","Rollack successful in " + (Date.now()-initialTime) + "ms");
            Trades.update(req.body, { where: { id:req.params.id } }).then(async (data)=>{
              if(req.body.type===TYPE.SELL.toString()){
                let rollback = await rollbackTrade(req.body)
                if(rollback){
                  logIt.logIt("INFO","Trade updated in " + (Date.now()-initialTime) + "ms");
                  res.status(200).send({"Message":"Trade updated successfully", id: req.params.id});
                }
              }else{
                let newTrade = await addNewTrade(req.body);
                if(newTrade){
                  logIt.logIt("INFO","Trade updated in " + (Date.now()-initialTime) + "ms");
                  res.status(200).send({"Message":"Trade updated successfully", id: data.id});
                }
              }
            })
          }else{
            logIt.logIt("ERROR","something went wrong ")
            const err = new createError.InternalServerError()
            res.status(500).send(err)
          }
        }else{
          logIt.logIt("ERROR","Can't update as not enough shares to SELL");
          res.status(405).send({message:"Trade cannot be updated as not enough shares to SELL"});
        }
      }
    }
  }catch(e) {
        logIt.logIt("ERROR","something went wrong " + e)
        const err = new createError.InternalServerError()
        res.status(500).send(err)
    }
};

exports.getPortfolio = async (req, res) => {
	const initialTime = Date.now();
	logIt.logIt("DEBUG","GET /api/trade/portfolio")
  try{
    Portfolio.findOne({userId:"Mohit"}).select(["-returns_cent", "-returns_amt","-__v","-userId"]).then(async function(data){
      if(data){
        const endTime = Date.now();
        logIt.logIt("INFO","Trade Details fetched in " + (endTime-initialTime) + "ms");
        res.status(200).send(data);
      }
      else{
        logIt.logIt("INFO", "Trade Not Found");
        res.status(404).send({message:"Trade not found"});
      }
    });
  }catch(e) {
    logIt.logIt("ERROR","something went wrong " + e)
    const err = new createError.InternalServerError()
    res.status(500).send(err)
  }
}

exports.getReturns = async (req, res) => {
	const initialTime = Date.now();
	logIt.logIt("DEBUG","GET /api/trade/returns")
  try{
    Portfolio.findOne({userId:"Mohit"}).select(["returns_cent", "returns_amt"]).then(async function(data){
      if(data){
        const endTime = Date.now();
        logIt.logIt("INFO","Returns Details fetched in " + (endTime-initialTime) + "ms");
        res.status(200).send(data);
      }
      else{
        logIt.logIt("ERROR", "Return Not Found");
        res.status(500).send({message:"RETURN not found"});
      }
    });
  }catch(e) {
    logIt.logIt("ERROR","something went wrong " + e)
    const err = new createError.InternalServerError()
    res.status(500).send(err)
  }
}

exports.getOneTrade = async (req, res) => {
	const initialTime = Date.now();
  
  const { paramsError, paramsIsValid } = validateAuth.validateTradeId(req.params);
	if (!paramsIsValid) {
		return res.status(400).json(paramsError);
	}
  logIt.logIt("DEBUG","GET /api/trade/id")
  try{
    Trades.findOne(
      {where:{id:req.params.id},
      attributes:  {exclude: ['userid']}}).then(async function(data){
      if(data){
      const endTime = Date.now();
      delete data.userId;
      logIt.logIt("INFO","Trade Details fetched in " + (endTime-initialTime) + "ms");
      res.status(200).send(data);
      }
      else{
      logIt.logIt("INFO", "Trade Not Found");
      res.status(404).send({message:"Trade not found"});
      }
    });
  }catch(e) {
    logIt.logIt("ERROR","something went wrong " + e)
    const err = new createError.InternalServerError()
    res.status(500).send(err)
  }
}

exports.deleteTrade = async (req, res) => {
  const initialTime = Date.now();
  logIt.logIt("DEBUG","DELETE /api/trade/portfolio")
  const { paramsError, paramsIsValid } = validateAuth.validateTradeId(req.params);
	if (!paramsIsValid) {
		return res.status(400).json(paramsError);
	}
  try{
    let trade = await Trades.findOne({where: {id:req.params.id}});
    let check = await sellCheck(trade);
    if(check){
      let rollback = await rollbackTrade(trade)
      if(rollback){
        await Trades.destroy({where: {id:req.params.id}});
        logIt.logIt("INFO","Trade deleted in " + (Date.now()-initialTime) + "ms");
        res.status(200).send({"Message":"Trade deleted sucessfully"});
      }
      else{
        logIt.logIt("ERROR","something went wrong ")
        const err = new createError.InternalServerError()
        res.status(500).send(err)
      }
    }else{
      logIt.logIt("INFO","Trade cannot be deleted as not enough shares to SELL" + (Date.now()-initialTime) + "ms");
      res.status(405).send({"Message":"Trade cannot be deleted  as not enough shares to SELL"});
    }
    
  }catch(e) {
    logIt.logIt("ERROR","something went wrong " + e)
    const err = new createError.InternalServerError()
    res.status(500).send(err)
  }
}


//function to roll back a trade
async function rollbackTrade(tradeData){
  let portfolio = await Portfolio.findOne({userId:"Mohit"});
  if(portfolio.holdings){
    holdings = portfolio.holdings;
    let stock = holdings.find(x => x.tickr === tradeData.tickr);
    if(stock){
      if(stock.quantity >= tradeData.quantity){
        stock.price = ((stock.price*stock.quantity)-(tradeData.price*tradeData.quantity))/(stock.quantity-tradeData.quantity);
        stock.quantity -= tradeData.quantity;
        portfolio.total_amt -= tradeData.quantity*tradeData.price;
        portfolio.total_quantity = portfolio.total_quantity - tradeData.quantity;
        portfolio.returns_amt = portfolio.total_quantity*100 - portfolio.total_amt;
        portfolio.returns_cent = 100*portfolio.returns_amt/portfolio.total_amt;
        if(stock.quantity == 0){
          portfolio.holdings = portfolio.holdings.filter((x) => x.tickr != tradeData.tickr)
        }
        portfolio.total_amt = roundTo2(portfolio.total_amt);
        portfolio.returns_amt = roundTo2(portfolio.returns_amt);
        portfolio.returns_cent = roundTo2(portfolio.returns_cent);
        stock.price = roundTo2(stock.price);
        await portfolio.save();
        logIt.logIt("INFO","Trade rollacked ms");
        return 1;
      }else{
        logIt.logIt("ERROR","Trade rollack not possile as not enough shares");
        return 0;
      }
    }
  }else{
    logIt.logIt("ERROR","Trade rollack not possile as user doesn't own stock ");
    return 0;
  }
}
//function to add a new trade
async function addNewTrade(tradeData){
  try{
    let portfolio = await Portfolio.findOne({userId:"Mohit"});
    if(portfolio.holdings){
      holdings = portfolio.holdings;
      let stock = holdings.find(x => x.tickr == tradeData.tickr);
      if(stock){
        stock.price = +((stock.price*stock.quantity)+ +(tradeData.price*tradeData.quantity))/(+stock.quantity + +tradeData.quantity);
        stock.quantity =  +stock.quantity + +tradeData.quantity;
        portfolio.total_amt += tradeData.quantity*tradeData.price;
        portfolio.total_quantity = +portfolio.total_quantity + +tradeData.quantity;
        portfolio.returns_amt = portfolio.total_quantity*100 - portfolio.total_amt;
        portfolio.returns_cent = 100*portfolio.returns_amt/portfolio.total_amt;
        portfolio.total_amt = roundTo2(portfolio.total_amt);
        portfolio.returns_amt = roundTo2(portfolio.returns_amt);
        portfolio.returns_cent = roundTo2(portfolio.returns_cent);
        stock.price = roundTo2(stock.price);
        await portfolio.save();
        logIt.logIt("INFO","Trade added, stock already present");
        return 1;
      }else{
        const newStock = {
          company: tradeData.company,
          price : tradeData.price,
          quantity: tradeData.quantity,
          tickr : tradeData.tickr
        }
        portfolio.total_amt += tradeData.quantity*tradeData.price;
        portfolio.total_quantity = +portfolio.total_quantity + +tradeData.quantity;
        portfolio.returns_amt = portfolio.total_quantity*100 - portfolio.total_amt;
        portfolio.returns_cent = 100*portfolio.returns_amt/portfolio.total_amt;
        portfolio.total_amt = roundTo2(portfolio.total_amt);
        portfolio.returns_amt = roundTo2(portfolio.returns_amt);
        portfolio.returns_cent = roundTo2(portfolio.returns_cent);
        holdings.push(newStock);
        await portfolio.save();
        logIt.logIt("INFO","New Trade added as no entry for this stock in holdings");
        return 1;
      }
    }else{
      logIt.logIt("ERROR","something went wrong ")
      const err = new createError.InternalServerError()
      return 0;
    }
  }catch(e) {
    logIt.logIt("ERROR","something went wrong " + e)
    const err = new createError.InternalServerError()
    return 0;
  }
}

//function to check whether user has enough securities to sell
async function sellCheck(tradeData){
  let portfolio = await Portfolio.findOne({userId:"Mohit"});
  if(portfolio){
    let stock = portfolio.holdings.find(x => x.tickr == tradeData.tickr);
    if(stock){
      if(stock.quantity >= tradeData.quantity){
        return 1;
      }else{
        return 0;
      }
    }else{
      return 0;
    } 
  }else{
    return 0;
  }
} 

function roundTo2(x){
  return Math.round(x*100)/100;
}