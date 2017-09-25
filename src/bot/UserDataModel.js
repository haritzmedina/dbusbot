const lastVersion = '0.0.3';

class UserDataModel{

    constructor(){
        this.stopsManager = global.dBusBot.stopsManager;
        this.versions = [{
            'version': '0.0.3',
            'operation': (session)=>{
                console.log('Migrating to 0.0.3');
                let favs = session.userData.favs;
                let transFavs = [];
                for(let i=0;i<favs.length;i++){
                    transFavs.push(this.stopsManager.stops[favs[i].parada.id]);
                }
                session.userData.favs = transFavs;
                session.userData.version = '0.0.3';
            }
        }]
    }

    init(){

    }

    migrateDataModel(session, callback){
        session.userData.version = session.userData.version || '0.0.0';
        if(session.userData.version){
            if(this.versionCompare(session.userData.version, lastVersion)===-1){
                for(let i=0; i<this.versions.length;i++){
                    if(this.versionCompare(session.userData.version, this.versions[i].version)===-1){
                        this.versions[i].operation(session);
                    }
                }
            }
        }
    }

    versionCompare(v1, v2, options) {
        let lexicographical = options && options.lexicographical,
            zeroExtend = options && options.zeroExtend,
            v1parts = v1.split('.'),
            v2parts = v2.split('.');

        function isValidPart(x) {
            return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
        }

        if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
            return NaN;
        }

        if (zeroExtend) {
            while (v1parts.length < v2parts.length) v1parts.push("0");
            while (v2parts.length < v1parts.length) v2parts.push("0");
        }

        if (!lexicographical) {
            v1parts = v1parts.map(Number);
            v2parts = v2parts.map(Number);
        }

        for (let i = 0; i < v1parts.length; ++i) {
            if (v2parts.length === i) {
                return 1;
            }

            if (v1parts[i] === v2parts[i]) {

            }
            else if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            else {
                return -1;
            }
        }

        if (v1parts.length !== v2parts.length) {
            return -1;
        }

        return 0;
    }

}

module.exports = UserDataModel;