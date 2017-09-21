const request = require('request');
const cheerio = require('cheerio');
const querystring = require('querystring');

class Arrivals{
    constructor(){

    }

    static requestArrivals(parada, callback){
        request.post('https://www.dbus.eus/wp-admin/admin-ajax.php',{
            form: querystring.stringify({action: 'calcula_parada', parada: parada, security: Arrivals.securityString})
        }, function(error, response, html){
            if(response.body==='-1'){
                Arrivals.updateSecurityString(()=>{
                    Arrivals.requestArrivals(parada, callback);
                });
            }
            else{
                let $ = cheerio.load(html);
                let proximasLlegadas = $('#prox_lle').find('li');
                let llegadas = [];
                for(let i=0;i<proximasLlegadas.length;i++){
                    llegadas.push(proximasLlegadas[i].firstChild.data);
                }
                callback(llegadas);
            }
        });
    }

    static updateSecurityString(callback){
        request.get('https://www.dbus.eus/05-benta-berri/', {}, (error, response, html)=>{
            debugger;
            let testRE = html.match("security: '(.*)'");
            Arrivals.securityString = testRE[1];
            console.log('Security string set: '+Arrivals.securityString);
            callback();
        });
    }
}

Arrivals.securityString = '';

module.exports = Arrivals;