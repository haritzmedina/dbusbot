const builder = require('botbuilder');

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
                    let stopsObject = {};
                    if(stops.length>0){
                        for(let i=0;i<stops.length;i++){
                            let stop = stops[i];
                            stopsObject[stop.parada.name+' [L'+stop.linea.num+']'] = '';
                        }
                        builder.Prompts.choice(session, "Que parada quieres eliminar?", stopsObject, {listStyle: builder.ListStyle.button});
                    }
                }
            },
            (session, results) => {
                let stops = session.userData.favs;
                let index = -1;
                for(let i=0;i<stops.length;i++){
                    let stop = stops[i];
                    let userStopString = stop.parada.name+' [L'+stop.linea.num+']';
                    if(userStopString===results.response.entity){
                        index = i;
                    }
                }
                if(index!==-1){
                    session.send('Se ha eliminado '+results.response.entity+' de favoritos.');
                    stops.splice(index, 1);
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