const mongoose = require('mongoose')

const portfolioSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        default: "Mohit"
    },
    returns_amt: {
        type: Number,
        required: true
    },
    returns_cent: {
        type: Number,
        required: true
    },
    total_amt: {
        type: Number,
        required: true
    },
    total_quantity: {
        type: Number,
        required: true
    },
    holdings:[{
        company:{
            type: String,
            required: true
        },
        tickr:{
            type: String,
            required: true
        },
        quantity:{
            type: Number,
            required: true
        },
        price:{
            type: Number,
            required: true
        } 
    }]
});

const portfolio = mongoose.model('Portfolio', portfolioSchema)
module.exports = portfolio;