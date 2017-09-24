const builder = require('botbuilder');
const Arrivals = require('../../dbus/Arrivals');
const ExampleStops = require('../../dbus/ExampleStops');
const StopsManager = require('../../dbus/StopsManager');

class ArrivalsDialog{
    constructor(bot){
        this.bot = bot;
        this.stopsManager = new StopsManager();
        this.stopsManager.init();
    }

    init(){
        this.bot.dialog('/parada', [
            (session)=>{
                let stops = session.userData.favs;
                console.log(stops);
                if(typeof stops === 'undefined' || stops.length===0){
                    stops = ExampleStops;
                }
                let stopsObject = [];
                if(stops.length>0){
                    for(let i=0;i<stops.length;i++){
                        let stop = stops[i];
                        stopsObject.push(stop.name+' [L'+stop.lines[0]+']');
                    }
                    let message = this.createChoiceCardMessage(session, stopsObject, "Que parada quieres?");
                    builder.Prompts.text(session, message);
                }
            },
            (session, results, next) => {
                console.log('Has elegido ' + results.response);
                // Load fav stops
                let favStops = session.userData.favs;
                if(typeof favStops === 'undefined' || favStops.length===0){
                    favStops = ExampleStops;
                }
                console.log('Fav stops '+favStops.length);
                // Search in favourite
                let resultStops = this.retrieveStopsContainingText(favStops, results.response);
                console.log('Fav stops '+this.stopsManager.stopsArray.length);
                // Search in all stops
                if(resultStops.length === 0){
                    // Check in all stops
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
                        let stopsObject = this.retrieveStopsObject(resultStops);
                        // Save possible options to verify the result
                        session.dialogData.matchableStops = resultStops;
                        builder.Prompts.choice(session, "Que parada quieres?", stopsObject, {listStyle: builder.ListStyle.button});
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
                    console.log('Hey');
                    // Search stops which match
                    for(let i=0; i<session.dialogData.matchableStops.length;i++){
                        if(this.stopNameForUser(session.dialogData.matchableStops[i]) === results.response.entity){
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

    retrieveStopsObject(stops){
        let stopsObject = [];
        for(let i=0;i<stops.length;i++){
            let stop = stops[i];
            stopsObject.push(this.stopNameForUser(stop));
        }
        return stopsObject;
    }

    retrieveStopsContainingText(stops, response) {
        let matchedStops = [];
        for(let i=0;i<stops.length;i++){
            if(this.stopNameForUser(stops[i]).includes(response)){
                matchedStops.push(stops[i]);
            }
        }
        return matchedStops;
    }

    createChoiceCardMessage(session, choiceArray, messageText){
        let card = new builder.ThumbnailCard(session)
            .text(messageText)
            .buttons(choiceArray.map(choice => new builder.CardAction.imBack(session, choice, choice)));
        let message = new builder.Message(session)
            .addAttachment(card);
        return message
    }

    stopNameForUser(stop){
        return stop.name+' [L'+stop.lines[0]+']'; // TODO Show all the lines
    }
}

module.exports = ArrivalsDialog;