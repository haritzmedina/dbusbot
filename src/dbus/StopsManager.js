const fs = require("fs");
const request = require("request");
const parseString = require('xml2js').parseString;

const MINUTES_TO_AUTOUPDATE = 24*60;

class StopsManager{
    constructor(){
        this.stops = {};
        this.stopsArray = [];
        this.lines = [];
    }

    init(callback){
        // Retrieve all the stops of dbus
        let content = fs.readFileSync("data.json");
        let jsoncontent = JSON.parse(content);
        this.lines = jsoncontent.lineas;
        // Initialize stops
        this.updateStops(callback);
        //  Program to auto-update
        setInterval(()=>{this.updateStops(callback)}, MINUTES_TO_AUTOUPDATE*1000*60)
    }

    updateStops(callback){
        let promises = [];
        let tempStops = {};
        this.lines.forEach((line)=>{
            promises.push(new Promise((resolve, reject)=>{
                this.generateRequestForLineStops(line, tempStops, ()=>{
                    resolve();
                });
            }));
        });
        Promise.all(promises).then(()=>{
            let tempStopsArray = [];
            for(let key in tempStops){
                if(tempStops[key]){
                    tempStopsArray.push(tempStops[key]); // Add to stops array
                }
            }
            this.stops = tempStops;
            this.stopsArray = tempStopsArray;

            console.log('Stops updated. Number of stops: '+this.stopsArray.length);

            if (callback instanceof Function) {
                callback();
            }
        });
    }

    requestStops(linea, callback){
        request.get(linea.enlace, {strictSSL: false}, function(error, response, xml){
            if (error) {
                console.log(error)
            } else {
                parseString(xml, (err, result)=>{
                    let paradas = [];
                    if(result && result.markers && result.markers.marker){
                        let paradaInfo = result.markers.marker;
                        for(let i=0;i<paradaInfo.length;i++){
                            let currentStop = paradaInfo[i];
                            paradas.push({name: currentStop.title_es[0], id: currentStop.parada_id[0], lines: [linea.num]});
                        }
                    }
                    callback(paradas);
                });
            }
        });
    }

    generateRequestForLineStops(line, tempStops, callback) {
        this.requestStops(line, (stops)=>{
            stops.forEach((stop)=>{
                // If the stop is currently added, only add line number
                if(tempStops[stop.id]){
                    tempStops[stop.id].lines = tempStops[stop.id].lines.concat(stop.lines);
                }
                // Add the stop to the list
                else{
                    tempStops[stop.id] = stop;
                }
            });
            callback(tempStops);
        });
    }

    retrieveStopsByLine(line){
        let stops = [];
        this.stopsArray.forEach(stop => {
            if(stop.lines.includes(line)){
                stops.push(stop);
            }
        });
        return stops;
    }

    retrieveStopsContainingText(text){
        let matchedStops = [];
        let lowerCasedText = text.toLowerCase();
        for(let i=0;i<this.stopsArray.length;i++){
            if(this.stopsArray[i].name.toLowerCase().includes(lowerCasedText)){
                matchedStops.push(this.stopsArray[i]);
            }
        }
        return matchedStops;
    }
}

module.exports = StopsManager;