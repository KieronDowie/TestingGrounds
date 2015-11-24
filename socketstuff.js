//Variable to track connection
connection = false;
//Players on list
var users = [];
//Mod
var mod = false;
//Connect attempts
var connectAttempt = 0;
var kicked = false;
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
	GETWILL:37
};
function modInterface()
{
	for (x = 0; x < users.length; x++)
	{
		var li = $('<li></li>');
		var num = (x==0)?'MOD':x;
		var info = $('<div class="info"><span class="num">'+num+'</span><span class="name">'+users[x]+'</span></div>');
		$('#userlist li')[x].innerHTML='';
		//Add in a rolelist button if it is does not already exist
		if ($('#rolelistbutton').length == 0)
		{
			var rlbutton = $('<div id="rolelistbutton"></div>');
			rlbutton.click(function()
			{
				openRolelist();
			});
			$('#inputarea').append(rlbutton);
		}
		//Addition to the top row
		var kill = $('<div class="controlbutton killbutton">Kill</div>');
		kill.click(function()
		{
			if ($(this).hasClass('killbutton'))
			{
				var index = $('.killbutton, .revivebutton').index($(this))
				$(this).removeClass('killbutton');
				$(this).addClass('revivebutton');
				$(this).html('Revive');
			}
			else
			{
				var index = $('.killbutton, .revivebutton').index($(this))
				$(this).removeClass('revivebutton');
				$(this).addClass('killbutton');
				$(this).html('Kill');
			}
			socket.emit(Type.TOGGLELIVING,users[index]);
		});
		var jail= $('<div class="controlbutton jailbutton">Jail</div>');
		jail.click(function()
		{
			var index = $('.jailbutton, .releasebutton').index($(this))
			socket.emit(Type.TOGGLE,users[index],'jailed');
			if ($(this).hasClass('jailbutton'))
			{
				$(this).removeClass('jailbutton');
				$(this).addClass('releasebutton');
				$(this).html('Release');
			}
			else
			{
				$(this).removeClass('releasebutton');
				$(this).addClass('jailbutton');
				$(this).html('Jail');
			}	
		});
		var will = $('<div class="controlbutton modwillbutton">W</div>');
		var more = $('<div class="controlbutton more">v</div>');
		more.click(function()
		{
			openModList(this);
		});
		will.click(function()
		{
			openUserWill(this);
		});
		
		info.append(more);
		info.append(will);
		info.append(jail);
		info.append(kill);
		
		//Adding bottom row
		var modcontrols = $('<div class="modcontrols"></div>');
		var rolechanger = $('<input type="text" class="role"></li>');
		rolechanger.keydown(function(e)
		{
				if (e.keyCode==13) //Enter
				{
					var index = $('.role').index($(this));
					var name = $('.name')[index].innerHTML;		
					socket.emit(Type.SETROLE,name,this.value);
					this.style.background='green';
				}
				else
				{
					this.style.background='white';
				}
		});
		modcontrols.append(rolechanger);
		var buttons = ['mafia','jailor','spy','medium','mayor'];
		for (i in buttons)
		{
			var formatted = buttons[i][0].toUpperCase()+buttons[i].substring(1,buttons[i].length);
			var button = $('<div title="'+formatted+'" class="controlbutton '+buttons[i]+'button">');
			button.attr('type',buttons[i]);
			button.click(function()
			{
				var name = $($(this).parent().parent().children()[0]).children()[1].innerHTML;	
				var chat = $(this).attr('type');
				if ($(this).hasClass(chat+'buttondown'))
				{
					$(this).removeClass(chat+'buttondown');
				}
				else
				{
					$(this).addClass(chat+'buttondown');
				}
				socket.emit(Type.TOGGLE,name,chat);
			});
			modcontrols.append(button);
		}
		$($('#userlist li')[x]).append(info);
		$($('#userlist li')[x]).append(modcontrols);
	}
}
var socket= io.connect({'pingInterval': 45000});
socket.on(Type.MSG,function(name,msg)
{
	if (msg.styling)
	{
		msg.name=name;
		addMessage(msg,'custom');
	}
	else
	{
		addMessage(name+': '+msg,'msg');
	}
});
socket.on(Type.HIGHLIGHT,function(msg)
{
	addMessage(msg,'highlight');
});
socket.on(Type.PING,function()
{
	socket.emit(Type.PONG);
});
socket.on(Type.JOIN,function(name, reconnect)
{
	users.push(name);
	if (reconnect)
	{
		addMessage(name+' has reconnected.','system');
	}
	else
	{
		addMessage(name+' has joined.','system');
	}
	var num = $('#userlist').children().length;
	if (num==0)
	{
		num='MOD';
		//Player is first. They are mod.
		mod=true;
		//Add in a rolelist button
		var rlbutton = $('<div id="rolelistbutton"></div>');
		rlbutton.click(function()
		{
			openRolelist();
		});
	}
	//Top row, normal users.
	var li = $('<li></li>');
	var info = $('<div class="info"></div>');
	var name = $('<span class="name">'+name+'</span>');
	var num = $('<span class="num">'+num+'</span>');
	info.append(num);
	info.append(name);
	//Bottom row
	if (mod)
	{		
		if ($('#userlist').children().length == 0)
		{
			name.css('max-width','80px');
		}
		else
		{
			name.css('max-width','100px');
		}
		
		$('#inputarea').append(rlbutton);
		//Addition to the top row
		var kill = $('<div class="controlbutton killbutton">Kill</div>');
		kill.click(function()
		{
			if ($(this).hasClass('killbutton'))
			{
				var index = $('.killbutton, .revivebutton').index($(this))
				$(this).removeClass('killbutton');
				$(this).addClass('revivebutton');
				$(this).html('Revive');
			}
			else
			{
				var index = $('.killbutton, .revivebutton').index($(this))
				$(this).removeClass('revivebutton');
				$(this).addClass('killbutton');
				$(this).html('Kill');
			}
			socket.emit(Type.TOGGLELIVING,users[index]);
		});
		var jail= $('<div class="controlbutton jailbutton">Jail</div>');
		jail.click(function()
		{
			var index = $('.jailbutton, .releasebutton').index($(this))
			socket.emit(Type.TOGGLE,users[index],'jailed');
			if ($(this).hasClass('jailbutton'))
			{
				$(this).removeClass('jailbutton');
				$(this).addClass('releasebutton');
				$(this).html('Release');
			}
			else
			{
				$(this).removeClass('releasebutton');
				$(this).addClass('jailbutton');
				$(this).html('Jail');
			}	
		});
		var will = $('<div class="controlbutton modwillbutton">W</div>');
		var more = $('<div class="controlbutton more">v</div>');
		more.click(function(e)
		{
			openModList(e.target);
		});
		will.click(function(e)
		{
			openUserWill(e.target);
		});
		info.append(more);
		info.append(will);
		info.append(jail);
		info.append(kill);
		//Adding bottom row
		var modcontrols = $('<div class="modcontrols"></div>');
		var rolechanger = $('<input type="text" class="role"></li>');
		rolechanger.keydown(function(e)
		{
				if (e.keyCode==13) //Enter
				{
					var index = $('.role').index($(this));
					var name = $('.name')[index].innerHTML;		
					socket.emit(Type.SETROLE,name,this.value);
					this.style.background='green';
					this.old = this.value;
				}
		});
		rolechanger.keyup(function(e){
			if (this.old != this.value)
			{
				this.style.background='white';
			}
			else
			{
				this.style.background='green';
			}
			//Stop it from going over 16 chars
			if (this.value.length > 16)
			{
				this.value = this.value.substring(0,15);	
			}			
		});
		modcontrols.append(rolechanger);
		
		var buttons = ['mafia','jailor','spy','medium','mayor'];
		for (i in buttons)
		{
			var formatted = buttons[i][0].toUpperCase()+buttons[i].substring(1,buttons[i].length);
			var button = $('<div title="'+formatted+'" class="controlbutton '+buttons[i]+'button">');
			button.attr('type',buttons[i]);
			button.click(function()
			{
				var name = $($(this).parent().parent().children()[0]).children()[1].innerHTML;	
				var chat = $(this).attr('type');
				if ($(this).hasClass(chat+'buttondown'))
				{
					$(this).removeClass(chat+'buttondown');
				}
				else
				{
					$(this).addClass(chat+'buttondown');
				}
				socket.emit(Type.TOGGLE,name,chat);
			});
			modcontrols.append(button);
		}
	}
	li.append(info);
	if (mod) {
		li.append(modcontrols);
	}
	$('#userlist').append(li);
});
socket.on(Type.LEAVE,function(name)
{
	addMessage(name +' has left.','system');
	var index = users.indexOf(name);
	$($('#userlist').children()[index]).remove();
	//Recalculate the numbering.
	var nums = $('.num');
	for (var i = index; i < nums.length; i++ )
	{
		if (i!=0)
		{
			nums[i].innerHTML=''+i;
		}
		else
		{
			nums[i].innerHTML='MOD';
		}
	}
	//Remove from list
	users.splice(index,1);
});
socket.on(Type.SETMOD,function(val)
{
	if (val && !mod)
	{
		mod = true;
		modInterface();
	}
	else if (mod)
	{
		mod = false;
		for (i = 0; i < users.length; i++)
		{
			var num = i==0?'MOD':i;
			//Top row, normal users.
			var info = $('<div class="info"><span class="num">'+num+'</span><span class="name">'+users[i]+'</span></div>');
			$('#userlist li')[i].innerHTML='';
			$($('#userlist li')[i]).append(info);
		}		
	}
});
socket.on(Type.SYSTEM,function(msg)
{
	addMessage(msg,'system');
});
socket.on(Type.ROOMLIST,function(list)
{
	users = [];
	$('#userlist').empty();
	for (i in list)
	{
		var num = (i==0)?'MOD':i; //Num is MOD if i is 0, otherwise num is equal to i.
		if (list[i].role)
		{	
			//Player is dead.
			$('#userlist').append('<li class="deadplayer"><div><span class="num">'+num+'</span><span class="name">'+list[i].name+'</span></div><div><span>'+list[i].role+'</span></div></li>');
		}
		else
		{
			$('#userlist').append('<li><div class="info"><span class="num">'+num+'</span><span class="name">'+list[i].name+'</span></div></li>');
		}
		users.push(list[i].name);
	}
});
socket.on(Type.TOGGLELIVING,function(p)
{
	if (!mod)
	{
		var index = users.indexOf(p.name);
		index = index==0?'MOD':index;
		var li = $('#userlist').children()[index];
		if (p.role)
		{
			li.outerHTML = '<li class="deadplayer"><div><span class="num">'+index+'</span><span class="name">'+p.name+'</span></div><div><span>'+p.role+'</span></div></li>';
		}
		else
		{
			li.outerHTML = '<li><div class="info"><span class="num">'+index+'</span><span class="name">'+p.name+'</span></div></li>';
		}
	}	
});
socket.on(Type.KICK,function()
{
	kicked = true;
});
socket.on(Type.SETPHASE,function(phase,silent)
{
	//Remove any remaining voting interfaces
	$('.votinginterface').remove();
	//Remove any remaining verdict interfaces
	$('.verdictinterface').remove();
	$('header ul li').css('color','grey');
	$($('header ul li')[phase]).css('color','black');
	if (!silent)	addMessage($('header ul li')[phase].innerHTML,'highlight');
	if (phase == 4 && !mod) //Voting
	{
		//Add the voting interface
		for (i = 1; i < users.length; i++)
		{
			if (!$($('#userlist li')[i]).hasClass('deadplayer'))
			{
				var li = $('#userlist').children()[i];
				var button = $('<div class="votebutton">VOTE</div>');
				button.click(function()
				{
					var index = $('#userlist li').index(this.parentNode.parentNode.parentNode);
					var name = users[index];
					socket.emit(Type.VOTE,name);	
				});
				var count = $('<div class="votecount">0</div>');
				var votinginterface = $('<div class="votinginterface"></div>');
				votinginterface.append(button);
				votinginterface.append(count);
				$($(li).children()[0]).append(votinginterface);
			}
		}
	}
	if (phase == 6 && !mod) //Verdicts, guilty/inno/abstain
	{
		//Add verdict interface
		var verdict = $('<div class="verdictinterface"></div>');
		var guilty = $('<div class="verdictbutton guiltybutton">Guilty</div>');
		guilty.click(function()
		{
			socket.emit(Type.VERDICT,false); //false for guilty
		});
		var inno = $('<div class="verdictbutton innobutton">Innocent</div>');
		inno.click(function()
		{
			socket.emit(Type.VERDICT,true); //true for inno
		});
		
		verdict.append(guilty);
		verdict.append(inno);
		$('#main').append(verdict);
		verdict.animate({'left':'60%'},'fast');
	}
});
socket.on(Type.WHISPER,function(msg)
{
	addMessage(msg,'whisper'); 
});
socket.on(Type.MOD,function(msg)
{
	addMessage(msg,'mod'); 	
});
socket.on(Type.SWITCH,function(name1,name2)
{
	var i1=users.indexOf(name1);
	var i2=users.indexOf(name2);
	users[i1] = name2;
	users[i2] = name1;
	//Swap li's
	var a = $($('#userlist li')[i1]); 
	var b = $($('#userlist li')[i2]);
	//Swap list items
	b.before(a);
	$('#userlist li:first-child').before(b);
	//Swap numbers
	$('.num')[i1].innerHTML = (i1==0)?'MOD':i1;
	$('.num')[i2].innerHTML = (i2==0)?'MOD':i2;
});
socket.on(Type.PRENOT,function(notification)
{
	switch (notification)
	{
		case 'DEAD':			
			addMessage({msg:'You have died!',styling:'dying'},'prenot');
		break;
		case 'BLACKMAIL':
			addMessage({msg:'Someone threatened to reveal your secrets. You are blackmailed!',styling:'dying'},'prenot');
		break;
		case 'TARGETIMMUNE':
			addMessage({msg:'Your target was immune to your attack!',styling:'dying'},'prenot');
		break;
		case 'IMMUNE':
			addMessage({msg:'You were attacked, but you are immune at night!',styling:'dying'},'prenot');
		break;
		case 'JESTER':
			addMessage({msg:'The jester will have his revenge from the grave!',styling:'dying'},'prenot');
		break;
		case 'HAUNT':
			addMessage({msg:'<Death from guilt here>',styling:'dying'},'prenot');
		break;
		case 'SHOTVET':
			addMessage({msg:'You were shot by the Veteran you visited!',styling:'dying'},'prenot');
		break;
		case 'RB':
			addMessage({msg:'You were roleblocked!',styling:'dying'},'prenot');
		break;
		case 'REVIVE':
			addMessage({msg:'You were revived!',styling:'reviving'},'prenot');
		break;
		case 'HEAL':
			addMessage({msg:'You were attacked but someone nursed you back to health!',styling:'reviving'},'prenot');
		break;
		case 'JAILED':
			addMessage({msg:'You were hauled off to jail!',styling:'jailing'},'prenot');
		break;
		case 'JAILING':
			addMessage({msg:'You hauled your target off to jail!',styling:'jailing'},'prenot');
		break;		
		case 'FULLMOON':
			addMessage({msg:'There is a full moon out tonight.',styling:'moon'},'prenot');
		break;
	}
});
socket.on(Type.VOTE,function(voter,msg,voted,prev)
{
	if (!mod)
	{
		if (prev)
		{
			var index = users.indexOf(prev);
			var li =$('#userlist li')[index]; 
			if (li.childNodes[0].childNodes[2])
			{
				var count = li.childNodes[0].childNodes[2].childNodes[1];
				var num = parseInt(count.innerHTML);
				num--;
				count.innerHTML=num;
			}
		}
		if (voted!='')
		{
			var index = users.indexOf(voted);
			var li =$('#userlist li')[index]; 
			var count = li.childNodes[0].childNodes[2].childNodes[1];
			var num = parseInt(count.innerHTML);
			num++;
			count.innerHTML=num;
		}
	}
	addMessage({voter:voter,msg:msg,voted:voted},'vote');
});
socket.on(Type.VERDICT,function(name,val)
{
	addMessage({name:name,val:val},'verdict');
});
socket.on(Type.CLEARVOTES,function()
{
	$('.votecount').html('0');	
});
socket.on(Type.TICK,function(time)
{
	$('#clock').html(time);
});
socket.on(Type.JUDGEMENT,function(votes,result)
{
	var msg = {
		result:result,
		votes:votes
		};
	addMessage(msg,'judgement');
});
socket.on(Type.SETDEV,function(name)
{
	var index = users.indexOf(name);
	$($('.name')[index]).addClass('dev');
	$($('.num')[index]).addClass('dev');
});
socket.on(Type.ROLECARD,function(card)
{
	addMessage(card,'rolecard');
});
socket.on(Type.WILL,function(will)
{
	addMessage(will,'will');
});
socket.on(Type.ROLEUPDATE,function(send){
	var index = users.indexOf(send.name);
	for (i in send)
	{
		if ($('.'+i+'button')[index] && send[i])
		{
			var button = $($('.'+i+'button')[index]);
			button.addClass(i+'buttondown');
			button.removeClass(i+'button');		
		}
	}
	if (send.role)
	{
		$($('.role')[index]).val(send.role);
		$('.role')[index].style.background = 'green';
	}
	if (!send.alive)
	{
		var button = $($('.killbutton')[index]);
		button.addClass('revivebutton');
		button.html('Revive');
	}
	if (send.jailed)
	{
		var button = $($('.jailbutton')[index]);
		button.addClass('releasebutton');
		button.html('Release');
	}
});
socket.on(Type.MASSROLEUPDATE,function(people){
	for (j in people)
	{
		var send = people[j];
		var index = users.indexOf(send.name);
		for (i in send)
		{
			if ($('.'+i+'button')[index] && send[i])
			{
				var button = $($('.'+i+'button')[index]);
				button.addClass(i+'buttondown');
				button.removeClass(i+'button');		
			}
		}
		if (send.role)
		{
			$($('.role')[index]).val(send.role);
			$('.role')[index].style.background = 'green';
		}
		if (!send.alive)
		{
			var button = $($('.killbutton')[index]);
			button.addClass('revivebutton');
			button.html('Revive');
		}
		if (send.jailed)
		{
			var button = $($('.jailbutton')[index]);
			button.addClass('releasebutton');
			button.html('Release');
		}
	}
});
socket.on(Type.GETWILL,function(name,willcontent){
	willcontent = willcontent.replace(/(<br>)/g,'\n');
	var will = $('<div id="modwill"></div>');
	will.name = name;
	var close = $('<div id="closewill"></div>');
	close.click(function()
	{	
		socket.emit(Type.WILL,$('#modwill textarea').val(),name);
		$(this.parentNode).remove();
	});
	var txt = $('<textarea id="willcontent"></textarea>');
	txt.val(willcontent);
	will.append(close);
	will.append(txt);
	$('body').append(will);
	will.show();
});
socket.on('connect_error', function (err) {
    //$('#try').html('<p>Our dancing kitty has failed to reconnect you. No milk for him tonight. Please rejoin.</p>');
});
socket.on(Type.ACCEPT,function()
{
	connectAttempt = 0;
	$('.blocker').remove();
});
socket.on(Type.ROLL,function(result,names)
{
	rolelist_result = [];
	for (i in result)
	{
		$($('.person')[i]).html(names[i]);
		$($('.myrole')[i]).html(result[i]);
		if ($(result[i]).html() !== undefined)
		{
			rolelist_result.push($(result[i]).html());
		}
		else
		{
			rolelist_result.push(result[i]);
		}
	}
	rolelist_names = names;
1});
socket.on(Type.LATENCIES,function(p)
{
	if (typeof p == "number")
	{
		addMessage('Ping: '+p+'ms','system');
	}
	else
	{
		for (i in p)
		{
			addMessage(i+': '+p[i]+'ms','system');
		}
	}
});
socket.on(Type.SHOWLIST,function(list)
{
	addMessage(list,'rolelist');	
});
socket.on(Type.SHOWALLROLES,function(list)
{
	addMessage(list,'allroles');	
});
socket.on('disconnect',function()
{
	if (!kicked)
	{
		if (connectAttempt <10 )
		{
			if ($('.blocker').length == 0)
			{
				var blocker = $('<div class="blocker"></div>');
				var kitteh = $('<img src="http://media.giphy.com/media/zwmeWxShpVVyU/giphy.gif">');
				kitteh.on('error',function()
				{
					//Problem with the giphy gif, load from server.
					this.src = 'dancingkitteh.gif';
				});
				var notify = $('<div class="alert"></div>');
				notify.append($('<h3>You have disconnected!</h3>'));
				notify.append(kitteh);
				notify.append($('<p id="try">Please wait while this dancing kitty reconnects you... <p id="count"></p></p>'));
				blocker.append(notify);
				$('body').append(blocker);
			}
			if (connectAttempt == 0)
			{
				socket.connect();
				connectAttempt++;
				$('#count').html(connectAttempt+'/10');
			}
			else if (connectAttempt < 10)
			{
				setTimeout(function()
				{
					socket.connect();
					connectAttempt++;
					$('#count').html(connectAttempt+'/10');
				},1000);
			}
		}
		else
		{
			$('#try').html('<p>Our dancing kitty has failed to reconnect you. No milk for him tonight. Please rejoin.</p>');
		}
	}
});
