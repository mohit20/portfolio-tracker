const Validator = require("validator");
const isEmpty = require("is-empty");
const Enum = require("enum");
const TYPE = new Enum([
  "BUY",
  "SELL"
]);
exports.validateTrade=(data)=>{
    let errors = {};
    
    // Convert empty fields to an empty string so we can use validator functions
    data.type = !isEmpty(data.type)&& (data.type===TYPE.SELL.toString() || data.type === TYPE.BUY.toString()) ? data.type : "" ;
    data.company = !isEmpty(data.company) ? data.company : "";
    data.tickr = !isEmpty(data.tickr) ? data.tickr : "";
    data.price = !isEmpty(data.price) ? data.price : "";
    data.quantity = !isEmpty(data.quantity) ? data.quantity : "";
    // Type checks
    if (Validator.isEmpty(data.type)) {
      errors.type = "Type field should BUY/SELL";
    }
    // Company checks
    if (Validator.isEmpty(data.company)) {
        errors.company = "Company is required";
    }
    // Tickr checks
    if (Validator.isEmpty(data.tickr)) {
        errors.tickr = "Tickr field is required";
    }
    // Price checks
    if (Validator.isEmpty(data.price)) {
      errors.price = "Price is required";
    }
    // Quantity checks
    if (Validator.isEmpty(data.quantity)) {
        errors.quantity = "Quantity field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
      };
};
  
exports.validateTradeId=(data)=>{
    let paramsError = {};
    // Convert empty fields to an empty string so we can use validator functions
    data.id = !isEmpty(data.id) ? data.id : "";
    // Id checks
    if (Validator.isEmpty(data.id)) {
      paramsError.id = "Id field is required";
    } 
    return {
      paramsError,
      paramsIsValid: isEmpty(paramsError)
    };
};
