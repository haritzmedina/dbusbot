module.exports = ()=>{
    // Initialize bot
    const DBusBot = require('./bot/DBusBot');
    let dBusBot = new DBusBot();
    dBusBot.init();
};