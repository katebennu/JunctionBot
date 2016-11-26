var restify = require('restify');
var builder = require('botbuilder');

//========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.IntentDialog()
	//if no conversation opened yet or conversation was closed before
    .onBegin(function (session, args, next) {
    	//Begin conversation
    	session.send('Hello'); 
        next();//<- also try matching:
    }).matches(/^add (.*)/i, function (session, args) {
        // change default city
        var note = args.matched[1].trim();
        session.send('note "%s" will be added to backlog.', note);

    }).matches(/^forget it/i, function (session, args) {
        // change user's city
        session.send('ok, i will empty the backlog');
        session.endDialog();
    }).onDefault(function (session) {//If none of the previous matched:
        // perform search
        var messageText = session.message.text.trim();
        session.send('Here is what you said: %s', messageText);//<- just some simple echo
    }));

