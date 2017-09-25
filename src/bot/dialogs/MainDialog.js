const builder = require('botbuilder');
const UserDataModel = require('../UserDataModel');

class MainDialog{

    constructor(bot){
        this.bot = bot;
        this.userDataModel = new UserDataModel();
    }

    init(){
        this.bot.dialog('/main', [
            (session)=>{
                // Check if data model need to be updated
                this.userDataModel.migrateDataModel(session);
                if(session.userData.initialized){
                    this.mainMessage(session);
                }
                else{
                    this.initialMessage(session);
                }
            }
        ]);
    }

    mainMessage(session){
        builder.Prompts.choice(session, "Qué deseas hacer?", 'Ver tiempos de paradas|Añadir parada favorita|Eliminar parada favorita|Ayuda', {listStyle: builder.ListStyle.button});
        session.endDialog();
    }

    initialMessage(session){
        session.send('Este es un chatbot para obtener los tiempos de llegada en tiempo real de los autobuses de la Compañia de Tranvía de San Sebastián (DBus).');
        session.send('Permite definir tus paradas favoritas, consultarlas y eliminarlas. Aun es un pequeño prototipo, por lo que puede fallar.');
        session.send('Este chatbot no está relacionado ni desarrollado por dbus. Desde aquí os recomendamos que para obtener una información más precisa podéis acudir al sitio web o a la aplicación oficial de dbus.');
        session.send('http://dbus.es');
        session.send('http://www.dbus.eus/es/usuarios/aplicaciones-dbus/');
        session.send('Para empezar están definidas como favoritas algunas de las paradas más utilizadas para moverse desde la universidad a la estación de autobus y tren, pero puedes definir las tuyas propias.');
        session.userData.initialized = true;
        this.mainMessage(session);
    }

}

module.exports = MainDialog;