const restify = require('restify');
const builder = require('botbuilder');
const request = require('request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const parseString = require('xml2js').parseString;


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

let exampleStops = [
    {
        parada: {id: '3141', name: '347 | Pio XII'},
        linea: {num: '24-27'}
    },{
        parada: {id: '2299', name: '44 | Unibertsitatea Tol.77'},
        linea: {num: '5'}
    },{
        parada: {id: '3082', name: '311 | Unibertsitatea T.70 II'},
        linea: {num: '24-27'}
    },{
        parada: {id: '3141', name: '349 | Unibertsitatea Tol.95'},
        linea: {num: '24'}
    },{
        parada: {id: '2826', name: '193 | Estaciones Renfe-Bus Geltokiak'},
        linea: {num: '45'}
    },
];

//==================================
// Carga de links de lineas
//==================================
let fs = require("fs");
let content = fs.readFileSync("datos.json");

let jsoncontent = JSON.parse(content);
let lineas = jsoncontent.lineas;

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.IntentDialog()
    .matches(/^parada/i, '/parada')
    .matches(/^fav/i, '/addToFavorite')
    .matches(/^deleteUserData/i, '/deleteUserData')
    .onDefault(builder.DialogAction.beginDialog('/main'))
);

function mainMessage(session){
    builder.Prompts.choice(session, "Qué deseas hacer?", 'Parada|Favorito|DeleteUserData');
    session.endDialog();
}

bot.dialog('/main', [
    (session)=>{
    mainMessage(session);
    }
]);

bot.dialog('/parada', [
    function(session){
        let stops = session.userData.favs;
        if(stops.length===0){
            stops = exampleStops;
        }
        let stopsObject = {};
        if(stops.length>0){
            for(let i=0;i<stops.length;i++){
                let stop = stops[i];
                stopsObject[stop.parada.name+' [L'+stop.linea.num+']'] = '';
            }
            builder.Prompts.choice(session, "Que parada quieres?", stopsObject);
        }
    },
    function (session, results) {
        let stops = session.userData.favs;
        if(stops.length===0){
            stops = exampleStops;
        }
        let parada = {};
        console.log(results.response.entity);
        for(let i=0;i<stops.length;i++){
            let stop = stops[i];
            let userStopString = stop.parada.name+' [L'+stop.linea.num+']';
            if(userStopString===results.response.entity){
                parada = stop;
            }
        }
        session.send('Revisando el estado en tiempo real. Espera...');
        console.log(parada);
        requestArrivals(parada.parada.id, (llegadas)=>{
            if(llegadas.length===0){
                session.send('No hay informacion o la parada no existe');
            }
            else{
                for(let i=0;i<llegadas.length;i++){
                    session.send(llegadas[i]);
                }
            }
            mainMessage(session);
        });
    }
]);

bot.dialog('/addToFavorite', retrieveBusStopByUserInput([
    function (session, results){
        session.send('Añadido: '+results.parada.name+' [L'+results.linea.num+']');
        let favs = session.userData.favs || [];
        favs.push(results);
        session.userData.favs = favs;
        mainMessage(session);
    }
]));

bot.dialog('/deleteUserData', [
    (session) => {
        session.userData.favs = [];
        session.send('User data removed');
        mainMessage(session);
    }
]);

function retrieveBusStopByUserInput(callbackWaterfall){
    let userInput = {};
    let metadata = {};
    let waterfall = [
        (session) => {
            let choiceMessage = {};
            for(let i=0;i<lineas.length;i++){
                choiceMessage[lineas[i].num] = lineas[i].num;
            }
            builder.Prompts.choice(session, 'A qué linea pertenece la parada?', choiceMessage);
        },
        (session, results) => {
            console.log(results.response);
            let linea = findLineaData(results.response.entity);
            if(!linea){
                session.send('No existe esa linea');
                session.endDialog();
            }
            else{
                userInput.linea = linea;
                requestStops(linea, (paradas)=>{
                    let choiceMessage = {};
                    for(let i=0;i<paradas.length;i++){
                        choiceMessage[paradas[i].name] = paradas[i].id;
                    }
                    metadata.paradas = choiceMessage;
                    //console.log(metadata.paradas);
                    builder.Prompts.choice(session, 'Qué parada quieres añadir a favoritos?', choiceMessage);
                });
            }
        },
        (session, results, next) => {
            console.log(metadata.paradas);
            userInput.parada = {};
            userInput.parada.id = metadata.paradas[results.response.entity];
            userInput.parada.name = results.response.entity;
            console.log(userInput.parada);
            next(userInput);
        }
    ];
    waterfall = waterfall.concat(callbackWaterfall);
    return waterfall;
}

function findLineaData(lineaNum){
    for(let i=0;i<lineas.length;i++){
        if(lineas[i].num === lineaNum){
            return lineas[i];
        }
    }
}

function requestStops(linea, callback){
    request.get(linea.enlace, {}, function(error, response, xml){
        parseString(xml, (err, result)=>{
            let paradaInfo = result.markers.marker;
            let paradas = [];
            for(let i=0;i<paradaInfo.length;i++){
                let currentStop = paradaInfo[i];
                paradas.push({name: currentStop.title_es[0], id: currentStop.parada_id[0], linea: linea.num});
            }
            callback(paradas);
        });
    });
}

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