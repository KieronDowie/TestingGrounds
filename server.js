var http = require('http');
var url = require('url');
var fs = require('fs');
var roles = require('./roleinfo');
var Server = require('socket.io');
var io = new Server(http, {pingInterval: 5000, pingTimeout: 10000});
var db = require('./database');
var verified = []; //List of ips that are verified to use the MCP.
var createdList = [];
var gm = require('./gm.js');
var jailorcom = false;
var commandList = {
	all:{
		'help' : 'Displays this message.',
		'whisper': 'Whisper to another player. This is silent during Pregame, but once ingame other players will know that you are whispering. Usage: /w name message',
		'mod': 'Send a message directly to the mod. Usage: /mod message',
		'target':'Target a player with a night action. Usage: /target player or /target playerone playertwo',
		'vote':'Command for voting, should only be used if there is a problem with the voting interface. Usage: /vote name',
		'role':'View your current rolecard, or use /role name to view another rolecard. Usage /role to view your role, /role name to view a rolecard.',
		'rolelist':'Display the current rolelist.',
		'confirm':'Use during the roles phase to confirm you have your role. Usage: /confirm',
		'ping':'Show your ping. Usage: /ping',
		'afk':'Go afk. Only usable in pregame. Usage: /afk',
		'back':'Return. Usage /back, after using /afk'
	},
	roles:{
		'reveal':'Reveal yourself as the Mayor, if you have that role. Usage: /reveal, during the day.',
		'execute':'Choose to execute the person you have jailed. Usage /execute, then /execute again to cancel.',
		'seance':'Choose a player to talk to at night. You may only use this once.',
		'jail':'Choose to jail a player. Usage: /jail [target] during the day.'
	},
	mod:{
		'givemod':'Pass the mod onto another person. Usage: /givemod name',
		'disguise':'Disguise one player as another. Usage: /disguise playerone playertwo',
		'random':'Choose a random player. Usage: /random',
		'roll':'Roll a dice. Usage /roll or /roll sides',
		'msg':'Send a message to a player. <span class="mod">From</span> <b>Mod:</b> <span class="mod">This looks like this</span>. Usage: /msg name message',
		'sys':'Send a system message to a player. <b>This looks like this</b>',
		'clean':'Set a player\'s will to not show upon death.',
		'forcevote':'Forces a player to vote for a particular person. Usage: /forcevote person1 person2',
		'lockvote':'Locks the player\'s vote. They will be unable to vote or cancel their vote after you use this command, except through /forcevote. Usage: /lockvote person',
		'unlockvote':'Unlocks the player\'s vote. They will be able to vote and cancel their vote once more after you use this command. /unlockvote person'
	},
	dev:{
		'dev':'Activate developer powers.',
		'alert':'Send an audio alert to a player.',
		'kick':'Kick a player.',
		'ban':'Ban an ip.',
		'silence':'Silence a player until the end of the current phase. This effects all messages that are shown to other players.'
	},
	fun:{
		'me':'Do something. Eg. <em>Player waves!</em. Only usable during Pregame.',
		'hug':'Send a hug to a person. Only usable during Pregame.'
	}
}
db.connect();
//Enums
var Type = {
	PING:0,
	PONG:1,
	MSG:2,
	ROOMLIST:3,
	TOGGLE:4,
	JOINROOM:5,
	JOIN:6,
	LEAVE:7,
	SYSTEM:9,
	SETROLE:10,
	HIGHLIGHT:11,
	SETPHASE:12,
	WHISPER:13,
	MOD:14,
	TOGGLELIVING:15,
	PRENOT:16,
	VOTE:17,
	CLEARVOTES:18,
	VERDICT:19,
	TICK:20,
	JUDGEMENT:21,
	SETDEV:22,
	WILL:23,
	SETMOD:24,
	SWITCH:25,
	ACCEPT:26,
	ROLEUPDATE:27,
	DENY:28,
	KICK:29,
	ROLECARD:30,
	ROLL:31,
	SETROLESBYLIST:32,
	MASSROLEUPDATE:33,
	SHOWLIST:34,
	SHOWALLROLES:35,
	LATENCIES:36,
	GETWILL:37,
	HEY:38,
	TARGET:39,
	HUG:40,
	ME:41,
	ROLELIST:42,
	AUTOLEVEL:43,
	SUGGESTIONS:44,
	SYSSENT:45,
	CUSTOMROLES:46,
	HELP:47,
	PAUSEPHASE:48,
	SETDAYNUMBER:49
};
var autoLevel = 1;
/*
 * 0 = No auto
 * 1 = Semi auto
 * 2 = Full auto
 * */
var Phase = {
	PREGAME:0,
	ROLES:1,
	MODTIME:2,
	DAY:3,
	VOTING:4,
	TRIAL:5,
	VERDICTS:6,
	LASTWORDS:7,
	NIGHT:8,
	FIRSTDAY:9
};
//Game variables
var phase = Phase.PREGAME;
var mod = undefined;
var ontrial = undefined;
var apass;
loadPassword();
loadBanlist();
var prev_rolled;
var testTime;
loadDate();
//Banlist
var banlist = [];
//Start the timer.
var timer = Timer();
timer.tick();
timer.ping();
//Let the pinging begin
ping();
var server = http.createServer(function(req,res)
{
	var path = url.parse(req.url).pathname;
	//Routing
	switch (path)
	{
		case '/':
			if (testTime && apass)
			{
				fs.readFile(__dirname + '/index.html', function(error, data){
					if (error){
						res.writeHead(404);
						res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
						res.end();
					}
					else{
						res.writeHead(200, {"Content-Type": "text/html"});
						res.write(data, "utf8");
						res.end();
					}
				});
			}
			else
			{
				res.write('<h1>Server is busy loading... Please wait a few minutes then refresh the page.</h1>');
				res.end();
			}
		break;
		case '/MCP':
			if (req.method == 'POST')
			{	
				var pass;
				req.on('data', function(p) {
					pass=p.toString();
					pass=pass.substring(5,pass.length); //Drop the preceding 'pass='
				});			
				req.on('end', function() {	
					//Check the password.
					if (pass == apass)
					{
						var ip = getIpReq(req);
						if (!verified[ip])
						{
							verified[ip] = setTimeout(function(){
								//Connection expired.
								expireVerification(ip);
							},5*60*1000);
						}
						fs.readFile(__dirname + '/MCP/mod.html', function(error, data){
							if (error){
								res.writeHead(404);
								res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
								res.end();
							}
							else{
								res.writeHead(200, {"Content-Type": "text/html"});
								res.write(data, "utf8");
								res.end();
							}
						});
					}
					else
					{
						fs.readFile(__dirname + '/modpass.html', function(error, data){
							if (error){
								res.writeHead(404);
								res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
								res.end();
							}
							else{
								res.writeHead(200, {"Content-Type": "text/html"});
								res.write(data, "utf8");
								res.end();
							}
						});
					}
				});
				
			}
			else
			{
				fs.readFile(__dirname + '/modpass.html', function(error, data){
					if (error){
						res.writeHead(404);
						res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
						res.end();
					}
					else{
						res.writeHead(200, {"Content-Type": "text/html"});
						res.write(data, "utf8");
						res.end();
					}
				});
			}
		break;
		case '/MCP/Admin':
		case '/MCP/Players':
		case '/MCP/Roles':
		case '/MCP/Banlist':
			if ( isVerified( getIpReq(req) ) )
			{
				fs.readFile(__dirname + path + '.html', 'utf-8',function(error, data){
					if (error){
						res.writeHead(404);
						res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
						res.end();
					}
					else{
						res.writeHead(200, {"Content-Type": "text/html"});
						data = formatData(data);
						res.write(data, "utf8");
						res.end();
					}
				});
			}
			else
			{
				res.write('You do not have permission to access this page.');
				res.end();
			}
		break;
		case '/MCP/setPass':
			if ( isVerified( getIpReq(req) ) )
			{
				var pass = url.parse(req.url).query;
				var statement = 'UPDATE details SET "password"=$1';
				db.query(statement,[pass]);
				res.end();
				apass = pass;
			}
			else
			{
				res.write('You do not have permission to access this page.');
				res.end();
			}
		break;
		case '/MCP/setDate':
			if ( isVerified( getIpReq(req) ) )
			{
				var datetime = url.parse(req.url).query;
				//Make sure the date is in the correct format.
				var sides = datetime.split('-');
				var date = sides[0].split('/');
				var time = sides[1];
				var valid = true;
				var error = '';
				for (i in date)
				{
					if (isNaN(date[i]) || !(date[i].length == 2 || (i==2 && date[i].length == 4)))
					{
						valid = false;
						error = date[i];
						break;
					}
				}
				if (!/\d\d:\d\d/.test(time))
				{
					valid = false;
					error = time;
				}
				if (valid)
				{
					var statement = 'UPDATE details SET "date"=\''+datetime+'\'';
					db.query(statement);
					res.write('success');
					loadDate();
				}
				else
				{
					res.write(error+' is not formatted correctly.');
				}
				res.end();
			}
			else
			{
				res.write('You do not have permission to access this page.');
				res.end();
			}
		break;
		case '/MCP/playerList':
			if ( isVerified( getIpReq(req) ) )
			{
				db.query('SELECT * FROM Players',function(err,result)
				{
					if (err) 
					{	
						res.write('ERROR','utf8');
						res.end();
					}
					else
					{
						res.writeHead(200, {"Content-Type": "text/xml"});
						var send = '<?xml version="1.0" encoding="UTF-8"?><response>';
						for (i in result.rows)
						{
							send+='<name>'+rows[i].name+'</name>';
						}
						send+='</response>';
						res.write(send);
						res.end();
					}
				});
			}
			else
			{
				res.write('You do not have permission to access this page.');
				res.end();
			}
		break;
		case '/play':
			if (req.method == 'POST')
			{	
				var playername;
				req.on('data', function(name) {
					playername=name.toString();
					playername=playername.substring(5,playername.length); //Drop the preceding 'name='
				});
				
				req.on('end', function() {	
					if(Object.keys(players).length <= 15)
					{
						//Check if the name is taken before serving the page.
						if (!nameTaken(playername))
						{			
							if (nameCheck(playername))	
							{		
								var ip = getIpReq(req);
								joining[ip]=playername;
								//Serve the page.
								fs.readFile(__dirname + path + '.html', function(error, data){
									if (error){
										res.writeHead(404);
										res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
										res.end();
									}
									else{
										res.writeHead(200, {"Content-Type": "text/html"});
										res.write(data, "utf8");
										res.end();
									}
								});
							}
							else
							{
								res.write('Invalid name!');
								res.end();
							}
						}			  
						else
						{
							res.write('Sorry, that name was taken!');
							res.end();
						}
					}
					else
					{
						res.write('Sorry, the server is currently full. Please try again later~');
						res.end();
					}
				});
				
			}
			else
			{
				res.writeHead(302, {"Location": "/"}); //Send em home
				res.end();
			}
		break;
		case '/time':
			//Calculate time until the test.
			var now=new Date().getTime();
			var timeToTest = testTime.getTime() - now;
			timeToTest = timeToTest / 1000; //To seconds.
			if (timeToTest > 0)
			{
				res.write(timeToTest+'');
			}
			else
			{
				res.write('now');
			}
			res.end();
		break;
		case '/namecheck':
			var name = url.parse(req.url).query;
			if (name && typeof name == 'string')
			{
				res.writeHead(200, {"Content-Type": "text/plain"});
				if (nameTaken(name))
				{
					res.write('taken');
				}
				else if (name.length == 0)
				{
					res.write('empty');
				}
				else if (name.toLowerCase() == 'empty')
				{
					res.write('lol');
				}
				else if (name.length>20)
				{
					res.write('toolong');
				}
				else if ( !( /[a-z]/i.test(name) ) )
				{
					res.write('noletters');
				}
				else if (/^[a-z0-9-_]+$/i.test(name))
				{
					res.write('good');
				}
				else
				{
					res.write('invalid');
				}
			}
			else
			{
				res.write('empty');
			}
			res.end();
		break;
		case '/socketstuff.js':
		case '/script.js':
		case '/playscript.js':
		case '/MCP/modscript.js':
		case '/MCP/passscript.js':
		case '/jquery-2.1.4.min.js':
		case '/glDatePicker.min.js':
			fs.readFile(__dirname + path, function(error, data){
				if (error){
					res.writeHead(404);
					res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
					res.end();
				}
				else{
					res.writeHead(200, {"Content-Type": "text/js"});
					res.write(data, "utf8");
					res.end();
				}
			});
		break;
		case '/style.css':
		case '/playstyle.css':
		case '/MCP/modstyle.css':
		case '/MCP/calstyles/glDatePicker.default.css':
		case '/MCP/calstyles/glDatePicker.darkneon.css':
		case '/MCP/calstyles/glDatePicker.flatwhite.css':
			fs.readFile(__dirname + path, function(error, data){
				if (error){
					res.writeHead(404);
					res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
					res.end();
				}
				else{
					res.writeHead(200, {"Content-Type": "text/css"});
					res.write(data, "utf8");
					res.end();
				}
			});
		break;
		case '/invest.png':
		case '/sheriff.png':
		case '/moon.png':
		case '/maf.png':
		case '/mayor.png':
		case '/med.png':
		case '/jailor.png':		
		case '/spy.png':		
		case '/will.png':
		case '/willicon.png':
		case '/button.png':
		case '/list.png':
		case '/settings.png':
		case '/edit.png':
		case '/accept.png':
		case '/roll.png':
		case '/back3.png':
			fs.readFile(__dirname + '/images/' + path, function(error, data){
				if (error){
					res.writeHead(404);
					res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
					res.end();
				}
				else{
					res.writeHead(200, {"Content-Type": "text/png"});
					res.write(data, "utf8");
					res.end();
				}
			});
		break;
		case '/dancingkitteh.gif':
			fs.readFile(__dirname + '/images/' + path, function(error, data){
				if (error){
					res.writeHead(404);
					res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
					res.end();
				}
				else{
					res.writeHead(200, {"Content-Type": "text/gif"});
					res.write(data, "utf8");
					res.end();
				}
			});
		break;
		case '/ping.wav':
		case '/lobby.wav':
			fs.readFile(__dirname + '/sounds/' + path, function(error, data){
				if (error){
					res.writeHead(404);
					res.write("<h1>Oops! This page doesn\'t seem to exist! 404</h1>");
					res.end();
				}
				else{
					res.writeHead(200, {"Content-Type": "text/wav"});
					res.write(data, "utf8");
					res.end();
				}
			});
		break;
        default:
			res.writeHead(404);
			res.write('<h1>Oops! This page doesn\'t seem to exist! 404</h1>');
			res.end();
		break;
	}

});
var port = process.env.PORT || 8080;
server.listen(port, function(){
		console.log('Listening on port '+port+'...');
});

