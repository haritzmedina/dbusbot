const fs = require("fs");
const request = require("request");
const parseString = require('xml2js').parseString;

class StopsManager{
    constructor(){
        this.stops = {};
        this.lines = [];
    }

    init(){
        // Retrieve all the stops of dbus
        let content = fs.readFileSync("data.json");
        let jsoncontent = JSON.parse(content);
        this.lines = jsoncontent.lineas;

        let promises = [];

        this.lines.forEach((line)=>{
            promises.push(new Promise((resolve, reject)=>{
                this.generateRequestForLineStops(line, ()=>{
                    resolve();
                });
            }));
        });
        Promise.all(promises).then(()=>{
            console.log(this.stops);
        });
    }

    requestStops(linea, callback){
        request.get(linea.enlace, {}, function(error, response, xml){
            parseString(xml, (err, result)=>{
                let paradas = [];
                if(result && result.markers && result.markers.marker){
                    let paradaInfo = result.markers.marker;
                    for(let i=0;i<paradaInfo.length;i++){
                        let currentStop = paradaInfo[i];
                        paradas.push({name: currentStop.title_es[0], id: currentStop.parada_id[0], lineas: [linea.num]});
                    }
                }
                callback(paradas);
            });
        });
    }

    generateRequestForLineStops(line, callback) {
        this.requestStops(line, (stops)=>{
            stops.forEach((stop)=>{
                // If the stop is currently added, only add line number
                if(this.stops[stop.id]){
                    this.stops[stop.id].lineas = this.stops[stop.id].lineas.concat(stop.lineas);
                }
                // Add the stop to the list
                else{
                    this.stops[stop.id] = stop;
                }
            });
            callback();
        });
    }
}

module.exports = StopsManager;