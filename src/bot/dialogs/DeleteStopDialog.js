const builder = require('botbuilder');
const DialogUtils = require("./DialogUtils");

class DeleteStopDialog{
    constructor(bot){
        this.bot = bot;
    }

    init(){
        this.bot.dialog('/deletefav', [
            (session) => {
                let stops = session.userData.favs;
                if(typeof stops === 'undefined' || stops.length===0){
                    session.send('No hay paradas favoritas');
                    session.endDialog();
                    session.beginDialog('/main');
                }
                else{
                    if(stops.length>0){
                        let stopsObject = DialogUtils.retrieveStopsObject(stops);
                        session.dialogData.matchableStops = stops;
                        builder.Prompts.choice(session, 'Que parada quieres eliminar?', stopsObject, {listStyle: builder.ListStyle.button});
                    }
                }
            },
            (session, result) => {
                let stops = session.userData.favs;
                let index = -1;
                for(let i=0;i<session.dialogData.matchableStops.length;i++){
                    if(DialogUtils.stopNameForUser(session.dialogData.matchableStops[i]) === result.response.entity){
                        index = i;
                    }
                }
                if(index!==-1){
                    stops.splice(index, 1);
                    session.send('Se ha eliminado '+result.response.entity+' de favoritos.');
                    session.endDialog();
                    session.beginDialog('/main');
                }
                else{
                    session.send('Hay ocurrido algun error');
                }
            }
        ]);
    }
}

module.exports = DeleteStopDialog;