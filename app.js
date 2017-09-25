// Load Environment variables required to initialize the bot
require('dotenv').config();

let pjson = require('./package.json');
console.log('Running DbusBot version: '+pjson.version);

// Load the main application
const main = require('./src/main');
main();