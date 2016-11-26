var restify = require('restify');
var builder = require('botbuilder');

var gitlab = require('node-gitlab');

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

//========================================================
// GitLab API Setup
//=========================================================

var client = gitlab.createPromise({
  api: 'https://pmgit.informatik.uni-ulm.de/api/v3',
  privateToken: 'wZXpKxar7JhuA1HvskFA'
});
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

    }).matches(/^list projects/i, function (session, args) {
        //List Gitlab Projects:
		client.projects.list()
		  .then(function (projects) {
		    console.log(projects);
		    projects.forEach(function(project) {
    			console.log(project.path);
    			//session.send('%s %s',project.path,project.id);
			});
			var str = projects.map(function(project) {return project.path + '(' + project.id+')'});
			session.send('%s',str.join(", \r\n"));
		    //session.send('Projects: %s', JSON.stringify(projects));
		  })
		  .catch(function (err) {
		    throw err;
		  });
    }).matches(/^bye bye/i, function (session, args) {
        // change user's city
        session.send('Bye ;)');
        session.endDialog();
    }).onDefault(function (session) {//If none of the previous matched:
        // perform search
        var messageText = session.message.text.trim();
        session.send('Here is what you said: %s', messageText);//<- just some simple echo
    }));

