const builder = require('botbuilder');

class DeleteUserDataDialog{
    constructor(bot){
        this.bot = bot;
    }

    init(){
        this.bot.dialog('/deleteUserData', [
            (session) => {
                builder.Prompts.confirm(session, "Estás seguro que quieres eliminar tus favoritos?");
            },
            (session, result) => {
                if(result.response){
                    session.userData = {};
                    session.send('Tus datos se han eliminado');
                }
                else{
                    session.send('No se ha eliminado nada');
                }
                mainMessage(session);
            }
        ]);


    }
}

module.exports = DeleteUserDataDialog;