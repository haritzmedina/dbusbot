const request = require('request');
const parseString = require('xml2js').parseString;

class Stops{
    constructor(){
        
    }

    static requestStops(linea, callback){
        request.get(linea.enlace, {}, function(error, response, xml){
            parseString(xml, (err, result)=>{
                let paradaInfo = result.markers.marker;
                let paradas = [];
                for(let i=0;i<paradaInfo.length;i++){
                    let currentStop = paradaInfo[i];
                    paradas.push({name: currentStop.title_es[0], id: currentStop.parada_id[0], lineas: [linea.num]});
                }
                callback(paradas);
            });
        });
    }

}

module.exports = Stops;