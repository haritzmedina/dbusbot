const builder = require('botbuilder');
const Arrivals = require('../../dbus/Arrivals');
const ExampleStops = require('../../dbus/ExampleStops');

class ArrivalsDialog{
    constructor(bot){
        this.bot = bot;
    }

    init(){
        this.bot.dialog('/parada', [
            function(session){
                let stops = session.userData.favs;
                console.log(stops);
                if(typeof stops === 'undefined' || stops.length===0){
                    stops = ExampleStops;
                }
                let stopsObject = [];
                if(stops.length>0){
                    for(let i=0;i<stops.length;i++){
                        let stop = stops[i];
                        stopsObject.push(stop.parada.name+' [L'+stop.linea.num+']');
                    }
                    const card = new builder.ThumbnailCard(session)
                        .text('Qué parada quieres?')
                        .buttons(stopsObject.map(choice => new builder.CardAction.imBack(session, choice, choice)));
                    const message = new builder.Message(session)
                        .addAttachment(card);
                    builder.Prompts.text(session, message);
                }
            },
            (session, results) => {
                console.log('Has elegido ' + results.response);
                // TODO If not in favs, search in all stops
                let stops = session.userData.favs;
                if(typeof stops === 'undefined' || stops.length===0){
                    stops = ExampleStops;
                }
                let parada = {};
                for(let i=0;i<stops.length;i++){
                    let stop = stops[i];
                    let userStopString = stop.parada.name+' [L'+stop.linea.num+']';
                    if(userStopString===results.response){
                        parada = stop;
                    }
                }
                session.send('Revisando el estado en tiempo real para la parada '+parada.parada.name+'. Espera...');
                Arrivals.requestArrivals(parada.parada.id, (llegadas)=>{
                    if(llegadas.length===0){
                        session.send('No hay informacion disponible en este momento');
                    }
                    else{
                        for(let i=0;i<llegadas.length;i++){
                            session.send(llegadas[i]);
                        }
                    }
                    session.endDialog();
                    session.beginDialog('/main');
                });
            }
        ]);
    }
}

module.exports = ArrivalsDialog;