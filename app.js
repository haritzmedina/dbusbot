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
let connector = new builder.ChatConnector({
    appId: 'aaf64664-3085-42a5-ae07-617720884399',
    appPassword: 'mtdotVRj9CyeQdUhKvD78xS'
});
let bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

let securityString = '';

let exampleStops = {
    '347 | Pio XII': {id: '3141'},
    '311 | Unibertsitatea T.70 II': {id: '2299'},
    '44 | Unibertsitatea Tol.77': {id: '3082'},
    '349 | Unibertsitatea Tol.95': {id: '3144'},
    '193 | Estaciones Renfe-Bus Geltokiak': {id: '2826'}
};

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.IntentDialog()
    .matches(/^parada/i, '/parada')
    .matches(/^fav/i, '/addToFavorite')
    .matches(/^deleteUserData/i, '/deleteUserData')
    .onDefault(builder.DialogAction.send("Para saber los horarios de una parada, di 'parada'"))
);

bot.dialog('/parada', [
    function(session){
        let stops = session.userData.favs || [];
        let stopsObject = {};
        if(stops.length>0){
            for(let i=0;i<stops.length;i++){
                stopsObject = stops;
            }
        }
        else{
            stopsObject = exampleStops;
        }
        builder.Prompts.choice(session, "Que parada quieres?", stopsObject);
    },
    function (session, results) {
        let parada = exampleStops[results.response.entity].id;
        session.send('Revisando el estado en tiempo real. Espera...');
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

bot.dialog('/addToFavorite', [
    (session) => {
        builder.Prompts.text(session, 'Qué parada quieres añadir a favoritos?');
    },
    (session, results) =>{
        //let favs = session.userData.favs || [];
        favs.push(results.response);
        session.userData.favs = favs;
        session.endDialog();
    }
]);

bot.dialog('/deleteUserData', [
    (session) => {
        session.userData.favs = [];
        session.send('User data removed');
        session.endDialog();
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
        else{
            let $ = cheerio.load(html);
            let proximasLlegadas = $('#prox_lle').find('li');
            let llegadas = [];
            for(let i=0;i<proximasLlegadas.length;i++){
                llegadas.push(proximasLlegadas[i].firstChild.data)
            }
            callback(llegadas);
        }
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