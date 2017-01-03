var restify = require('restify');
var builder = require('botbuilder');
const request = require('request');
const cheerio = require('cheerio');
const querystring = require('querystring');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'aaf64664-3085-42a5-ae07-617720884399',
    appPassword: 'mtdotVRj9CyeQdUhKvD78xS'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var securityString = '';

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.IntentDialog()
    .matches(/^parada/i, '/parada')
    .onDefault(builder.DialogAction.send("Para saber los horarios de una parada, di 'parada'"))
);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/parada', [
    function(session){
        builder.Prompts.text(session, 'Que parada quieres? Ejemplo.:\n\n' +
            '3141 - Pio XII\n\n' +
            '2299 - Unibertsitatea Tol.77\n\n' +
            '3082 - Unibertsitatea T.70 II');
    },
    function (session, results) {
        let parada = results.response;
        console.log('Asking for parada: '+parada);
        requestArrivals(parada, (llegadas)=>{
            if(llegadas.length===0){
                session.send('No hay informacion o la parada no existe');
            }
            else{
                for(let i=0;i<llegadas.length;i++){
                    session.send(llegadas[i]);
                }
            }
            session.endDialog();
        });
    }
]);

function requestArrivals(parada, callback){
    request.post('http://www.dbus.eus/wp-admin/admin-ajax.php',{
        form: querystring.stringify({action: 'calcula_parada', parada: parada, security: securityString})
    }, function(error, response, html){
        if(response.body==='-1'){
            updateSecurityString(()=>{
                requestArrivals(parada, callback);
            });
        }
        let $ = cheerio.load(html);
        let proximasLlegadas = $('#prox_lle').find('li');
        let llegadas = [];
        for(let i=0;i<proximasLlegadas.length;i++){
            llegadas.push(proximasLlegadas[i].firstChild.data)
        }
        callback(llegadas);
    });
}

function updateSecurityString(callback){
    request.get('http://www.dbus.eus/05-benta-berri/', {}, (error, response, html)=>{
        let testRE = html.match("security: '(.*)'");
        securityString = testRE[1];
        console.log('Security string set: '+securityString);
        callback();
    });
}