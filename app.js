/*-----------------------------------------------------------------------------
A speech to text bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

// This loads the environment variables from the .env file
require('dotenv-extended').load();

const builder = require("botbuilder"),
    fs = require("fs"),
    needle = require("needle"),
    restify = require("restify"),
    request = require("request"),
    speechService = require("./speech-service.js"),
    url = require("url");

var gitlab = require('node-gitlab');

//========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3979, () => {
    console.log("%s listening to %s", server.name, server.url);
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector);
server.post("/api/messages", connector.listen());

//========================================================
// GitLab API Setup
//=========================================================

var client = gitlab.createPromise({
  api: 'https://example.gitlab.org/api/v3',
  privateToken: 'put privateToken here'
});
//=========================================================
// Bots Dialogs
//=========================================================
function getProjectId(projectName){
	client.projects.list()
		.then(function (projects) {
			return projects.filter(function(project) {return project.path === projectName;}).id;
		});		
}

bot.dialog('/', new builder.IntentDialog()
	//if no conversation opened yet or conversation was closed before
    .onBegin(function (session, args, next) {
    	//Begin conversation
    	session.send('If you want me to note issues for Gitlab just tell me by saying "Hey Bot"'); 
        next();//<- also try matching:
    }).matches(/^add (.*)/i, function (session, args) {
        // change default city
        var note = args.matched[1].trim();
        session.send('note "%s" will be added to backlog.', note);

    }).matches(/(^Which projects are you aware of\?|^list projects)/i, function (session, args) {
        //List Gitlab Projects:
		client.projects.list()
		  .then(function (projects) {
		    projects.forEach(function(project) {
    			console.log(project.path);
    			console.log(getProjectId(project.path));
    			//session.send('%s %s',project.path,project.id);
			});
			//show name + if for each project:
			var str = projects.map(function(project) {return project.path + '(' + project.id+')'});
			//join them to a single stream
			session.send('%s',str.join(", \r\n"));
		    //session.send('Projects: %s', JSON.stringify(projects));
		  })
		  .catch(function (err) {
		    throw err;
		  });
    }).matches(/talk about (.*)/i, function (session, args) {
    	//NounPhrase for the object for "talk about"
        var object = args.matched[1].trim();
        //If object is some project, then remember somehow that the conversation is about this project
    }).matches(/concerning(.*)/i, function (session, args) {
        //NounPhrase for the object for "concerning"
        var object = args.matched[1].trim();
        //If object is some project, then remember somehow that the conversation is about this 
        //(=> see talk about)
    }).matches(/add (.*) issue (.*)/i, function (session, args) {
        //indicator that the the last / the next sentences are about an issue of a project

    }).matches(/^Bye Bot/i, function (session, args) {
        //Tell user to quit the conversation
        session.send('Bye ;)');
        session.endDialog();
    }).onDefault(function (session) {//If none of the previous matched:
        // perform search
        var messageText = session.message.text.trim();
        session.send('Here is what you said: %s', messageText);//<- just some simple echo
    }));
