const chalk = require('chalk');
const fs = require('fs');
const fileName = 'logger.log'

exports.logIt = (type,message) =>{
    let currDate = new Date()
    switch(type){
        case "ERROR":
            console.log(chalk.white.bgRed.bold('ERROR')+" :"+ currDate +": "+ message)
            fs.appendFileSync(fileName, 'ERROR'+" :"+ currDate +": "+ message + "\n");
            break;
        case "INFO":
            console.log(chalk.white.bgBlue.bold('INFO')+" :"+ currDate +": "+ message)
            fs.appendFileSync(fileName, 'INFO'+" :"+ currDate +": "+ message + "\n");
            break;
        case "DEBUG":
            console.log(chalk.white.bgGreen.bold('DEBUG')+" :"+ currDate +": "+ message)
            fs.appendFileSync(fileName, 'DEBUG'+" :"+ currDate +": "+ message + "\n");
            break;
        default:
            console.log(message)
    }
}