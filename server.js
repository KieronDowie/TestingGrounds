var http = require('http');
var url = require('url');
var fs = require('fs');
var io = require('socket.io')(http, {'heartbeat timeout':5,'heartbeat interval':11});
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
	ROLEUPDATE:27
};

var Phase = {
	PREGAME:0,
	ROLES:1,
	MODTIME:2,
	DAY:3,
	VOTING:4,
	TRIAL:5,
	VERDICTS:6,
	LASTWORDS:7,
	NIGHT:8
};
//Game variables
var phase = Phase.PREGAME;
var mod = undefined;
var ontrial = undefined;
var apass = 'anewbeginning';
//Start the timer.
var timer = Timer();
timer.tick();

var server = http.createServer(function(req,res)
{
	var path = url.parse(req.url).pathname;
	//Routing
	switch (path)
	{
		case '/':
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
					//Check if the name is taken before serving the page.
					if (!nameTaken(playername))
					{			
						if (nameCheck(playername))	
						{		
							var ip = getIpReq(req);
							console.log('posted ip:'+ip);
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
				});
				
			}
			else
			{
				res.writeHead(302, {"Location": "/"}); //Send em home
				res.end();
			}
		break;
		case '/namecheck':
			var name = url.parse(req.url).query;
			if (name)
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
		case '/jquery-2.1.4.min.js':
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
		
		case '/maf.png':
		case '/mayor.png':
		case '/med.png':
		case '/jailor.png':		
		case '/spy.png':		
		case '/will.png':
		case '/willicon.png':
		case '/button.png':
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
	console.log('connection attempt from '+ip+' / '+joining[ip]); //show name and ip
	if (players[ip])
	{
		//Player is already connected, wtf, do nothing.
		console.log('already connected');
	}
	else if (joining[ip])
	{
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
		//Tell the new arrival what phase it is.
		socket.emit(Type.SETPHASE,phase);
		//Inform the new arrival of any devs present.
		for (i in players)
		{
			if (players[i].dev)
			{
				socket.emit(Type.SETDEV,players[i].name);
			}
		}
	}
	else if (dcd[ip]) //Rejoining after a dc
	{
		//Send the list of names in the game to the returning player.
		var namelist = [];
		//Send the roles of any dead players
		for (i in players)
		{
			var p={};
			p.name = players[i].name;
			if (!players[i].alive)
			{
				p.role = players[i].role;
			}
			namelist.push(p);
		}
		//Welcome back!
		players[socket.id]=dcd[ip];
		//Replace the old socket.
		players[socket.id].s = socket;
		//Reset ping.
		players[socket.id].ping = true;
		players[socket.id].faults = 0;
		playernums.push(socket.id);
		playernames[players[socket.id].name] = socket.id;
		socket.emit(Type.ROOMLIST,namelist);
		//Delete old value in the dcd array
		delete dcd[ip];
		
		socket.emit(Type.ACCEPT);
		socket.emit(Type.SYSTEM,'You have reconnected.');
		//If the player is first, set them as the mod.
		if (Object.keys(players).length==0)
		{
			mod = socket.id;
		}
		var name = players[socket.id].name;
		//Inform everyone of the new arrival.
		io.emit(Type.JOIN,name);
		//Tell the new arrival what phase it is.
		socket.emit(Type.SETPHASE,phase);
		
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
	}
	else
	{
		socket.disconnect();
	}
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
	socket.on(Type.SETROLE,function(name,role)
	{
		role = sanitize(role);
		if (role.length > 16)
		{
			socket.emit(Type.SYSTEM,'Role name cannot be more than 16 characters.');
		}
		else
		{
			players[playernames[name]].role = role;
			players[playernames[name]].s.emit(Type.SYSTEM,'Your role is '+role);
		}
	});
	socket.on(Type.SETPHASE,function(p){
		if (mod==socket.id && p>=0 && p< Object.keys(Phase).length)
		{
			setPhase(p);
		}	
	});
	socket.on(Type.WILL,function(will)
	{
		will = sanitize(will);
		will = will.replace(/(\n)/g,'<br />');
		players[socket.id].will = will;	
	});
	socket.on(Type.TOGGLELIVING,function(name)
	{
		var player = getPlayerByName(name);
		if (player)
		{
			player.alive = !player.alive;
			player.chats.dead = !player.chats.dead;
			if (player.alive)
			{
				io.emit(Type.HIGHLIGHT,name+' has been revived!');
				player.s.emit(Type.PRENOT,'REVIVE');
				io.emit(Type.TOGGLELIVING,{name:name});
			}
			else
			{
				io.emit(Type.HIGHLIGHT,name+' has died!');
				io.emit(Type.HIGHLIGHT,'Their role was '+player.role);
				io.emit(Type.WILL,player.will);
				player.s.emit(Type.PRENOT,"DEAD");
				io.emit(Type.TOGGLELIVING,{name:name,role:player.role});
			}
		}
	});
	socket.on(Type.VOTE,function(name)
	{
		console.log(name);
		console.log(getPlayerByName(name));
		
		if (phase != Phase.VOTING)
		{
			socket.emit(Type.SYSTEM,'You can only vote in the voting phase.');
		}
		else if (!players[socket.id].alive)
		{
			socket.emit(Type.SYSTEM,'You need to be alive to vote.');
		}
		else
		{
			var player = getPlayerByName(name);
			
			if (player)
			{
				if (name == players[socket.id].name)
				{
					socket.emit(Type.SYSTEM,'You cannot vote for yourself.');
				}
				else if (players[socket.id].votingFor == player.s.id) //Same person, cancel vote.
				{
					var prev = player.name;
					if (players[socket.id].mayor)
					{
						players[players[socket.id].votingFor].votes-=3;	
					}
					else
					{
						players[players[socket.id].votingFor].votes--; //subtract a vote from the person that was being voted.
					}
					io.emit(Type.VOTE,players[socket.id].name,' has cancelled their vote.','',prev);
					players[socket.id].votingFor = undefined;
				}
				else if (players[socket.id].votingFor) //Previous voter
				{
					var prev = players[socket.id].votingFor;
					if (players[socket.id].mayor)
					{
						players[prev].votes-=3; //subtract 3 votes from the person that was being voted.		
						player.votes+=3; //Add 3 votes to the new person		
					}
					else
					{
						players[prev].votes--; //subtract a vote from the person that was being voted.		
						player.votes++; //Add a vote to the new person			
					}					
					io.emit(Type.VOTE,players[socket.id].name,' has changed their vote to ',player.name,players[prev].name);
					players[socket.id].votingFor = player.s.id;					
				}
				else
				{ 
					io.emit(Type.VOTE,players[socket.id].name,' has voted for ',player.name);
					players[socket.id].votingFor = player.s.id;
					if (players[socket.id].mayor)
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
				socket.emit(Type.SYSTEM,'"'+name+'" is not a valid player. Did you break something?');
			}
		}
	});
	socket.on(Type.TOGGLE,function(name,chat)
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
						case 'jailor': notify = 'You are now the jailor.'; break;
						case 'jailed': notify = undefined; break; //No message
						case 'medium': notify = 'You can now hear the dead at night.'; break;
						default: notify = 'You can now talk in the '+chat+' chat.'; break;
					}
				}
				else
				{
					switch (chat)
					{
						case 'jailor': notify = 'You are no longer the jailor.'; break;
						case 'jailed': notify = undefined; break; //No message
						case 'medium': notify = 'You can no longer hear the dead at night.'; break;
						default: notify = 'You can no longer talk in the '+chat+' chat.'; break;
					}	
				}
				if (notify) player.s.emit(Type.SYSTEM,notify)	
			}
			else
			{
				switch (chat)
				{
					case 'mayor': 
						if (player.mayor === undefined)
						{
							player.mayor = false; //False, meaning not revealed.
							player.s.emit(Type.SYSTEM,'You are now the Mayor! Use /reveal to reveal yourself and get 3 votes.');
						}
						else
						{
							player.mayor = undefined; //Undefined, meaning not mayor.
							player.s.emit(Type.SYSTEM,'You are no longer the Mayor.');
						}
					break;				
					case 'spy': 
						player.hearwhispers = !player.hearwhispers;
						if (player.hearwhispers)
						{
							player.s.emit(Type.SYSTEM,'You can now hear whispers.');
						}
						else
						{
							player.s.emit(Type.SYSTEM,'You can no longer hear whispers.');
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
	});
	socket.on(Type.VERDICT,function(verdict)
	{
		if (phase == Phase.VERDICTS)
		{
			if (ontrial == socket.id)
			{
				socket.emit(Type.SYSTEM,'You cannot vote on your own trial.');
			}
			else if (!players[socket.id].alive)
			{
				socket.emit(Type.SYSTEM,'You need to be alive to vote.');
			}
			else
			{
				var name = players[socket.id].name;
				if (verdict === true) //Inno
				{
					if (players[socket.id].verdict == 1) //Already inno, cancel
					{
						players[socket.id].verdict = 0;
						io.emit(Type.VERDICT,name,2);
					}
					else if (players[socket.id].verdict == -1) //Guilty, change
					{
						players[socket.id].verdict = (players[socket.id].mayor)?3:1;
						io.emit(Type.VERDICT,name,1);
					}
					else
					{
						players[socket.id].verdict = (players[socket.id].mayor)?3:1;;
						io.emit(Type.VERDICT,name,0);
					}
				}
				else if (verdict === false) //Guilty
				{
					if (players[socket.id].verdict == -1) //Already guilty, cancel
					{
						players[socket.id].verdict = 0;
						io.emit(Type.VERDICT,name,2);
					}
					else if (players[socket.id].verdict == 1) //Inno, change
					{
						players[socket.id].verdict = (players[socket.id].mayor)?-3:-1;;
						io.emit(Type.VERDICT,name,1);
					}
					else
					{
						players[socket.id].verdict = (players[socket.id].mayor)?-3:-1;;
						io.emit(Type.VERDICT,name,0);
					}
				}
			}
		}
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
	return ( name.length != 0 && name.length<=16 &&  /[a-z]/i.test(name) && /^[a-z0-9-_]+$/i.test(name));
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
	phase = p;
	timer.setPhase(p);
	io.emit(Type.SETPHASE,phase);
	if (p == Phase.NIGHT)
	{
		//Special beginning of night messages.
		for (i in players)
		{
			if (players[i].chats.jailed)
			{
				players[i].s.emit(Type.PRENOT,'JAILED');
				//inform the jailor of their success.
				for (j in players)
				{
					if (players[j].chats.jailor)
					{
						players[j].s.emit(Type.PRENOT,'JAILING');
					}
				}
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
			socket.emit(Type.SYSTEM,'No player is currently on trial. Phase is being set back to voting.');
			p=Phase.VOTING;
			io.emit(Type.SETPHASE,Phase.VOTING);
		}
	}
	if (p == Phase.VOTING)
	{
		clearVotes();
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
		io.emit(Type.SETPHASE,phase,true);
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
//--Timer object

function Timer() 
{
	return {
		time:0,
		buffertime:undefined,
		phase:[0,0,0, //Pregame, Roles, Modtime.
			60, //Day
			30, //Voting
			20, //Trial
			20, //Verdict
			10, //Last words
			60 //Night
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
			}
		},
		tick: function(){
			if (this.time>0) 
			{
				this.time--;
			}
			else
			{
				this.tock();
			}
			io.emit(Type.TICK,this.time);
			setTimeout(function()
			{
				timer.tick();
			},1000);
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
			}
			else
			{
				this.time = this.phase[num];
			}
		}
	}
}
//--Player object
function Player(socket,name,ip)
{
	//Add to the playernames array, allowing this object to be referenced by name.
	playernames[name] = socket.id;
	//Add to the playernums array, allowing this obeject ot be referenced by number.
	playernums.push(socket.id);
	return {
			s:socket,
			name:name,
			dev:false,
			ip:ip, 
			will:'',
			ping:true,
			fault:0,
			role:'NoRole',
			alive:true,
			mayor:undefined,
			hearwhispers:false,
			votingFor:undefined,
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
					}
				}
			},
			clear:function(){
				delete dcd[this.ip];
			},
			command:function(com){
				var c = com.split(' ');
				switch (c[0])
				{
					case 'whisper':
					case 'w':
						if (phase >= Phase.DAY && phase <= Phase.LASTWORDS)
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
									if (target)
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
									socket.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
								}
							}
							else
							{
								socket.emit(Type.SYSTEM,'The syntax of this command is \'/w name message\'.');
							}
						}
						else
						{
							socket.emit(Type.SYSTEM,'You can only whisper during the day.');
						}
					break;
					case 'givemod':
						if (mod == this.s.id)
						{
							if (c.length < 2)
							{
								socket.emit(Type.SYSTEM,'The syntax of this command is \'/givemod player\'.');
							}
							else
							{
								if (playernames[c[1]])
								{
									
									//Valid player name.
									players[mod].s.emit(Type.SETMOD,false);
									if (players[playernames[c[1]]].s.id == this.s.id)
									{
										this.s.emit(Type.SYSTEM,'You are already the mod.');
									}
									else
									{
										mod = players[playernames[c[1]]].s.id;
										players[mod].s.emit(Type.SETMOD,true);
										io.emit(Type.HIGHLIGHT,this.name+' gives mod to '+players[mod].name+'.');
										io.emit(Type.SWITCH,this.name,players[mod].name);
										//Switch the numbers.
										var a = playernums.indexOf(this.s.id);
										var b = playernums.indexOf(mod);
										var temp = playernums[a];
										playernums[a] = playernums[b];
										playernums[b] = temp;
									}
								}
								else if (!isNaN(c[1])) //It's a number.
								{
									//Get the numbered player.
									var target = getPlayerByNumber(c[1]);
									if (target)
									{
										var name = target.name;
										if (target.s.id != this.s.id)
										{
											players[mod].s.emit(Type.SETMOD,false);
											mod = target.s.id;
											players[mod].s.emit(Type.SETMOD,true);
											io.emit(Type.HIGHLIGHT,this.name+' gives mod to '+players[mod].name+'.');
											io.emit(Type.SWITCH,this.name,players[mod].name);
											//Switch the numbers.
											var a = playernums.indexOf(this.s.id);
											var b = playernums.indexOf(mod);
											var temp = playernums[a];
											playernums[a] = playernums[b];
											playernums[b] = temp;
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
									socket.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
								}
							}
						}
						else
						{
							socket.emit(Type.SYSTEM,'You need to be the mod to use this command.');
						}
					break;
					case 'mod':
						if (c.length < 2)
						{
							socket.emit(Type.SYSTEM,'The syntax of this command is \'/mod message\'.');
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
					case 'dev':
						if (c.length == 2)
						{
							var password = c[1];
							if (this.dev)
							{
								socket.emit(Type.SYSTEM,'You already have access to the dev commands.');
							}
							else if (apass == password)
							{
								socket.emit(Type.SYSTEM,'Password accepted. You now have access to dev commands.');
								this.dev=true;
								io.emit(Type.SETDEV,this.name);
							}
							else
							{
								socket.emit(Type.SYSTEM,'Incorrect password!');
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
							socket.emit(Type.SYSTEM,'...but you aren\'t the Mayor.');
						}
						else if (this.mayor)
						{
							socket.emit(Type.SYSTEM,'You have already revealed yourself as the Mayor.');
						}
						else if (phase >= Phase.DAY && phase <= Phase.LASTWORDS)
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
							socket.emit(Type.SYSTEM,'You can only reveal as the Mayor during the day.');
						}
					break;
					case 'kick':
						if (c.length == 2)
						{
							if (this.dev)
							{
								var name = c[1];
								var tokick = getPlayerByName(name);
								if (!isNaN(name))
								{
									socket.emit(Type.SYSTEM,'Please use the name of the player you wish to kick, not the number. This is to ensure no players are kicked accidentally.');
								}
								else if (tokick)
								{
									tokick.s.emit(Type.SYSTEM,'You have been kicked from the game!');
									io.emit(Type.HIGHLIGHT,tokick.name+' has been kicked by '+this.name+'!');
									tokick.s.disconnect();
								}
								else
								{
									socket.emit(Type.SYSTEM,'\''+name+'\' is not a valid player.');
								}
							}
							else
							{
								socket.emit(Type.SYSTEM,'You do not have the correct permissions to use this command.');
							}
						}
						else
						{
							socket.emit(Type.SYSTEM,'The syntax of this command is \'/kick user\'.');
						}
					break;
					case 'msg':
						if (mod==socket.id)
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
									if (target)
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
									socket.emit(Type.SYSTEM,'\''+c[1]+'\' is not a valid player.');
								}
							}
							else
							{
								socket.emit(Type.SYSTEM,'The syntax of this command is \'/msg name message\'.');
							}
						}
						else
						{
							socket.emit(Type.SYSTEM,'Only the mod can use this command. If you are trying to whisper, try \'/w name message\'');
						}
					break;
					default:
						socket.emit(Type.SYSTEM,'Command not recognized.');
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
				else
				{
					to.s.emit(Type.WHISPER,{from:this.name, msg:msg});
					this.s.emit(Type.WHISPER,{to:to.name,msg:msg});
					players[mod].s.emit(Type.WHISPER,{from:this.name,to:to.name,msg:msg});
					//SLOW
					for (i in players)
					{
						if (players[i].hearwhispers)
						{
							players[i].s.emit(Type.WHISPER,{from:this.name,to:to.name,msg:msg});
						}
					}
					//Public whispering message
					io.emit(Type.WHISPER,{from:this.name,to:to.name});
				}

			},
			message:function(msg)
			{
				switch (phase)
				{
					case Phase.PREGAME:
						io.emit(Type.MSG,this.name,msg);
					break;
					case Phase.ROLES:
						if (mod==this.s.id)
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
						if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else if (this.alive)
						{
							io.emit(Type.MSG,this.name,msg);
						}
						else //Deadchat
						{
							this.specMessage(msg,{dead:true});
						}
					break;
					case Phase.TRIAL:
						if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else if (this.alive)
						{							
							if (ontrial == this.s.id)
							{
								io.emit(Type.MSG,this.name,msg);
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
						if (this.alive)
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
							if (this.chats.medium) //Not else if, the medium's messages go through if they are jailed.
							{
								this.specMessage(msg,{dead:true},'Medium');
								//Echo the message back to the medium.
								this.s.emit(Type.MSG,'Medium',{msg:msg,styling:'dead'});
							}
						}
						else //Deadchat
						{
							this.specMessage(msg,{dead:true,medium:true});
						}
					break;
					case Phase.MODTIME:
						if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else
						{
							this.s.emit(Type.SYSTEM,'Please do not talk during mod time.');
						}
					break;
					case Phase.LASTWORDS:
						if (mod==this.s.id)
						{
							io.emit(Type.HIGHLIGHT,msg);
						}
						else if (ontrial == this.s.id)
						{
							io.emit(Type.MSG,this.name,msg);
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