//Server variables
//List of player objects.
var players = [];
//To store the order of players.
var playernums = [];
//List of ip's waiting to join.
var joining = [];
//List of names with their socket.id's. Needed to provide quick access to the player objects.
var playernames = [];
//Array to hold the info of players that have dc'd. Maximum of 20 players and players are removed after 5 minutes.
var dcd = [];

io.listen(server);
io.on('connection', function(socket){
	var ip=getIp(socket);
	var banned = false;
	var reason = '';
	for (i in banlist)
	{
		if (banlist[i].ip == ip)
		{
			banned = true;
			reason = banlist[i].reason;
		}
	}
	if (banned)
	{
		socket.emit(Type.SYSTEM,'This ip is banned. Reason: '+reason+'.<br>If you believe this to be in error, contact <a href="http://www.blankmediagames.com/phpbb/memberlist.php?mode=viewprofile&u=1270513">Ralozey</a> at the Town of Salem forums.');
		socket.emit(Type.KICK);
		console.log('Connection attempt from banned ip: '+ip);
		socket.disconnect();
	}
	else
	{
		//Check if the person is an alt.
		var alts = [];
		for (i in players)
		{
			if (ip == players[i].ip)
			{
				alts.push(players[i].name);
			}
		}
		//Second check for the name being taken
		if (!nameTaken(joining[ip]))
		{
			if ( dcd[ip] && alts.length == 0 && (!joining[ip] || (joining[ip] && joining[ip] == dcd[ip].name) ) ) //Rejoining after a dc
			{
				//Send the list of names in the game to the returning player.
				var namelist = [];
				//Send the roles of any dead players
				for (i in playernums)
				{
					var p={};
					p.name = players[playernums[i]].name;
					if (!players[playernums[i]].alive)
					{
						p.role = players[playernums[i]].role;
					}
					namelist.push(p);
				}
				socket.emit(Type.PAUSEPHASE,timer.paused);
				socket.emit(Type.SETDAYNUMBER,gm.getDay());
				//If the player is first, set them as the mod.
				if (Object.keys(players).length==0)
				{
					mod = socket.id;
					socket.emit(Type.SETMOD,true);
				}
				else
				{
					socket.emit(Type.SETMOD,false);
				}
				//Welcome back!
				players[socket.id]=dcd[ip];
				//Replace the old socket.
				players[socket.id].s = socket;
				//Reset ping.
				players[socket.id].ping = 0;
				
				playernums.push(socket.id);
				playernames[players[socket.id].name] = socket.id;
				
				socket.emit(Type.ROOMLIST,namelist);
				
				socket.emit(Type.ACCEPT);
				socket.emit(Type.SYSTEM,'You have reconnected.');
				var name = players[socket.id].name;
				//Inform everyone of the new arrival.
				io.emit(Type.JOIN,name,true);
				//Tell the new arrival what phase it is.
				socket.emit(Type.SETPHASE,phase,true,timer.time);
				
				var send = {};
				
				for (i in players[socket.id].chats)
				{
					if (players[socket.id].chats[i])
					{
						send[i] = players[socket.id].chats[i];
					}
				}
				//Exceptions
				send.name = players[socket.id].name;
				send.alive = players[socket.id].alive;
				send.spy = players[socket.id].hearwhispers;
				send.mayor = (players[socket.id].mayor !== undefined);
				send.role = players[socket.id].role;
				if (players[mod])
				{
					players[mod].s.emit(Type.ROLEUPDATE,send);
				}
				//Resend the list.
				var namelist = [];
				//Send the roles of any dead players
				for (i in playernums)
				{
					var p={};
					p.name = players[playernums[i]].name;
					if (!players[playernums[i]].alive)
					{
						p.role = players[playernums[i]].role;
					}
					namelist.push(p);
				}
				socket.emit(Type.ROOMLIST,namelist);
				//Set the rejoining player's will.
				socket.emit(Type.GETWILL,undefined,players[socket.id].will);
			}
			else if (joining[ip])
			{
				socket.emit(Type.PAUSEPHASE,timer.paused);
				socket.emit(Type.SETDAYNUMBER,gm.getDay());
				//If the player is first, set them as the mod.
				if (Object.keys(players).length==0)
				{
					mod = socket.id;
				}
				//Send the list of names in the game to the new arrival
				var namelist = [];
				//Send the roles of any dead players
				for (i in playernums)
				{
					var p={};
					p.name = players[playernums[i]].name;
					if (!players[playernums[i]].alive)
					{
						p.role = players[playernums[i]].role;
					}
					namelist.push(p);
				}
				socket.emit(Type.ROOMLIST,namelist);
				var name = joining[ip];
				delete joining[ip];
				players[socket.id]= Player(socket,name,ip);
				//Inform everyone of the new arrival.
				io.emit(Type.JOIN,name);
				if (alts.length > 0) //Inform everyone of the alt.
				{
					io.emit(Type.HIGHLIGHT,'Please be aware that '+name+' is an alt of '+gm.grammarList(alts)+'.');
				}
				//Tell the new arrival what phase it is.
				socket.emit(Type.SETPHASE,phase, true, timer.time);
				//Inform the new arrival of any devs present.
				for (i in players)
				{
					if (players[i].dev)
					{
						socket.emit(Type.SETDEV,players[i].name);
					}
				}
			}
			else
			{
				socket.disconnect();
			}
		}
		else
		{
			socket.emit(Type.DENY,'Sorry, this name is taken.');
			socket.disconnect();
		}
	}
	socket.on(Type.AUTOLEVEL,function(lvl){
		if (socket.id == mod)
		{
			autoLevel = lvl;
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can set the level of automation.');
		}
	});
	socket.on(Type.MSG,function(msg)
	{
		msg=sanitize(msg);
		if (msg.length > 200)
		{
			socket.emit(Type.SYSTEM,'Your message was too long.');
		}
		else if (msg.trim() == '')
		{
			socket.emit(Type.SYSTEM,'Cannot send an empty message.');
		}
		else if (msg[0]=='/')
		{
			players[socket.id].command(msg.substring(1,msg.length));
		}
		else
		{
			players[socket.id].message(msg);
		}
	});
	socket.on(Type.CUSTOMROLES,function(bool){
		roles.setCustomRoles(bool);
	});
	socket.on(Type.PRENOT,function(name,prenot)
	{
		if (socket.id == mod)
		{
			var player = getPlayerByName(name);
			switch (prenot)
			{
			 case 'HEAL':
				players[mod].s.emit(Type.SYSTEM,name+' was attacked and healed.');
			 break;
			 case 'DEAD':         
				players[mod].s.emit(Type.SYSTEM,name+' was killed.');
			 break;
			 case 'DOUSE':         
				players[mod].s.emit(Type.SYSTEM,name+' was doused.');
			 break;
			 case 'BLACKMAIL':
				players[mod].s.emit(Type.SYSTEM,name+' was blackmailed.');
			 break;
			 case 'TARGETIMMUNE':
				players[mod].s.emit(Type.SYSTEM,name+' attacked an immune target.');
			 break;
			 case 'IMMUNE':
				players[mod].s.emit(Type.SYSTEM,name+' was attacked but immune.');
			 break;
			 case 'SHOTVET':
				players[mod].s.emit(Type.SYSTEM,name+' was shot by a Veteran.');
			 break;
			 case 'VETSHOT':
				players[mod].s.emit(Type.SYSTEM,name+' attacked a visitor.');
			 break;
			 case 'RB':
				players[mod].s.emit(Type.SYSTEM,name+' was roleblocked.');
			 break;
			 case 'WITCHED':
				players[mod].s.emit(Type.SYSTEM,name+' was controlled.');
			 break;
			 case 'REVIVE':
				players[mod].s.emit(Type.SYSTEM,name+' was revived.');
			 break;
			 case 'JAILED':
				players[mod].s.emit(Type.SYSTEM,name+' was hauled off to jail.');
			 break;
			}
			player.s.emit(Type.PRENOT,prenot);
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.ROLL,function(rolelist, custom, exceptions)
	{
		if (socket.id == mod)
		{
			var result = roles.sortRoles(rolelist, custom, exceptions);
			createdList = rolelist
			var names = Object.keys(playernames);
			names.splice(names.indexOf(players[mod].name),1); //Get rid of the mod.
			shuffleArray(names);
			//Format the roles
			for (i in result)
			{
				result[i] = roles.formatAlignment(result[i]);
			}
			socket.emit(Type.ROLL,result,names,[]);
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.SETROLE,function(name,role)
	{
		if (socket.id == mod)
		{
			role = sanitize(role);
			if (role.length > 16)
			{
				socket.emit(Type.SYSTEM,'Role name cannot be more than 16 characters.');
			}
			else
			{
				var p = getPlayerByName(name);
				if (p)
				{
					p.setRole(role);
				}
				else
				{
					socket.emit(Type.SYSTEM,'Invalid name "'+name+'", did you break something?');
				}
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.SETROLESBYLIST,function(roles,names){
		if (socket.id == mod)
		{
			prev_rolled = roles;
			for (i in names)
			{
				if (roles[i].length > 16)
				{
					socket.emit(Type.SYSTEM,'Invalid rolelist! Role name cannot be more than 16 characters: '+roles[i]);
					break;
				}
				var p = getPlayerByName(names[i]);
				if (p)
				{
					roles[i] = sanitize(roles[i]);
					p.setRole(roles[i]);
				}
				else
				{
					socket.emit(Type.SYSTEM,'Invalid rolelist! Could not find player: '+names[i]);
					break;
				}
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,"Only the mod can do that.");
		}
	});
	socket.on(Type.GETWILL,function(num)
	{
		if (socket.id == mod)
		{
			var p = getPlayerByNumber(num);	
			if (p)
			{
				socket.emit(Type.GETWILL,p.name,p.will);
			}
			else
			{
				socket.emit(Type.SYSTEM,"Invalid player number: "+num);
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,"Only the mod can do that.");
		}
	});
	socket.on(Type.SHOWLIST,function(list)
	{
		if (socket.id == mod)
		{
			for (i in list)
			{
				list[i] = sanitize(list[i]);
				list[i] = roles.formatAlignment(list[i]);
			}
			if (!players[socket.id].silenced)
			{
				io.emit(Type.SHOWLIST,list);
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.SHOWALLROLES,function()
	{
		if (socket.id == mod)
		{
			var c = 0;
			var list = [];
			for (i in players)
			{
				if (players[i].s.id != mod)
				{
					
					list.push({name:players[i].name, role:roles.formatAlignment(players[i].role)});
					c++;
				}
			}
			if (players[socket.id])
			{
				io.emit(Type.SHOWALLROLES,list);
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.SETPHASE,function(p){
		if (mod==socket.id && p>=0 && p < Object.keys(Phase).length)
		{
			setPhase(p);
		}	
	});
	socket.on(Type.SETDAYNUMBER,function(num){
		if (socket.id == mod)
		{
			gm.setDay(num);
			io.emit(Type.SETDAYNUMBER,gm.getDay());
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can set the day number.');
		}
	});
	socket.on(Type.PAUSEPHASE,function(){
		if (mod == socket.id)
		{
			timer.paused = !timer.paused;
			io.emit(Type.PAUSEPHASE,timer.paused);
		}
		else
		{
			socket.emit(Type.SYSTEM,'You need to be the mod to pause or unpause.');
		}
	});
	socket.on(Type.WILL,function(will,name)
	{
		if (will !== undefined && will !== null)
		{
			if (name && mod == socket.id)
			{
				var p = getPlayerByName(name);
				if (p)
				{
					p.will = will;
				}
				else
				{
					socket.emit(Type.SYSTEM,'Invalid player name:'+name);				
				}
			}
			else
			{
				players[socket.id].will = will;	
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,'You sent a null will. Did you break something?');			
		}
	});
	socket.on(Type.TOGGLELIVING,function(name)
	{
		if (socket.id == mod)
		{
			var player = getPlayerByName(name);
			if (player)
			{
				player.alive = !player.alive;
				player.chats.dead = !player.chats.dead;
				if (player.alive)
				{
					if (!players[socket.id].silenced)
					{
						io.emit(Type.HIGHLIGHT,name+' has been revived!');
						player.s.emit(Type.PRENOT,'REVIVE');
					}
					io.emit(Type.TOGGLELIVING,{name:name});
				}
				else
				{
					if (!players[socket.id].silenced)
					{
						io.emit(Type.HIGHLIGHT,name+' has died!');
						io.emit(Type.HIGHLIGHT,'Their role was '+player.role);
						var show = sanitize(player.will);
						show = show.replace(/(\n)/g,'<br />');
						if (!player.cleaned)
						{
							io.emit(Type.WILL,show);
						}
						else
						{
							io.emit(Type.HIGHLIGHT,'We could not find a last will.');
						}
						player.s.emit(Type.PRENOT,"DEAD");
					}
					io.emit(Type.TOGGLELIVING,{name:name,role:player.role});
				}
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.VOTE,function(name)
	{
		players[socket.id].vote(name);
	});
	socket.on(Type.TOGGLE,function(name,chat)
	{
		if (socket.id == mod)
		{
			var player = players[playernames[name]];
			if (player)
			{
				if (player.chats[chat]!==undefined) //Chat related role modifiers.
				{
					player.chats[chat] = !player.chats[chat];
					var notify;
					if (player.chats[chat])
					{
						switch (chat)
						{
							case 'jailor':
								player.jailorcom = true;
								if (!players[socket.id].silenced)
								{
									player.s.emit(Type.SYSTEM,'You are now the jailor. Use /jail [target] to jail. Use /execute, /exe or /x to execute your prisoner. Do not use this command on the first night.');
								}
							break;
							case 'jailed': notify = undefined; break; //No message
							case 'medium': 
								notify = 'You can now hear the dead at night.'; 
								player.canSeance = true;
							break;
							default: notify = 'You can now talk in the '+chat+' chat.'; break;
						}
					}
					else
					{
						switch (chat)
						{
							case 'jailor':
								player.jailorcom = false;
								if (!players[socket.id].silenced)
								{
									player.s.emit(Type.SYSTEM,'You are no longer the jailor.');
								}
							break;
							case 'jailed': notify = undefined; break; //No message
							case 'medium': 
								notify = 'You can no longer hear the dead at night.'; 
								player.canSeance = false;
							break;
							default: notify = 'You can no longer talk in the '+chat+' chat.'; break;
						}	
					}
					if (!players[socket.id].silenced)
					{
						if (notify) player.s.emit(Type.SYSTEM,notify)	
					}
				}
				else
				{
					switch (chat)
					{
						case 'mayor': 
							if (player.mayor === undefined)
							{
								player.mayor = false; //False, meaning not revealed.
								if (!players[socket.id].silenced)
								{
									player.s.emit(Type.SYSTEM,'You are now the Mayor! Use /reveal to reveal yourself and get 3 votes.');
								}
							}
							else
							{
								player.mayor = undefined; //Undefined, meaning not mayor.
								if (!players[socket.id].silenced)
								{
									player.s.emit(Type.SYSTEM,'You are no longer the Mayor.');
								}
							}
						break;
						break;						
						case 'spy': 
							player.hearwhispers = !player.hearwhispers;
							if (!players[socket.id].silenced)
							{
								if (player.hearwhispers)
								{
									player.s.emit(Type.SYSTEM,'You can now hear whispers.');
								}
								else
								{
									player.s.emit(Type.SYSTEM,'You can no longer hear whispers.');
								}
							}
						break;				
						case 'blackmail': 
							player.blackmailed = !player.blackmailed;
							if (!players[socket.id].silenced)
							{
								if (player.blackmailed)
								{
									player.s.emit(Type.PRENOT,'BLACKMAIL');
									players[mod].s.emit(Type.SYSTEM,player.name+' is now blackmailed.');
								}
								else
								{
									player.s.emit(Type.SYSTEM,'You are no longer blackmailed.');
									players[mod].s.emit(Type.SYSTEM,player.name+' is no longer blackmailed.');
								}
							}
						break;				
						default: 
							socket.emit(Type.SYSTEM,'Invalid chat selection. Did you break something?');
						break;	
					}
				}
			}
			else
			{
				socket.emit(Type.SYSTEM,'Invalid user "'+name+'"! Did you break something?');
			}
		}
		else
		{
			socket.emit(Type.SYSTEM,'Only the mod can do that.');
		}
	});
	socket.on(Type.VERDICT,function(verdict)
	{
		players[socket.id].castVerdict(verdict);
	});
	//socket.on(TYPE.ROLELIST, function()
	//{
	//	for (role in createdList)
	//	{
	//		socket.emit(role);
	//	}
	//	socket.emit		
	//});
	socket.on(Type.PONG,function()
	{
		players[socket.id].ping = players[socket.id].pingTime;
	});
	socket.on('disconnect',function()
	{
		io.emit(Type.LEAVE,players[socket.id].name);
		players[socket.id].dc();	
	});
});
//Functions
function nameTaken(name)
{
	var match=false;
	for (i in players)
	{
		if (name == players[i].name)
		{
			match=true;
		}
	}
	return match;
}
function nameCheck(name)
{
	return ( name && typeof name == 'string' && name.length != 0 && name.length<=20 &&  /[a-z]/i.test(name) && /^[a-z0-9-_]+$/i.test(name));
}
function sanitize(msg)
{
  msg=msg.replace(/&/g,"&amp"); //This needs to be replaced first, in order to not mess up the other codes.
  msg=msg.replace(/</g,"&lt;");
  msg=msg.replace(/>/g,"&gt;");
  msg=msg.replace(/\"/g,"&quot;");
  msg=msg.replace(/\'/g,"&#39;");
  msg=msg.replace(/:/g,"&#58;");
  return msg;
}
//Getting players
function getPlayerByName(name)
{
	if (playernames[name])
	{
		//Valid
		return players[playernames[name]];
	}
	else
	{
		return false;
	}
}
function getPlayerByNumber(num)
{
	var p = playernums[num];
	if (p)
	{
		return players[p];
	}
	//We tried, can't find it.
	return -1;
}
//--Phase change
function setPhase(p)
{
	if (phase >= Phase.DAY && phase <= Phase.FIRSTDAY && p <= Phase.MODTIME)
	{
		if (autoLevel > 0 )
		{
			//Evaluate night actions.
			var results = gm.evaluate(players,playernames,mod,roles, autoLevel, phase);
			players[mod].s.emit(Type.SUGGESTIONS, results);
			gm.clear();
		}
		for (i in players)
		{
			if (players[i].seancing)
			{
				players[i].seancing.beingSeanced = undefined;
				players[i].seancing = undefined;
			}
		}
	}
	phase = p;
	timer.setPhase(p);
	io.emit(Type.SETPHASE,phase, false, timer.time);
	//Reset all silenced players. And the medium seancing
	for (i in players)
	{
		if (players[i].silenced)
		{
			players[i].silenced = undefined;
			players[i].s.emit(Type.SYSTEM, "You are no longer silenced.");
		}
	}
	if (p == Phase.PREGAME)
	{
	for (i in players)
	{
		{
			players[i].seance = undefined;
			players[i].lobby.play();
		}
	}
	if (p == Phase.NIGHT)
	{
		//Reset cleaning.
		//Special beginning of night messages.
		for (i in players)
		{
			//Reset cleaning
			if (players[i].cleaned)
			{
				players[i].cleaned = false;
				players[mod].s.emit(Type.SYSTEM,players[i].name+ "\'s Last Will will show upon death.");
			}
			//Werewolf transforming
			var n = gm.getDay();
			if (n % 2 == 0 && players[i].role.toLowerCase() == 'werewolf') //Even number, full moon
			{
				players[i].s.emit(Type.SYSTEM,'The light of the full moon has transformed you into a rampaging Werewolf!');
			}
			//Jailed player
			if (players[i].chats.jailed)
			{
				players[i].s.emit(Type.PRENOT,'JAILED');
				//inform the jailor of their success.
				for (j in players)
				{
					if (players[j].chats.jailor)
					{
						players[j].s.emit(Type.PRENOT,'JAILING');
						players[j].executing = false;
					}
					if (players[j].chats.mafia && !players[j].chats.jailed && players[i].chats.mafia)
					{
						players[j].s.emit(Type.SYSTEM,players[i].name+' was hauled off to jail.');
					}
				}
			}
			//Target info, else if because you do not recieve it if you are jailed.
			else if (i != mod && players[i].alive)
			{
				players[i].s.emit(Type.SYSTEM,'Use "/target name" or "/t name" to send in your night action.');
			}
			//Medium messages.
			if (players[i].seancing)
			{
				players[i].s.emit(Type.SYSTEM, "You have opened a communication with the living!");
				players[i].seance = true;
				players[mod].s.emit(Type.SYSTEM,players[i].name+ " is now talking to " +players[i].seancing.name);
				players[i].seancing.s.emit(Type.SYSTEM, "A medium is talking to you!");
				players[i].canSeance = true;
			}
		}	
	}
	else
	{
		for (i in players)
		{
		players[i].lobby.stop();
		}
	}
	}
	if (p == Phase.VERDICTS)
	{
		if (ontrial)
		{
			io.emit(Type.HIGHLIGHT,'Cast your votes now.');
		}
		else
		{
			players[mod].s.emit(Type.SYSTEM,'No player is currently on trial. Phase is being set back to voting.');
			p=Phase.VOTING;
			io.emit(Type.SETPHASE,Phase.VOTING, false, timer.time);
		}
	}
	if (p == Phase.VOTING)
	{
		clearVotes();
	}
	if (p == Phase.FIRSTDAY)
	{
		var mafmembers;
		mafmembers = "Your partners in crime are:"
		for (i in players)
		{
			if (players[i].chats.mafia)
			{
				mafmembers = mafmembers + " " + players[i].name + " (" + players[i].role + ")";
			}			
		}
		for (i in players)
		{
			if (players[i].chats.mafia)
			{
				players[i].s.emit(Type.SYSTEM, mafmembers);
			}			
		}
	}
	if (p == Phase.ROLES)
	{
		for (i in players)
		{
			players[i].confirm = false;
			if (i != mod)
			{
				players[i].s.emit(Type.SYSTEM,'Please type /confirm if you have received a role and are ready to play.');
			}
		}
		
	}
}
//--IP functions
function getIp(socket)
{
	return (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address || '127.0.0.1');
}
function getIpReq(req)
{
	return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
}
//--Number of living players
function numLivingPlayers()
{
	var c = 0;
	for (i in players)
	{
		if (players[i].alive && i!=mod)
		{
			c++;
		}
	}
	return c;
}
//--Clear the votes, used when putting someone on trial or entering the voting phase.
function clearVotes()
{
	for (i in players)
	{
		players[i].votes = 0;
		players[i].votingFor = undefined;
		io.emit(Type.CLEARVOTES);	
	}
}
//--Check if the player is on trial
function trialCheck(player)
{
	//Check if the player has been put on trial
	var living = numLivingPlayers();
	var threshold = Math.floor(living/2) +1;
	if (player.votes >= threshold)
	{
		//Put the player on trial.
		clearVotes();
		setPhase(Phase.TRIAL);
		io.emit(Type.HIGHLIGHT,player.name+' has been put on trial. What is your defense?');
		io.emit(Type.SETPHASE,phase,true,timer.time);
		ontrial = player.s.id;
	}
}
//--Save the info of a dc'd players.
function dcStore(p)
{
	if (Object.keys(dcd).length <= 20)
	{
		dcd[p.ip] = p;
		setTimeout(function()
		{
			if (p)
			{
				p.clear();
			}
		},5*60*1000); // 5 minutes.
	}
}
function isVerified(ip)
{
	if (verified[ip])
	{
		//Reset timeout.
		clearTimeout(verified[ip]);
		verified[ip]=setTimeout(function(){
			expireVerification(ip);
		},5*60*1000);
		return true;
	}
	else
	{
		return false;
	}
}
function expireVerification(ip)
{
	if (verified[ip])
	{
		delete verified[ip];
	}
}
//--Timer object

function Timer() 
{
	return {
		paused:false,
		time:0,
		buffertime:undefined,
		phase:[0,0,0, //Pregame, Roles, Modtime.
			60, //Day
			30, //Voting
			20, //Trial
			20, //Verdict
			5, //Last words
			60, //Night
			30 //Day 1
			],
		tock:function(){
			switch (phase)
			{
				case Phase.DAY:
					//Change to voting.
					setPhase(Phase.VOTING);
				break;
				case Phase.VOTING:
				case Phase.NIGHT:
					var prevphase = phase;
					//Change to modtime.
					setPhase(Phase.MODTIME);
				break;
				case Phase.TRIAL:
					//Change to verdicts.
					setPhase(Phase.VERDICTS);
				break;
				case Phase.VERDICTS:
					//Count the verdicts and declare the person guilty or inno.
					var result=0;
					var votes = {};
					for (i in players)
					{
						if (players[i].alive && players[i].s.id != mod && players[i].s.id != ontrial)
						{
							result+=players[i].verdict;
							votes[players[i].name]=players[i].verdict;
						}
						players[i].verdict=0;
					}
					if (result<0) //Guilty, die!
					{
						setPhase(Phase.LASTWORDS);
					}
					else //Innocent
					{
						setPhase(Phase.VOTING);
					}
					io.emit(Type.JUDGEMENT,votes,(result<0));
				break;
				case Phase.LASTWORDS:
					//Change to modtime.
					setPhase(Phase.MODTIME);
				break;
				case Phase.FIRSTDAY:
					//Change to modtime.
					setPhase(Phase.MODTIME);
				break;
			}
		},
		tick: function(){
			if (!this.paused)
			{
				if (this.time>0) 
				{
					this.time--;
				}
				else
				{
					this.tock();
				}
				io.emit(Type.TICK,this.time);
			}
			setTimeout(function()
			{
				timer.tick();
			},1000);
		},
		ping: function(){
			for (i in players)
			{
				if (players[i].ping == -1)
				{
					players[i].pingTime+=10;
				}
			}
			setTimeout(timer.ping,10);
		},
		setPhase: function(num){
			if (num == Phase.TRIAL)
			{
				this.buffertime = this.time;
				this.time = this.phase[num];
			}
			else if (num==Phase.VOTING && this.buffertime)
			{
				this.time=this.buffertime;
				this.buffertime = undefined;
			}
			else if (num == Phase.LASTWORDS)
			{
				this.buffertime = undefined; 
				this.time = this.phase[num];
			}
			else
			{
				this.time = this.phase[num];
			}
		}
	}
}
function formatData(data){
	var date = addZero(testTime.getDate()+1)+'/'+addZero(testTime.getMonth()+1)+'/'+testTime.getFullYear();
	data = data.replace('%date%',date);
	var time = addZero(testTime.getHours())+':'+addZero(testTime.getMinutes());
	data = data.replace('%time%',time);
	return data;
}
function addZero(num)
{
	if ((num+'').length == 1)
	{
		num = '0'+num;
	}
	return num;
}
function loadDate()
{
	console.log("Loading date...");
	db.query('SELECT * FROM details',function(err,result)
	{
		if (err)
		{
			console.log('Could not load date.');
			throw err;
		}	
		else
		{
			datetime = result.rows[0].date;
			var sides = datetime.split('-');
			var date = sides[0].split('/');
			var time = sides[1].split(':');
			testTime = new Date( //GMT
				parseInt(date[2]), //Years
				parseInt(date[1])-1, //Month
				parseInt(date[0]), //Day
				parseInt(time[0]), //Hours
				parseInt(time[1])//Minutes
			); 
			console.log("Date loaded.");
		}
	});
}
function loadBanlist()
{
	console.log("Loading banlist...");
	db.query('SELECT * FROM banlist',function(err,result)
	{
		if (err)
		{
			console.log('Could not load password.');
			throw err;
		}	
		else
		{
			banlist = result.rows;
			console.log('Banlist loaded.');
		}
	});
}
function loadPassword()
{
	console.log("Loading password...");
	db.query('SELECT * FROM details',function(err,result)
	{
		if (err)
		{
			console.log('Could not load password.');
			throw err;
		}	
		else
		{
			apass = result.rows[0].password;
			console.log('Password is: '+apass);
		}
	});
}
function showConfirms()
{
	var c = 0;
	var unconfirmed = [];
	for (i in players)
	{
		if (players[i].confirm)
		{
			c++;
		}
		else if (mod != players[i].s.id)
		{
			unconfirmed.push(players[i].name);
		}
	}
	var total = (Object.keys(players).length-1);
	if (c < total)
	{
		io.emit(Type.SYSTEM,c+'/'+total+' players confirmed.');
		io.emit(Type.SYSTEM,'Unconfirmed: '+unconfirmed.join(', '));
	}
	else
	{
		io.emit(Type.SYSTEM,'All players confirmed.');
	}
}
//Pinging functions
function ping()
{
	for (i in players)
	{
		players[i].ping = -1;
		players[i].pingTime = 0;
		players[i].s.emit(Type.PING);
	}
	setTimeout(checkPing,10000);
}
function checkPing()
{
	for (i in players)
	{
		if (players[i].ping == -1)
		{
			//Player did not reply after 10 seconds. Disconnected.
			players[i].s.disconnect();
		}
	}
	setTimeout(ping,0);
}
//Durstenfeld shuffle
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
//Send all info about players to the new mod
function sendPlayerInfo()
{
	var final = [];
	for (j in players)
	{
		var send = {};
		for (i in players[j].chats)
		{
			if (players[j].chats[i])
			{
				send[i] = players[j].chats[i];
			}			
		}
		//Exceptions
		send.name = players[j].name;
		send.alive = players[j].alive;
		send.spy = players[j].hearwhispers;
		send.mayor = (players[j].mayor !== undefined);
		send.jailor= (players[j].jailor !== undefined);
		send.role = players[j].role;
		
		final.push(send);
	}
	players[mod].s.emit(Type.MASSROLEUPDATE,final);
}
//--Player object
function Player(socket,name,ip)
{
	//Add to the playernames array, allowing this object to be referenced by name.
	playernames[name] = socket.id;
	//Add to the playernums array, allowing this object to be referenced by number.
	playernums.push(socket.id);
	return {
			s:socket,
			name:name,
			dev:false,
			ip:ip, 
			will:'',
			ping:0,
			pingTime:0,
			fault:0,
			role:'NoRole',
			alive:true,
			canSeance:false,
			votelock:false,
			mayor:undefined,
			jailorcom:false,
			spectate:undefined,
			afk:undefined,
			seance:undefined,
			blackmailed:false,
			hearwhispers:false,
			votingFor:undefined,
			confirm:false,
			executing:false,
			votes:0,
			verdict:0, //0 for abstain, -1 for guilty, 1 for inno
			chats:{
				dead:false,
				mafia:false,
				jailor:false,
				jailed:false,
				medium:false
			},
			//Player functions
			setRole:function(role){
				this.role = role;
				if (role.trim().length == 0)
				{
					this.role = 'NoRole';
					this.s.emit(Type.System,'Your role has been removed.');
				}
				else if (roles.hasRolecard(role))
				{
					var rolecard = roles.getRoleCard(role, {});
					this.s.emit(Type.ROLECARD,rolecard);
				}
				else
				{
					this.s.emit(Type.SYSTEM,'Your role is '+role);
				}
			},
			dc:function(){
				//Store the player's info in case they rejoin.
				dcStore(this);
				//Splice them from the numbers array.
				playernums.splice(playernums.indexOf(this.s.id),1);
				delete playernames[this.name];
				delete players[this.s.id];
				if (mod == this.s.id) //Player was mod, give it to someone else.
				{
					if (Object.keys(players).length > 0 )
					{
						mod = getPlayerByNumber(0).s.id;
						players[mod].s.emit(Type.SETMOD,true);
						sendPlayerInfo();
					}
				}
			},
			castVerdict:function(verdict, forced)
			{
				if (ontrial == this.s.id)
				{
					this.s.emit(Type.SYSTEM,'You cannot vote on your own trial.');
				}
				else if (!this.alive)
				{
					this.s.emit(Type.SYSTEM,'You need to be alive to vote.');
				}
				else if (this.votelock && !forced)
				{
					this.s.emit(Type.SYSTEM,'You cannot cast a verdict while votelocked.');
				}
				else
				{
					var name = this.name;
					if (verdict === true) //Inno
					{
						if (this.verdict == 1) //Already inno, cancel
						{
							this.verdict = 0;
							io.emit(Type.VERDICT,name,2);
						}
						else if (this.verdict == -1) //Guilty, change
						{
							this.verdict = (this.mayor)?3:1;
							io.emit(Type.VERDICT,name,1);
						}
						else
						{
							this.verdict = (this.mayor)?3:1;;
							io.emit(Type.VERDICT,name,0);
						}
					}
					else if (verdict === false) //Guilty
					{
						if (this.verdict == -1) //Already guilty, cancel
						{
							this.verdict = 0;
							io.emit(Type.VERDICT,name,2);
						}
						else if (this.verdict == 1) //Inno, change
						{
							this.verdict = (this.mayor)?-3:-1;;
							io.emit(Type.VERDICT,name,1);
						}
						else
						{
							this.verdict = (this.mayor)?-3:-1;;
							io.emit(Type.VERDICT,name,0);
						}
					}
				}
			},
			vote:function(name, forced){
				if (phase != Phase.VOTING)
				{
					socket.emit(Type.SYSTEM,'You can only vote in the voting phase.');
				}
				else if (!this.alive)
				{
					socket.emit(Type.SYSTEM,'You need to be alive to vote.');
				}
				else
				{
					var player = getPlayerByName(name);
					if (player)
					{
						if (this.votelock && !forced)
						{
							this.s.emit(Type.SYSTEM,'Your vote has been locked by the mod. You cannot vote or cancel your vote until it is unlocked.');
						}
						else if (name == this.name && !forced)
						{
							this.s.emit(Type.SYSTEM,'You cannot vote for yourself.');
						}
						else if (name == players[mod].name)
						{
							this.s.emit(Type.SYSTEM,'You cannot vote for the mod.');
						}
						else if (this.s.id == mod)
						{
							this.s.emit(Type.SYSTEM,'The mod cannot vote.');
						}
						else if (this.votingFor == player.s.id) //Same person, cancel vote.
						{
							var prev = player.name;
							if (this.mayor)
							{
								players[this.votingFor].votes-=3;	
							}
							else
							{
								players[this.votingFor].votes--; //subtract a vote from the person that was being voted.
							}
							if (!this.silenced)
							{
								io.emit(Type.VOTE,this.name,' has cancelled their vote.','',prev);
							}
							this.votingFor = undefined;
						}
						else if (this.votingFor) //Previous voter
						{
							var prev = this.votingFor;
							if (this.mayor)
							{
								players[prev].votes-=3; //subtract 3 votes from the person that was being voted.		
								player.votes+=3; //Add 3 votes to the new person		
							}
							else if (players[prev])
							{
								players[prev].votes--; //subtract a vote from the person that was being voted.		
								player.votes++; //Add a vote to the new person			
							}		
							if (!this.silenced)
							{			
								io.emit(Type.VOTE,this.name,' has changed their vote to ',player.name,players[prev].name);
							}
							this.votingFor = player.s.id;					
						}
						else
						{ 
							if (!this.silenced)
							{
								io.emit(Type.VOTE,this.name,' has voted for ',player.name);
							}
							this.votingFor = player.s.id;
							if (this.mayor)
							{	
								player.votes+=3;
							}
							else
							{
								player.votes++;
							}
						}
						trialCheck(player);
					}
					else
					{
						socket.emit(Type.SYSTEM,'"'+name+'" is not a valid player.');
					}
				}
			},
			clear:function(){
				delete dcd[this.ip];
			},
			command:function(com){
				var c = com.split(' ');
				switch (c[0].toLowerCase())
				{
					case 'help':
						var list = {
							all:clone(commandList.all)
						}
						if (mod == this.s.id)
						{
							list.mod = clone(commandList.mod);	
						}
						if (this.dev)
						{
							list.dev = clone(commandList.dev);
						}
						list.fun = clone(commandList.fun);
						this.s.emit(Type.HELP,list);
					break;
					case 'whisper':
					case 'w':
						if (this.silenced)
						{
							this.silencedError();
						}
						else if ((phase >= Phase.DAY && phase <= Phase.LASTWORDS) || phase == Phase.PREGAME || phase == Phase.FIRSTDAY)
						{
							if (this.blackmailed && phase != Phase.PREGAME)
							{
								this.s.emit(Type.SYSTEM,'You cannot whisper while blackmailed.');
							}
							else if (!this.alive && phase != Phase.PREGAME)
							{
								this.s.emit(Type.SYSTEM,'You need to be alive to whisper.');
							}
							else
							{	
								if (c.length > 2)
								{
									if (playernames[c[1]])
									{
										//Valid player name.
										var msg = c.slice();
										msg.splice(0,2);
										msg=msg.join(' ');
										this.whisper(msg,players[playernames[c[1]]]);
									}
									else if (!isNaN(c[1])) //It's a number.
									{
										//Get the numbered player.
										var target = getPlayerByNumber(c[1]);
										if (target != -1)
										{
											var name = target.name;
											var msg = c.slice();
											msg.splice(0,2);
											msg=msg.join(' ');
											this.whisper(msg,target);
										}
										else
										{
											this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
										}
									}
									else
									{
										this.s.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'The syntax of this command is \'/w name message\'.');
								}
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You can only whisper during the day.');
						}
					break;
					case 'seance':
						if (mod == this.s.id)
						{
							this.s.emit(Type.SYSTEM,'The mod cannot use this command.');
						}
						else if (this.chats.medium)
						{
							if (this.canSeance)
							{
								if (!this.alive)
								{
									if (phase >= Phase.DAY && phase <= Phase.LASTWORDS || phase == Phase.FIRSTDAY)
									{
										if (this.seance === undefined)
										{
											var seance = function(medium,target)
											{
												if (medium.seancing && medium.seancing == target)
												{
													medium.s.emit(Type.SYSTEM, 'You cancel your seance.');
													medium.seancing.beingSeanced = undefined;
													medium.seancing = undefined;
													players[mod].s.emit(Type.SYSTEM,medium.name+' cancels their seance.');
												}
												else
												{
													medium.s.emit(Type.SYSTEM, 'You are now seancing '+target.name+'.');
													medium.seancing = target;
													medium.seancing.beingSeanced = medium;
													players[mod].s.emit(Type.SYSTEM,medium.name+' is now seancing '+target.name+'.');
												}
											};
											if (playernames[c[1]])
											{
												seance(this,players[playernames[c[1]]]);
											}
											else if (!isNaN(c[1]))
											{
												//Get the numbered player.
												var target = getPlayerByNumber(c[1]);
												if (target != -1)
												{
													seance(this,target);
												}
												else
												{
													this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
												}
											}
											else
											{
												this.s.emit(Type.SYSTEM, c[1] + ' is not a valid player.');
											}
										}
										else
										{
											this.s.emit(Type.SYSTEM,'You have 0 seances left.');
										}
									}
									else
									{
										this.s.emit(Type.SYSTEM, 'You can only use this command during the day.');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'You need to be dead to seance.');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You have 0 seances left.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Only a medium can seance.');
						}
					break;
					case 'clean':
						if (mod == this.s.id)
						{
							if (c.length == 2)
							{
								if (playernames[c[1]])
								{
									players[playernames[c[1]]].cleaned = !players[playernames[c[1]]].cleaned;
									if (players[playernames[c[1]]].cleaned)
									{
										this.s.emit(Type.SYSTEM, c[1]+'\'s Last Will will no longer show upon death.');
									}
									else
									{
										this.s.emit(Type.SYSTEM, c[1]+'\'s Last Will will show upon death.');
									}
								}
								else if (!isNaN(c[1]))
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target != -1)
									{
										target.cleaned = !target.cleaned;
										if (target.cleaned)
										{
											this.s.emit(Type.SYSTEM, target.name+'\'s Last Will will no longer show upon death.');
										}
										else
										{
											this.s.emit(Type.SYSTEM, target.name+'\'s Last Will will show upon death.');
										}
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM, c[1] + ' is not a valid player.');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM, 'The syntax of this command is /clean [name/number]');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM, 'Only the mod can use that command.');
						}
					break;
					case 'disguise':
						if (mod == this.s.id)
						{
							if (c.length==3)
							{
								//Disguiser
								var first = undefined;
								if (isNaN(c[1]))
								{
									first = getPlayerByName(c[1]);
								}
								else
								{
									first = getPlayerByNumber(c[1]);
								}
								//Target 
								var second = undefined;
								if (isNaN(c[2]))
								{
									second = getPlayerByName(c[2]);
								}
								else
								{
									second = getPlayerByNumber(c[2]);
								}
								if (first && second && first != -1 && second != -1)
								{
									socket.emit(Type.SYSTEM,first.name+' disguised as '+second.name+'.');
									first.s.emit(Type.HIGHLIGHT,'You successfully disguised!');
									second.s.emit(Type.HIGHLIGHT,'A disguiser stole your identity!');
									//Swap names in the playernames
									var temp = playernames[first.name];
									playernames[first.name] = second.s.id;
									playernames[second.name] = temp;
									//Swap names
									var temp = first.name;
									first.name = second.name;
									second.name = temp;
									//Swap numbers
									var one = playernums.indexOf(first.s.id);
									var two = playernums.indexOf(second.s.id);
									var temp = playernums[one];
									playernums[one] = playernums[two];
									playernums[two] = temp;
									sendPlayerInfo();
								}
								else
								{
									this.s.emit(Type.SYSTEM,'Invalid players!');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is /disguise disguiser target');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'givemod':
						if (mod == this.s.id || this.dev)
						{
							if (c.length < 2)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/givemod player\'.');
							}
							else
							{
								if (playernames[c[1]])
								{
									//Valid player name.
									players[mod].s.emit(Type.SETMOD,false);
									if (players[playernames[c[1]]].s.id == players[mod].s.id)
									{
										this.s.emit(Type.SYSTEM,'You are already the mod.');
									}
									else
									{
										var prevMod = mod;
										mod = players[playernames[c[1]]].s.id;
										players[mod].s.emit(Type.SETMOD,true);
										io.emit(Type.HIGHLIGHT,this.name+' gives mod to '+players[mod].name+'.');
										io.emit(Type.SWITCH,players[prevMod].name,players[mod].name);
										//Switch the numbers.
										var a = playernums.indexOf(players[prevMod].s.id);
										var b = playernums.indexOf(mod);
										var temp = playernums[a];
										playernums[a] = playernums[b];
										playernums[b] = temp;
										sendPlayerInfo();
									}
								}
								else if (!isNaN(c[1])) //It's a number.
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target != -1)
									{
										var prevMod = mod;
										var name = target.name;
										if (target.s.id != players[prevMod].s.id)
										{
											players[mod].s.emit(Type.SETMOD,false);
											mod = target.s.id;
											players[mod].s.emit(Type.SETMOD,true);
											io.emit(Type.HIGHLIGHT,this.name+' gives mod to '+players[mod].name+'.');
											io.emit(Type.SWITCH,players[prevMod].name,players[mod].name);
											//Switch the numbers.
											var a = playernums.indexOf(players[prevMod].s.id);
											var b = playernums.indexOf(mod);
											var temp = playernums[a];
											playernums[a] = playernums[b];
											playernums[b] = temp;
											sendPlayerInfo();
										}
										else
										{
											this.s.emit(Type.SYSTEM,'You are already the mod.');
										}
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
								}
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You do not have permission to use this command.');
						}
					break;
					case 'mod':
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (c.length < 2)
						{
							this.s.emit(Type.SYSTEM,'The syntax of this command is \'/mod message\'.');
						}
						else
						{
							var msg = c.slice();
							msg.splice(0,1);
							msg=msg.join(' ');
							players[mod].s.emit(Type.MOD,{from:this.name,msg:msg});
							this.s.emit(Type.MOD,{to:'Mod',msg:msg});
						}
					break;
					case 'unsilence':
						if (this.dev)
						{
							if (c.length < 2)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/unsilence player\'.');
							}
							else
							{
								if (playernames[c[1]])
								{
									if (!players[playernames[c[1]]].silenced)
									{
										this.s.emit(Type.SYSTEM,c[1]+' is not silenced.');
									}
									else
									{
										io.emit(Type.HIGHLIGHT,c[1]+' is now unsilenced.');
										players[playernames[c[1]]].silenced = undefined;
									}
								}
								else if (!isNaN(c[1])) //It's a number.
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target != -1)
									{
										if (!target.silenced)
										{
											this.s.emit(Type.SYSTEM,target.name+' is not silenced.');
										}
										else
										{
											io.emit(Type.HIGHLIGHT,target.name+' is now unsilenced.');
											target.silenced = undefined;
										}
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'Could not find player '+c[1]+'!');
								}	
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM, 'You do not have the correct permissions to use this command.');
						}
					break;
					case 'silence':
						if (this.dev)
						{
							if (c.length < 2)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/silence player [reason]\'.');
							}
							else
							{
								if (playernames[c[1]])
								{
									if (players[playernames[c[1]]].silenced)
									{
										this.s.emit(Type.SYSTEM,c[1]+' is already silenced.');
									}
									else
									{
										players[playernames[c[1]]].silenced = this.name;
										if (c[2])
										{
											players[playernames[c[1]]].silenced +='/' + c.slice(2,c.length).join(' ');
										}
										this.s.emit(Type.SYSTEM,"You have silenced "+c[1]+' for the phase. You can use /unsilence to unsilence them early.');
										var msg = players[playernames[c[1]]].name + ' was silenced for this phase by '+this.name+'.';
										if (c[2])
										{
											msg += ' Reason: '+c.slice(2,c.length).join(' ');
										}
										io.emit(Type.HIGHLIGHT,msg);
									}
								}
								else if (!isNaN(c[1])) //It's a number.
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target != -1)
									{
										if (target.silenced)
										{
											this.s.emit(Type.SYSTEM,target.name+' is already silenced.');
										}
										else
										{
											target.silenced = this.name;
											if (c[2])
											{
												target.silenced+='/'+c.slice(2,c.length).join(' ');
											}
											this.s.emit(Type.SYSTEM,"You have silenced "+target.name+' for the phase. You can use /unsilence to unsilence them early.');
											var msg = target.name + ' was silenced for the phase by '+this.name+'.';
											if (c[2])
											{
												msg += ' Reason: '+c.slice(2,c.length).join(' ');
											}
											io.emit(Type.HIGHLIGHT,msg);
										}
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'Could not find player '+c[1]+'!');
								}
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM, 'You do not have the correct permissions to use this command.');
						}
					break;
					case 'random':
						if (mod == this.s.id)
						{
							if (c.length != 1)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/random\'.');
							}
							else
							{
								var length = Object.keys(players).length -1; //Minus mod
								if (length > 0)
								{
									var randomNumber = Math.floor( Math.random()*length)+1;
									this.s.emit(Type.SYSTEM,'Random player: '+ getPlayerByNumber(randomNumber).name);
								}
								else
								{
									this.s.emit(Type.SYSTEM,'Not enough players to use this command.');
								}
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'roll':
						if (mod == this.s.id)
						{
							if (c.length > 2)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/roll number\'.');
							}
							else
							{
								var sides = c[1] ? c[1] : 6; //Specified value or 6.
								var randomNumber = Math.floor( Math.random()*sides)+1;
								this.s.emit(Type.SYSTEM,'Dice roll ('+sides+' sides): '+randomNumber);
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'forceverdict':
						if (mod == this.s.id)
						{
							if (phase == Phase.VERDICTS)
							{
								if (c.length == 3)
								{
									var one = c[1];
									if (!isNaN(one))
									{
										p = getPlayerByNumber(one);
										if (p == -1)
										{
											if (!error)
											{
												this.s.emit(Type.SYSTEM,one+' is not a valid player.');
												error = true;
											}
										}
										else
										{
											one = p.name;
										}
									}
									if (!error)
									{
										if (c[2] == 'guilty' || c[2] == 'g')
										{
											p.castVerdict(false,true);
										}
										else if (c[2] == 'innocent' || c[2] == 'inno' || c[2] == 'i')
										{
											p.castVerdict(true,true);
										}
										else
										{
											this.s.emit(Type.SYSTEM,'\''+c[2]+'\' is not a valid option.');
											error = true;
										}
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'The syntax of this command is /forceverdict player [guilty/innocent]');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'This command can only be used during the verdicts phase.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'settrial':
						if (mod == this.s.id)
						{
							if (c.length == 2)
							{
								var error = false;
								var one = c[1];
								if (!isNaN(one))
								{
									p = getPlayerByNumber(one);
									if (p == -1)
									{
										this.s.emit(Type.SYSTEM,one+' is not a valid player.');
										error = true;
									}
									else
									{
										one = p.name;
									}
								}
								var p = getPlayerByName(one);
								if (p)
								{
									
								}
								else
								{
									this.s.emit(Type.SYSTEM,'\''+one+'\' is not a player.');
									error = true;
								}
								if (!error)
								{
									io.emit(Type.HIGHLIGHT,"The mod has put "+one+" on trial.");
									setPhase(Phase.TRIAL);
									ontrial = p.s.id;
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is /settrial person.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'lockvote':
						if (mod == this.s.id)
						{
							if (c.length == 2)
							{
								var error = false;
								var one = c[1];
								if (!isNaN(one))
								{
									p = getPlayerByNumber(one);
									if (p == -1)
									{
										this.s.emit(Type.SYSTEM,one+' is not a valid player.');
										error = true;
									}
									else
									{
										one = p.name;
									}
								}
								var p = getPlayerByName(one);
								if (p)
								{
									
								}
								else
								{
									this.s.emit(Type.SYSTEM,'\''+one+'\' is not a player.');
									error = true;
								}
								if (!error && players[playernames[one]].votelock)
								{
									error = true;
									this.s.emit(Type.SYSTEM,one+'\'s vote is already locked.');
								}
								if (!error)
								{
									players[playernames[one]].s.emit(Type.SYSTEM,'Your vote has been locked.');
									players[playernames[one]].votelock = true;
									this.s.emit(Type.SYSTEM,one+"\'s vote is now locked.");
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is /lockvote person.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'unlockvote':
						if (mod == this.s.id)
							{
							if (c.length == 2)
							{
								var error = false;
								var one = c[1];
								if (!isNaN(one))
								{
									p = getPlayerByNumber(one);
									if (p == -1)
									{
										this.s.emit(Type.SYSTEM,one+' is not a valid player.');
										error = true;
									}
									else
									{
										one = p.name;
									}
								}
								var p = getPlayerByName(one);
								if (p)
								{
									
								}
								else
								{
									this.s.emit(Type.SYSTEM,'\''+one+'\' is not a player.');
									error = true;
								}
								if (!error && !players[playernames[one]].votelock)
								{
									error = true;
									this.s.emit(Type.SYSTEM,one+'\'s vote is not locked.');
								}
								if (!error)
								{
									players[playernames[one]].s.emit(Type.SYSTEM,'Your vote has been unlocked.');
									players[playernames[one]].votelock = false;
									this.s.emit(Type.SYSTEM,one+"\'s vote is now unlocked.");
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is /unlockvote person.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'forcevote':
						if (mod == this.s.id)
						{
							if (phase== Phase.VOTING)
							{
								if (c.length == 3)
								{
									var error = false;
									var one = c[1];
									var two = c[2];
									if (!isNaN(one))
									{
										p = getPlayerByNumber(one);
										if (p == -1)
										{
											if (!error)
											{
												this.s.emit(Type.SYSTEM,one+' is not a valid player.');
												error = true;
											}
										}
										else
										{
											one = p.name;
										}
									}
									if (!isNaN(two))
									{
										p = getPlayerByNumber(two);
										if (p == -1)
										{
											if (!error)
											{
												this.s.emit(Type.SYSTEM,two+' is not a valid player.');
												error = true;
											}
										}
										else
										{
											two = p.name;
										}
									}
									//Namecheck
									var p = getPlayerByName(one);
									var p2 = getPlayerByName(two);
									if (p)
									{
										
									}
									else
									{
										this.s.emit(Type.SYSTEM,'\''+one+'\' is not a player.');
										error = true;
									}
									if (p2)
									{
										
									}
									else
									{
										this.s.emit(Type.SYSTEM,'\''+two+'\' is not a player.');
										error = true;
									}
									if (!error)
									{
										players[playernames[one]].s.emit(Type.SYSTEM,'The mod has forced you to vote for '+two+'.');
										players[playernames[one]].vote(two, true);
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'The syntax of this command is /forcevote person1 person2.');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You cannot use this command outside of the voting phase.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'vote':
						if (c.length == 2)
						{
							if (isNaN(c[1]))
							{
								this.vote(c[1]);
							}
							else
							{
								this.s.emit(Type.SYSTEM,'This command only accepts names, and is only to be used if the voting interface is not working.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'The syntax of this command is \'/vote name\'');
						}
					break;
					case 'dev':
						if (c.length == 2)
						{
							var password = c[1];
							if (this.dev)
							{
								this.s.emit(Type.SYSTEM,'You already have access to the dev commands.');
							}
							else if (apass == password)
							{
								this.s.emit(Type.SYSTEM,'Password accepted. You now have access to dev commands.');
								this.dev=true;
								io.emit(Type.SETDEV,this.name);
							}
							else
							{
								this.s.emit(Type.SYSTEM,'Incorrect password!');
							}
						}
						else
						{
							socket.emit(Type.SYSTEM,'The syntax of this command is \'/dev password\'.');
						}
					break;
					case 'reveal':
						if (this.mayor === undefined)
						{
							this.s.emit(Type.SYSTEM,'...but you aren\'t the Mayor.');
						}
						else if (this.mayor)
						{
							this.s.emit(Type.SYSTEM,'You have already revealed yourself as the Mayor.');
						}
						else if (!this.alive)
						{
							this.s.emit(Type.SYSTEM,'You must be alive to reveal.');
						}
						else if (phase >= Phase.DAY && phase <= Phase.LASTWORDS || phase == Phase.FIRSTDAY)
						{
							io.emit(Type.HIGHLIGHT,this.name+' has revealed themselves as the Mayor!');
							this.mayor = true;
							if (this.votingFor)
							{
								players[this.votingFor].votes+=2;
								trialCheck(players[this.votingFor]);
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You can only reveal as the Mayor during the day.');
						}
					break;
					case 'jail':
						if (mod == this.s.id)
						{
							this.s.emit(Type.SYSTEM,'The mod cannot use this command.');
						}
						else if (this.jailorcom === false)
						{
							this.s.emit(Type.SYSTEM,'Only the jailor can detain people.');
						}
						else if (!this.alive)
						{
							this.s.emit(Type.SYSTEM,'You must be alive to jail.');
						}
						else if (phase >= Phase.DAY && phase <= Phase.LASTWORDS || phase == Phase.FIRSTDAY)
						{	
							var args = c.slice(1,c.length);
							var targets = [];
							var error = false;
							if (args.length == 0 || args[0] == '0')
							{
								var actions = gm.getActions(this.name);
								if (actions && actions.length > 0)
								{
									//This is a cancel
									
								}
								else
								{
									error = true;
									this.s.emit(Type.SYSTEM,'You are not targetting anyone.');
								}
							}
							else
							{
								//Check if the targetting is valid
								var vt = gm.validTarget(args, this.role.toLowerCase(), players, playernames, playernums, this);
								if (vt == 'notfound' || vt == 'ok' || free)
								{
									for (i in args)
									{
										if (args[i] != '')
										{
											if (isNaN(args[i]))
											{
												var p = getPlayerByName(args[i]);
											}
											else
											{
												var p = getPlayerByNumber(parseInt(args[i]));															
											}
											if (p && p != -1)
											{
												if (p.s.id != mod)
												{
													targets.push(p.name);	
												}
												else
												{
													this.s.emit(Type.SYSTEM,'You cannot jail the mod.');
													error = true;
													break;
												}
											}
											else
											{
												this.s.emit(Type.SYSTEM,'Invalid player: '+args[i]);
												error = true;
												break;
											}
										}
									}
								}
								else
								{
									error = true;
									var message = vt;
									this.s.emit(Type.SYSTEM,message);
								}
							}
							if (!error)
							{
								this.target(targets);
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You can only jail during the day.');
						}
					break;
					case 't': case 'target': case 'freetarget': case 'ft':
						var free = false;
						if (c[0].toLowerCase() == 'ft' || c[0].toLowerCase() == 'freetarget')
						{
							free = true;
						}
						if (mod == this.s.id)
						{
							this.s.emit(Type.SYSTEM,'The mod cannot use this command.');
						}
						else if (this.chats.jailed)
						{
							this.s.emit(Type.SYSTEM,'You cannot use this command while jailed.');
						}
						else if (!this.alive)
						{
							this.s.emit(Type.SYSTEM,'You cannot use this while dead.');
						}
						else if (phase != Phase.NIGHT)
						{
							this.s.emit(Type.SYSTEM,'You can only use this command at night.');
						}
						else
						{	
							var args = c.slice(1,c.length);
							var targets = [];
							var error = false;
							if (args.length == 0 || args[0] == '0')
							{
								var actions = gm.getActions(this.name);
								if (actions && actions.length > 0)
								{
									//This is a cancel
									
								}
								else
								{
									error = true;
									this.s.emit(Type.SYSTEM,'You are not targetting anyone.');
								}
							}
							else
							{
								//Check if the targetting is valid
								var vt = gm.validTarget(args, this.role.toLowerCase(), players, playernames, playernums, this);
								if (vt == 'notfound' || vt == 'ok' || free)
								{
									for (i in args)
									{
										if (args[i] != '')
										{
											if (isNaN(args[i]))
											{
												var p = getPlayerByName(args[i]);
											}
											else
											{
												var p = getPlayerByNumber(parseInt(args[i]));															
											}
											if (p && p != -1)
											{
												if (p.s.id != mod)
												{
													targets.push(p.name);	
												}
												else
												{
													this.s.emit(Type.SYSTEM,'You cannot target the mod.');
													error = true;
													break;
												}
											}
											else
											{
												this.s.emit(Type.SYSTEM,'Invalid player: '+args[i]);
												error = true;
												break;
											}
										}
									}
								}
								else
								{
									error = true;
									var message = vt;
									this.s.emit(Type.SYSTEM,message);
								}
							}
							if (!error)
							{
								this.target(targets);
							}
						}
					break;
					case 'exe': case 'execute': case 'x':
						if (!this.chats.jailor)
						{
							this.s.emit(Type.SYSTEM,'You need to be the Jailor to use this.');
						}
						else if (phase != Phase.NIGHT)
						{
							this.s.emit(Type.SYSTEM,'You can only use this at night.');
						}
						else
						{
							var modjailed = false;
							var found = false;
							var msg = this.executing? 'The Jailor has changed his mind.':'The Jailor has decided to execute you.';
							var jmsg = this.executing? 'You have changed your mind.':'You have decided to execute your prisoner.';			
							for (i in players)
							{
								if (players[i].chats.jailed)
								{
									if (i == mod)
									{
										modjailed = true;
									}
									else
									{
										found = players[i].name;
										players[i].s.emit(Type.SYSTEM,msg);
										socket.emit(Type.SYSTEM,jmsg);
										players[mod].s.emit(Type.SYSTEM,this.executing?this.name+' has changed their mind.':this.name+' has decided to execute '+players[i].name+'.');
									}
								}
							}
							if (modjailed)
							{
								this.s.emit(Type.SYSTEM, "You cannot execute the mod.");
							}
							else if (found)
							{
								this.executing = !this.executing;
								if (this.executing)
								{
									gm.log(this.name,[found]);
								}
								else
								{
									gm.log(this.name,[]);
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You do not have a prisoner to execute!');
							}
						}
					break;
					case 'me':
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (phase == Phase.PREGAME)
						{
							if (c.length < 2)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/me action\'.');
							}
							else
							{
								var msg = c.slice();
								msg.splice(0,1);
								msg=msg.join(' ');
								io.emit(Type.ME,this.name,msg);
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Sorry! This command is only available in Pregame.');
						}
					break;
					case 'hug':
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (phase == Phase.PREGAME)
						{
							if (c.length == 2)
							{
								var str = c[1];
								if (isNaN(str))
								{
									if (str.toLowerCase() == 'everyone')
									{
										var p = {name:str+'!'};
									}
									else
									{
										var p = getPlayerByName(str);
									}
								}
								else
								{
									var p = getPlayerByNumber(parseInt(str));															
								}
								if (p && p != -1)
								{
									io.emit(Type.HUG,this.name,p.name);
									if (this.name == p.name)
									{
										io.emit(Type.SYSTEM,'Is someone feeling lonely?');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'Invalid selection: '+c[1]);
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is /hug name.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Sorry! Please keep your hugs to pregame.');
						}
					break;
					case 'role':
						if (c.length == 1)
						{
							//Return own role.
							if (this.role == 'NoRole')
							{
								this.s.emit(Type.SYSTEM,'You were not assigned a role, yet.');
							}
							else if (roles.hasRolecard(this.role))
							{
								var results = {};
								var investGroup = gm.getRoleGroup(this.role.toLowerCase());
								if (investGroup)
								{
									results.investResult = gm.getInvestFlavor(investGroup)+' They must be a '+gm.grammarList(gm.getInvestGroupings(investGroup),'or');
								}
								var sheriffAlignment = gm.getAlignment(this.role.toLowerCase());
								if (sheriffAlignment)
								{
									results.sheriffResult = gm.getSheriffResult(sheriffAlignment);
								}
								this.s.emit(Type.ROLECARD,roles.getRoleCard(this.role,results));
							}
							else
							{
								this.s.emit(Type.SYSTEM,'Your role is '+this.role+'.');
							}
						}
						else
						{
							c.splice(0,1);						
							var rolename = c.join(' '); 
							if (roles.hasRolecard(rolename))
							{
								var results = {};
								var investGroup = gm.getRoleGroup(rolename.toLowerCase());
								if (investGroup)
								{
									results.investResult = gm.getInvestFlavor(investGroup)+' They must be a '+gm.grammarList(gm.getInvestGroupings(investGroup),'or');
								}
								var sheriffAlignment = gm.getAlignment(rolename.toLowerCase());
								if (sheriffAlignment)
								{
									results.sheriffResult = gm.getSheriffResult(sheriffAlignment);
								}
								this.s.emit(Type.ROLECARD,roles.getRoleCard(rolename,results));
							}
							else
							{
								this.s.emit(Type.SYSTEM,"'"+rolename+"' could not be found.");
							}
						}
					break;
					case 'confirm':
						if (mod == this.s.id)
						{
							this.s.emit(Type.SYSTEM,'The mod cannot use this command.');
						}
						else if (phase == Phase.ROLES)
						{						
							if (this.confirm)
							{
								socket.emit(Type.SYSTEM,'You have already confirmed.');
							}
							else
							{
								this.confirm = true;
								io.emit(Type.SYSTEM,this.name+' has confirmed.');
								showConfirms();
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'You can only use this command while the mod is giving out roles.');
						}
					break;
					case 'spectate':
						if (mod == this.s.id)
						{
							this.s.emit(Type.SYSTEM,'The mod cannot use this command.');
						}
						else if (this.spectate === undefined)
						{
							this.spectate = true;
							players[mod].s.emit(Type.SYSTEM,this.name+' is now spectating.'); 							
							this.s.emit(Type.SYSTEM,'You are now spectating.');
						}
						else if (this.spectate)
						{
							if (phase == Phase.PREGAME)
							{					
								this.spectate = undefined;
								players[mod].s.emit(Type.SYSTEM,this.name+' is no longer spectating.'); 
								this.s.emit(Type.SYSTEM,'You are no longer spectating.');
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You can only leave spectator in pregame.');
							}
						}
					break;
					case 'setspectate': case 'ss':
						if (this.dev)
						{
							if (c.length < 2)
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/setspectate player\' or \'/ss player\'.');
							}
							else
							{
								if (players[playernames[c[1]]].spectate)
								{
									players[playernames[c[1]]].spectate = undefined;
									this.s.emit(Type.SYSTEM,c[1]+' has been set to spectate.');
									players[playernames[one]].s.emit(Type.SYSTEM, 'You have been set to spectate.');
									players[mod].s.emit(Type.SYSTEM,c[1]+' has been set to spectate by '+this.name);
								}	
								else
								{
									players[playernames[c[1]]].spectate = true;
									this.s.emit(Type.SYSTEM,c[1]+' is no longer set to spectate.');
									players[playernames[one]].s.emit(Type.SYSTEM, 'You have been set to spectate.');
									players[mod].s.emit(Type.SYSTEM,c[1]+' is no longer set to spectate by '+this.name);
								}
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM, 'You do not have the correct permissions to use this command.');
						}
					break;
					case 'roles':
					{
						this.s.emit(Type.SYSTEM, roles.getRolenames());
					}
					break;
					case 'ban':
					if (c.length > 2)
						{
							if (this.dev)
							{
								var first = c[1];
								var reason = c[2];
								if (!isNaN(first[0])) //Ip
								{
									//Check if the ip is formatted correctly.
									if (/\d+\.\d+\.\d+\.\d+/.test(c[1]))
									{
										ban(c[1],c.slice(2,c.length).join(' '),this.name);
										this.s.emit(Type.SYSTEM,'You banned the ip: '+c[1]+'. Reason: '+c.slice(2,c.length).join(' '));
									}
									else
									{
										this.s.emit(Type.SYSTEM,'The argument '+c[1]+' was not recognized as an ip.');
									}
								}
								else //name
								{
									if (playernames[c[1]])
									{
										var ip = getPlayerByName(c[1]).ip;
										kick(c[1],c.slice(2,c.length).join(' '),this.name);
										ban(ip,c.slice(2,c.length).join(' '),this.name);
									}
									else
									{
										this.s.emit(Type.SYSTEM, 'The name \''+c[1]+'\' could not be found.');
									}
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM, 'You do not have the correct permissions to use this command.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'The syntax of this command is /ban [name/ip] reason. A reason is mandatory.');
						}
					break;
					case 'kick':
						if (c.length >= 2)
						{
							if (this.dev)
							{
								var name = c[1];
								var tokick = getPlayerByName(name);
								if (!isNaN(name))
								{
									this.s.emit(Type.SYSTEM,'Please use the name of the player you wish to kick, not the number. This is to ensure no players are kicked accidentally.');
								}
								else if (tokick)
								{
									kick(name,c.slice(2,c.length).join(' '),this.name);
								}
								else
								{
									this.s.emit(Type.SYSTEM,'\''+name+'\' is not a valid player.');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You do not have the correct permissions to use this command.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'The syntax of this command is \'/kick user reason\'.');
						}
					break;
					case 'alert':
						if (c.length >= 2)
						{
							if (this.dev)
							{
								if (isNaN(c[1])) //Name
								{
									var player = getPlayerByName(c[1]);
									if (player)
									{
										player.s.emit(Type.HEY);
										player.s.emit(Type.SYSTEM,'ALERT!');
										this.s.emit(Type.SYSTEM,'You sent an alert to '+player.name+'.');
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Cannot find player \''+c[1]+'\'');
									}
								}
								else if (parseInt(c[1]) >= 0 && parseInt(c[1]) < Object.keys(players).length) //Number
								{
									var player = getPlayerByNumber(parseInt(c[1]));
									player.s.emit(Type.HEY); 	
									player.s.emit(Type.SYSTEM,'ALERT!');
									this.s.emit(Type.SYSTEM,'You sent an alert to '+player.name+'.');
								}
								else
								{									
									this.s.emit(Type.SYSTEM,'Cannot find user number '+c[1]+'.');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You do not have the correct permissions to use this command.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'The syntax of this command is \'/alert user \'.');
						}
					break;
					case 'ping':
						if (this.dev)
						{
							var ping = {};
							for (i in players)
							{
								ping[players[i].name] = players[i].ping;
							}
							this.s.emit(Type.LATENCIES,ping);
						}
						else
						{
							this.s.emit(Type.LATENCIES,this.ping);
						}
					break;
					case 'msg':
						if (mod==this.s.id)
						{
							if (c.length > 2)
							{
								if (playernames[c[1]])
								{
									//Valid player name.
									var msg = c.slice();
									msg.splice(0,2);
									msg=msg.join(' ');
									players[playernames[c[1]]].s.emit(Type.MOD,{from:'Mod',msg:msg});
									this.s.emit(Type.MOD,{to:c[1],msg:msg});
								}
								else if (!isNaN(c[1])) //It's a number.
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target != -1)
									{
										var name = target.name;
										var msg = c.slice();
										msg.splice(0,2);
										msg=msg.join(' ');
										target.s.emit(Type.MOD, {from:'Mod', msg:msg});
										this.s.emit(Type.MOD,{to:name,msg:msg});
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
									}
								}
								else
								{
									this.s.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
								}
							}
							else
							{
								this.s.emit(Type.SYSTEM,'The syntax of this command is \'/msg name message\'.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Only the mod can use this command. If you are trying to whisper, try \'/w name message\'');
						}
					break;
					case 'sys': case 'system':
						if (mod==this.s.id)
						{
							if (c.length > 2)
							{
								if (playernames[c[1]])
								{
									//Valid player name.
									var msg = c.slice();
									msg.splice(0,2);
									msg=msg.join(' ');
									players[playernames[c[1]]].s.emit(Type.SYSTEM,msg);
									this.s.emit(Type.SYSSENT,c[1],msg);
								}
								else if (!isNaN(c[1])) //It's a number.
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target != -1)
									{
										var name = target.name;
										var msg = c.slice();
										msg.splice(0,2);
										msg=msg.join(' ');
										target.s.emit(Type.SYSTEM,msg);
										this.s.emit(Type.SYSSENT,c[1],msg);
									}
									else
									{
										this.s.emit(Type.SYSTEM,'Could not find player number '+c[1]+'!');
									}
								}
								else
								{
									socket.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
								}
							}
							else
							{
								socket.emit(Type.SYSTEM,'The syntax of this command is \'/system name message\'.');
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Only the mod can use this command. If you are trying to whisper, try \'/w name message\'');
						}
					break;
					case 'afk':
						if (phase == Phase.PREGAME)
						{					
							if (this.afk === undefined)
							{
								if (!this.silenced)
								{
									io.emit(Type.SYSTEM,this.name+' has decided to go afk.');
								}
								this.afk = true;
								//SetRole(this.name, 'afk')
								var p = getPlayerByName(this.name)
								p.setRole("afk")
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You are already AFK. Use /back.');
							}
						}
					break;
					case 'back':
						if (phase == Phase.PREGAME)
						{	
							if (this.afk)
							{
								if (!this.silenced)
								{
									io.emit(Type.SYSTEM,'Welcome back '+this.name+'.');
								}	
							this.afk = undefined;
							//SetRole(this.name, '')
							var p = getPlayerByName(this.name)
							p.setRole("NoRole")
							}
							else
							{
								this.s.emit(Type.SYSTEM,'You are not AFK. Use /afk.');
							}
						}
					break;
					case 'rolelist': case 'rl':
						var sendArr = [];
						if (createdList && createdList.length != 0)
						{
							for (i in createdList)
							{
								sendArr[i] = sanitize(createdList[i]);
								sendArr[i] = roles.formatAlignment(createdList[i]);
							}
							this.s.emit(Type.SHOWLIST,sendArr);
						}
						else
						{
							this.s.emit(Type.SYSTEM, 'There is currently no rolelist saved.');
						}
						break;
					default:
						this.s.emit(Type.SYSTEM,'Command /' + com + ' not recognized.');
					break;
				}
			},
			whisper:function(msg,to)
			{
				if (to.s.id == mod)
				{
					this.s.emit(Type.SYSTEM,'Please do not whisper to the mod. Use the /mod commmand instead.');
				}
				else if (this.s.id == mod)
				{
					this.s.emit(Type.SYSTEM,'Please do not whisper to players as the mod. Use the /msg commmand instead.');
				}
				else if (this == to)
				{
					this.s.emit(Type.SYSTEM,'You cannot whisper to yourself.');
				}
				else if (!to.alive && phase != Phase.PREGAME)
				{
					this.s.emit(Type.SYSTEM,'You cannot whisper to the dead.');
				}
				else
				{
					to.s.emit(Type.WHISPER,{from:this.name, msg:msg});
					this.s.emit(Type.WHISPER,{to:to.name,msg:msg});
					if (phase != Phase.PREGAME)
					{
						players[mod].s.emit(Type.WHISPER,{from:this.name,to:to.name,msg:msg});
					}
					for (i in players)
					{
						if (players[i].hearwhispers && phase != Phase.PREGAME)
						{
							players[i].s.emit(Type.WHISPER,{from:this.name,to:to.name,msg:msg});
						}
					}
					//Public whispering message
					if (phase != Phase.PREGAME) //Ingame whisper, not a pregame whisper.
					{
						io.emit(Type.WHISPER,{from:this.name,to:to.name});
					}
				}
			},
			target:function(targets){
				//Show who the player is targetting to the other mafia, if they are mafia.
				if (this.chats.mafia)
				{
					for (i in players)
					{
						if (players[i].chats.mafia || players[i].s.id == mod)
						{
							players[i].s.emit(Type.TARGET,this.name,this.role,gm.grammarList(targets));
						}
					}
				}
				else
				{
					players[mod].s.emit(Type.TARGET,this.name,this.role,gm.grammarList(targets));
					this.s.emit(Type.TARGET,'You',undefined,gm.grammarList(targets));
				}
				//Log the night action for review at the end of the night.
				gm.log(this.name,targets);
			},
			silencedError: function(){
				var details = [this.silenced];
				if (this.silenced.indexOf('/') != -1)
				{
					details = this.silenced.split('/');
				}
				var msg = 'You have been silenced by '+details[0]+'.';
				if (details[1])
				{
					msg+=' Reason: '+details[1];
				}
				this.s.emit(Type.SYSTEM, msg);
			},
			message:function(msg)
			{
				switch (phase)
				{
					case Phase.PREGAME:
						if (this.silenced)
						{
							this.silencedError();
						}
						else
						{
							io.emit(Type.MSG,this.name,msg);
						}
					break;
					case Phase.ROLES:
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Please do not talk while the mod is giving out roles.');
						}
					break;
					case Phase.DAY:
					case Phase.VOTING:
					case Phase.VERDICTS:
					case Phase.FIRSTDAY:
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else if (this.alive)
						{
							if (this.blackmailed)
							{
								this.s.emit(Type.SYSTEM,'You are blackmailed.');
							}
							else
							{
								io.emit(Type.MSG,this.name,msg);
							}
						}
						else //Deadchat
						{
							this.specMessage(msg,{dead:true});
						}
					break;
					case Phase.TRIAL:
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else if (this.alive)
						{							
							if (ontrial == this.s.id)
							{
								if (this.blackmailed)
								{
									io.emit(Type.MSG,this.name,'I am blackmailed.');
								}
								else
								{
									io.emit(Type.MSG,this.name,msg);
								}
							}
							else
							{
								socket.emit(Type.SYSTEM,'Please do not speak while someone is on trial.');
							}
						}
						else
						{
							this.specMessage(msg,{dead:true});
						}
					break;
					case Phase.NIGHT:
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (this.alive)
						{
							if (mod==this.s.id)
							{
								io.emit(Type.HIGHLIGHT,msg);
							}
							else if (this.chats.jailed)
							{
								this.specMessage(msg,{jailor:true,jailed:true});
							}
							else if (this.chats.mafia)
							{
								this.specMessage(msg,{mafia:true});
							}
							else if (this.chats.jailor)
							{
								this.specMessage(msg,{jailor:true,jailed:true},'Jailor');
							}
							if (this.chats.medium)
							{
								this.specMessage(msg,{dead:true},'Medium');
								//Echo the message back to the medium.
								this.s.emit(Type.MSG,'Medium',{msg:msg,styling:'dead'});
							}
							if (this.beingSeanced)
							{
								this.beingSeanced.s.emit(Type.MSG,this.name,msg);
								//Echo the message back to the medium.
								this.s.emit(Type.MSG,this.name,msg);
								players[mod].s.emit(Type.MSG,this.name,msg);
							}
						}
						else //Deadchat
						{
							if (this.seancing)
							{
								this.seancing.s.emit(Type.MSG,'Medium',msg);
								//Echo the message back to the medium.
								this.s.emit(Type.MSG,'Medium',msg);
								players[mod].s.emit(Type.MSG,('Medium('+this.name+')'),msg);
							}
							else
							{
								this.specMessage(msg,{dead:true,medium:true});
							}
						}
					break;
					case Phase.MODTIME:
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Please do not talk during mod time.');
						}
					break;
					case Phase.LASTWORDS:
						if (this.silenced)
						{
							this.silencedError();
						}
						else if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else if (!this.alive)
						{							
							this.specMessage(msg,{dead:true});
						}
						else if (ontrial == this.s.id)
						{					
							if (this.blackmailed)
							{
								this.s.emit(Type.SYSTEM,'You are blackmailed.');
							}
							else
							{
								io.emit(Type.MSG,this.name,msg);
							}
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Please do not talk during '+players[ontrial].name+'\'s last words.');
						}
					break;
				}
			},
			specMessage:function(msg,types,specname) //Display a message only to players able to see certain chats.
			{
				for (i in players)
				{
					if (i == mod) //Mod can view all chats.
					{
						players[i].s.emit(Type.MSG,(specname?specname+'('+this.name+')':this.name),{styling:Object.keys(types)[0],msg:msg});
					}
					else
					{
						for (j in types)
						{
							if (players[i].chats[j] == types[j])
							{
								//Use the special name if one is provided.								
								players[i].s.emit(Type.MSG,(specname?specname:this.name),{styling:j,msg:msg});
								break;
							}
						}
					}
				}
			}
			
	};
}
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
}
function kick(name, reason, kicker)
{
	var tokick = getPlayerByName(name);
	tokick.s.emit(Type.SYSTEM,'You have been kicked from the game!');
	if (reason)
	{
		io.emit(Type.HIGHLIGHT,tokick.name+' has been kicked by '+kicker+'! Reason: '+reason);
	}
	else
	{
		io.emit(Type.HIGHLIGHT,tokick.name+' has been kicked by '+kicker+'!');
	}
	tokick.s.emit(Type.KICK);
	tokick.s.disconnect();
}
function ban(ip,reason,banner)
{
	reason = reason?reason:'';
	db.query('INSERT INTO banlist VALUES(\''+ip+'\',\''+reason+'\');',function(err,result)
	{
		console.log(ip+' successfully banned by '+banner+'. Reason: '+reason);
	});
	loadBanlist();
}
