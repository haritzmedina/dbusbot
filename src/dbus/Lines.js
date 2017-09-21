class Lines{
    constructor(){

    }

    static init(){
        if(!Lines.lines){
            let fs = require("fs");
            let content = fs.readFileSync("data.json");

            let jsoncontent = JSON.parse(content);
            Lines.lines = jsoncontent.lineas;
        }
    }
}

module.exports = Lines;