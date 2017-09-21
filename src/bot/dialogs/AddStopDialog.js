const builder = require('botbuilder');
const Lines = require('../../dbus/Lines');
const Stops = require('../../dbus/Stops');

class AddStopDialog{
    constructor(bot){
        this.bot = bot;
        Lines.init();
        this.lineas = Lines.lines;
    }

    init(){
        this.bot.dialog('/addStopFavorite', this.retrieveBusStopByUserInput([
            function (session, results){
                session.send('Añadido: '+results.parada.name+' [L'+results.linea.num+']');
                let favs = session.userData.favs || [];
                favs.push(results);
                session.userData.favs = favs;
                session.endDialog();
                session.beginDialog('/main');
            }
        ]));
    }

    retrieveBusStopByUserInput(callbackWaterfall){
        let userInput;
        let metadata;
        let waterfall = [
            (session) => {
                userInput = {};
                metadata = {};
                let choiceMessage = {};
                for(let i=0;i<this.lineas.length;i++){
                    choiceMessage[this.lineas[i].num] = this.lineas[i].num;
                }
                builder.Prompts.choice(session, 'A qué linea pertenece la parada?', choiceMessage, {listStyle: builder.ListStyle.button});
            },
            (session, results) => {
                let linea = this.findLineaData(results.response.entity);
                if(!linea){
                    session.send('No existe esa linea');
                    session.endDialog();
                }
                else{
                    userInput.linea = linea;
                    Stops.requestStops(linea, (paradas)=>{
                        let choiceMessage = {};
                        for(let i=0;i<paradas.length;i++){
                            choiceMessage[paradas[i].name] = paradas[i].id;
                        }
                        metadata.paradas = choiceMessage;
                        builder.Prompts.choice(session, 'Qué parada quieres añadir a favoritos?', choiceMessage, {listStyle: builder.ListStyle.button});
                    });
                }
            },
            (session, results, next) => {
                userInput.parada = {};
                userInput.parada.id = metadata.paradas[results.response.entity];
                userInput.parada.name = results.response.entity;
                next(userInput);
            }
        ];
        waterfall = waterfall.concat(callbackWaterfall);
        return waterfall;
    }

    findLineaData(lineaNum){
        for(let i=0;i<this.lineas.length;i++){
            if(this.lineas[i].num === lineaNum){
                return this.lineas[i];
            }
        }
    }
}

module.exports = AddStopDialog;