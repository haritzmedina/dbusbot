class HelpDialog{
    constructor(bot){
        this.bot = bot;
    }

    init(){
        this.bot.dialog('/help', [(session)=>{
            this.helpMessage(session);
        }]);
    }

    helpMessage(session){
        let channelId = session.message.address.channelId;
        if(channelId==='telegram'){
            session.send('Cualquier duda o comentario puedes ponerte en contacto con el desarrollador en telegram @haritzmedina o en Github: https://github.com/haritzmedina/dbusbot/issues');
        }
        else if(channelId==='facebook'){
            session.send('Cualquier duda o comentario puedes ponerte en contacto con el desarrollador en facebook https://www.facebook.com/DbusBot-1886182904961201/ o en Github: https://github.com/haritzmedina/dbusbot/issues');
        }
        else{
            session.send('Cualquier duda o comentario puedes ponerte en contacto con el desarrollador: https://github.com/haritzmedina/dbusbot/issues')
        }
        session.send('El código fuente es de libre acceso, está disponible en https://github.com/haritzmedina/dbusbot');
        session.endDialog();
        session.beginDialog('/main');
    }
}

module.exports = HelpDialog;