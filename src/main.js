module.exports = ()=>{
    // Initialize bot
    const DBusBot = require('./bot/DBusBot');
    global.dBusBot = new DBusBot();
    global.dBusBot.init();
};