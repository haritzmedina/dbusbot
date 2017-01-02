const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const Telegraf = require('telegraf');

const app = new Telegraf('303114484:AAH-nTKyTcigJMxB5ugoF1HHAeCJQQywOFI');

app.command('start', (ctx) => {
    console.log('start', ctx.from);
    ctx.reply('Welcome!');
});

app.hears('hi', (ctx) => ctx.reply('Hey there!'));

app.hears('dbus', (ctx)=>{
    request.post('http://www.dbus.eus/wp-admin/admin-ajax.php',{
        form: querystring.stringify({action: 'calcula_parada', parada: '2299', security: 'd5652d88d4'})
    }, function(error, response, html){
        let $ = cheerio.load(html);
        let proximasLlegadas = $('#prox_lle').find('li');
        for(let i=0;i<proximasLlegadas.length;i++){
            ctx.reply(proximasLlegadas[i].firstChild.data);
        }
    });
});

app.startPolling();