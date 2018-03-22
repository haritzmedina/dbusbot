const builder = require('botbuilder');
const restify = require('restify');
const HelpDialog = require('./dialogs/HelpDialog');
const MainDialog = require('./dialogs/MainDialog');
const AddStopDialog = require('./dialogs/AddStopDialog');
const ArrivalsDialog = require('./dialogs/ArrivalsDialog');
const DeleteStopDialog = require('./dialogs/DeleteStopDialog');
const DeleteUserDataDialog = require('./dialogs/DeleteUserDataDialog');

const StopsManager = require('../dbus/StopsManager');

class DBusBot{
    constructor(){
        this.stopsManager = null;
    }

    init(){
        this.initServer();
        this.initBot();
        this.initRecognizer();
        this.initDbusServices();
        this.initDialogs();
    }

    initServer(){
        // Setup Restify Server
        let server = restify.createServer({});
        server.listen(process.env.port || process.env.PORT || 3978, function () {
            console.log('%s listening to %s', server.name, server.url);
        });

        this.server = server;
    }

    initBot(){
        // Create chat bot
        this.connector = new builder.ChatConnector({
            appId: process.env.APP_ID,
            appPassword: process.env.APP_PASSWORD
        });
        this.bot = new builder.UniversalBot(this.connector);
        this.server.post('/api/messages', this.connector.listen());
    }

    initRecognizer(){
        this.recognizer = new builder.LuisRecognizer(process.env.APP_LUIS_URL);
        let intents = new builder.IntentDialog({ recognizers: [this.recognizer] });
        this.bot.dialog('/', intents);
        intents.matches('tiemposParada', '/parada');
        intents.matches('addStopFavorite', '/addStopFavorite');
        intents.matches('deleteFavorites', '/deletefav');
        intents.matches('help', '/help');
        intents.onDefault(builder.DialogAction.beginDialog('/main'));
    }

    initDialogs(){
        this.dialogs = {};
        this.dialogs.help = new HelpDialog(this.bot);
        this.dialogs.main = new MainDialog(this.bot);
        this.dialogs.addStop = new AddStopDialog(this.bot);
        this.dialogs.arrival = new ArrivalsDialog(this.bot);
        this.dialogs.deleteStop = new DeleteStopDialog(this.bot);
        this.dialogs.deleteUserData = new DeleteUserDataDialog(this.bot);
        for(let key in this.dialogs){
            if(this.dialogs.hasOwnProperty(key)){
                this.dialogs[key].init();
            }
        }
    }

    initDbusServices() {
        this.stopsManager = new StopsManager();
        this.stopsManager.init();
    }
}

module.exports = DBusBot;