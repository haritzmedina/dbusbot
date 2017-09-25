const builder = require('botbuilder');
const Lines = require('../../dbus/Lines');
const Stops = require('../../dbus/Stops');
const DialogUtils = require('./DialogUtils');

class AddStopDialog{
    constructor(bot){
        this.bot = bot;
        Lines.init();
        this.lineas = Lines.lines;
        this.stopsManager = global.dBusBot.stopsManager;
    }

    init(){
        this.bot.dialog('/addStopFavorite', [
            (session, result, next)=>{
                builder.Prompts.text(session, 'Dime el nombre de la parada o el número de la linea');
            },
            (session, result, next)=>{
                let number;
                try{
                    number = parseInt(result.response);
                }
                catch(e){

                }
                finally{
                    let isLine = false;
                    if(number){
                        for(let i=0;i<this.lineas.length && !isLine;i++){
                            if(parseInt(this.lineas[i].num)===number){
                                isLine = true;
                            }
                        }
                    }
                    if(isLine){
                        let stops = this.stopsManager.retrieveStopsByLine(result.response);
                        session.dialogData.matchableStops = stops;
                        let stopsObject = DialogUtils.retrieveStopsObject(stops);
                        builder.Prompts.choice(session, '¿Qué parada de la linea '+ number +' quieres añadir a favoritos?', stopsObject, {listStyle: builder.ListStyle.button});
                    }
                    else{
                        let stops = this.stopsManager.retrieveStopsContainingText(result.response);
                        if(stops.length===1){
                            next(stops[0]);
                        }
                        else if(stops.length>1){
                            session.dialogData.matchableStops = stops;
                            let stopsObject = DialogUtils.retrieveStopsObject(stops);
                            builder.Prompts.choice(session, '¿A cual de estas te refieres?', stopsObject, {listStyle: builder.ListStyle.button});
                        }
                        else{
                            session.send("No existe ninguna parada con ese nombre");
                            session.endDialog();
                            session.beginDialog('/main');
                        }
                    }
                }
            },
            (session, result, next) => {
                let stop = null;
                if(typeof session.dialogData.matchableStops === 'undefined'){
                    console.log('If');
                    stop = result;
                }
                else{
                    console.log('else');
                    for(let i=0; i<session.dialogData.matchableStops.length;i++){
                        if(DialogUtils.stopNameForUser(session.dialogData.matchableStops[i]) === result.response.entity){
                            stop = session.dialogData.matchableStops[i];
                        }
                    }
                }
                if(this.addStopToUserSession(session, stop)){
                    session.send('Añadido: '+DialogUtils.stopNameForUser(stop));
                }
                else{
                    session.send('Ya tenias añadido '+DialogUtils.stopNameForUser(stop));
                }
                session.endDialog();
                session.beginDialog('/main');
            }
        ]);
    }

    addStopToUserSession(session, stop){
        let favs = session.userData.favs || [];
        for(let i=0;i<favs.length;i++){
            if(favs[i].id===stop.id){
                return false;
            }
        }
        favs.push(stop);
        session.userData.favs = favs;
        return true;
    }
}

module.exports = AddStopDialog;