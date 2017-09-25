const builder = require('botbuilder');

class DialogUtils{
    static stopNameForUser(stop){
        let linesString = '[L';
        stop.lines.sort();
        for(let i=0; i<stop.lines.length;i++){
            linesString += stop.lines[i]+'-';
        }
        linesString = linesString.slice(0, -1);
        linesString += ']';
        return stop.name+' '+linesString;
    }

    static retrieveStopsObject(stops){
        let stopsObject = [];
        for(let i=0;i<stops.length;i++){
            let stop = stops[i];
            stopsObject.push(DialogUtils.stopNameForUser(stop));
        }
        return stopsObject;
    }

    static createChoiceCardMessage(session, choiceArray, messageText){
        let choices = choiceArray.map(choice => new builder.CardAction.imBack(session, choice, choice));
        let card = new builder.ThumbnailCard(session)
            .text(messageText)
            .buttons(choices);
        return new builder.Message(session)
            .addAttachment(card);
    }
}

module.exports = DialogUtils;