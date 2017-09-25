const builder = require('botbuilder');
const Arrivals = require('../../dbus/Arrivals');
const ExampleStops = require('../../dbus/ExampleStops');
const DialogUtils = require('./DialogUtils');

class ArrivalsDialog{
    constructor(bot){
        this.bot = bot;
        this.stopsManager = global.dBusBot.stopsManager;
    }

    init(){
        this.bot.dialog('/parada', [
            (session)=>{
                let stops = session.userData.favs;
                console.log(stops);
                if(typeof stops === 'undefined' || stops.length===0){
                    stops = ExampleStops;
                }
                if(stops.length>0){
                    let stopsObject = DialogUtils.retrieveStopsObject(stops);
                    let message = DialogUtils.createChoiceCardMessage(session, stopsObject, "Elige una de tus paradas favoritas o dime cualquier otra.");
                    builder.Prompts.text(session, message);
                }
            },
            (session, results, next) => {
                // Load fav stops
                let favStops = session.userData.favs;
                if(typeof favStops === 'undefined' || favStops.length===0){
                    favStops = ExampleStops;
                }
                console.log('Fav stops '+favStops.length);
                // Search in favourite
                let resultStops = this.retrieveStopsContainingText(favStops, results.response);
                // Search in all stops
                if(resultStops.length === 0){
                    // Check in all stops
                    console.log('All stops '+this.stopsManager.stopsArray.length);
                    resultStops = this.retrieveStopsContainingText(this.stopsManager.stopsArray, results.response);
                }
                // If there is a match
                if(resultStops.length>0){
                    // If result is only 1, go to the next step
                    if(resultStops.length===1){
                        session.dialogData.stopToCheck = resultStops[0];
                        next();
                    }
                    // Else, ask which of the possibles is the correct one
                    else{
                        let stopsObject = DialogUtils.retrieveStopsObject(resultStops);
                        // Save possible options to verify the result
                        session.dialogData.matchableStops = resultStops;
                        builder.Prompts.choice(session, "¿A qué parada te refieres?", stopsObject, {listStyle: builder.ListStyle.button});
                    }
                }
                // If results is 0 finish (TODO change this behaviour)
                else{
                    session.send("No existe ninguna parada con ese nombre");
                    session.endDialog();
                    session.beginDialog('/main');
                }
            },
            (session, results) => {
                // Retrieve stop to check
                let stopToCheck = {};
                if(session.dialogData.stopToCheck){
                    stopToCheck = session.dialogData.stopToCheck;
                }
                else{
                    // Search stops which match
                    for(let i=0; i<session.dialogData.matchableStops.length;i++){
                        if(DialogUtils.stopNameForUser(session.dialogData.matchableStops[i]) === results.response.entity){
                            stopToCheck = session.dialogData.matchableStops[i];
                        }
                    }
                }
                // Parse stop name to stop object
                session.send('Revisando el estado en tiempo real para la parada '+stopToCheck.name+'. Espera...');
                Arrivals.requestArrivals(stopToCheck.id, (llegadas)=>{
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

    retrieveStopsContainingText(stops, response) {
        let matchedStops = [];
        for(let i=0;i<stops.length;i++){
            if(DialogUtils.stopNameForUser(stops[i]).toLowerCase().includes(response.toLowerCase())){
                matchedStops.push(stops[i]);
            }
        }
        return matchedStops;
    }
}

module.exports = ArrivalsDialog;