mod = false;
$(document).ready(function(){	
	$('header ul li').on('click',function(e)
	{
		var phase = $('header ul li').index(this);
		socket.emit(Type.SETPHASE,phase);
	});
});
//Check if the window is infocus
var isActive = true;
window.onfocus = function()
{
	isActive=true;
};
window.onblur = function()
{
	isActive=false;
}
function openWill()
{
	$('#will').show();
}
function closeWill()
{
	$('#will').hide();
	var will = $('#willcontent').val();
	socket.emit(Type.WILL,will);
}
function highlightTitle()
{
	var arr=["!-Testing Grounds-!","Testing Grounds","!-Testing Grounds-!","Testing Grounds"];
	var c=0;
	var func=function()
	{
		document.title=arr[c];
		c++;
		if (c<arr.length)
		{
			setTimeout(func,500);
		}
	};
	func();
}
function checkKey(e)
{
	if (e.keyCode==13 && $('#c').val() != '' ) //Enter
	{
		var msg = $('#c').val();
		$('#c').val('');
		socket.emit(Type.MSG,msg);
	}	
	//Limit length
	if ($('#c').val().length >= 200)
	{
		$('#c').val($('#c').val().substring(0,199));
	}
}
function addMessage(msg, type)
{
	if (!isActive)
	{
		highlightTitle();
	}
	switch (type)
	{
		case 'msg':
			$('#main').append('<li>'+msg+'</li>');
		break;
		case 'rolecard':
			$('#main').append('<li>'+msg+'</li>');
		break;
		case 'system':
			$('#main').append('<li><b>'+msg+'</b></li>');
		break;
		case 'highlight':
			$('#main').append('<li class="highlight"><b>'+msg+'</b></li>');
		break;
		case 'whisper':
			if (!msg.msg)
			{
				$('#main').append('<li><b>'+msg.from+'</b><span class="whisper"> is whispering to </span><b>'+msg.to+'</b></span></li>');
			}
			else if (msg.from && msg.to)
			{
				$('#main').append('<li><b>'+msg.from+'</b><span class="whisper"> whispers to </span><b>'+msg.to+':</b><span class="whisper"> '+msg.msg+' </span></li>');
			}
			else if (msg.from)
			{
				$('#main').append('<li><span class="whisper">From</span> <b>'+msg.from+':</b><span class="whisper"> '+msg.msg+' </span></li>');
			}
			else if (msg.to)
			{
				$('#main').append('<li><span class="whisper">To</span> <b>'+msg.to+':</b><span class="whisper"> '+msg.msg+' </span></li>');
			}
			else
			{
				alert('malformed message!');
			}
		break;
		case 'mod':
			if (msg.from)
			{
				$('#main').append('<li><span class="mod">From</span> <b>'+msg.from+':</b><span class="mod"> '+msg.msg+' </span></li>');
			}
			else if (msg.to)
			{
				$('#main').append('<li><span class="mod">To</span> <b>'+msg.to+':</b><span class="mod"> '+msg.msg+' </span></li>');
			}
			else
			{
				alert('malformed message!');
			}
		break;
		case 'custom':	
			$('#main').append('<li><span class="'+msg.styling+'">'+msg.name+': '+msg.msg+'</span></li>');
		break;
		case 'prenot':
			$('#main').append('<li class="'+msg.styling+'">'+msg.msg+'</li>');
		break;
		case 'vote':
			$('#main').append('<li><b>'+msg.voter+'</b><span class="vote">'+msg.msg+'</span><b>'+msg.voted+'</b></li>');
		break;
		case 'verdict':
			if (msg.val==0)
			{
				$('#main').append('<li><b>'+msg.name+'</b> <span class="vote">has voted.</span>');
			}
			else if (msg.val==1)
			{
				$('#main').append('<li><b>'+msg.name+'</b> <span class="vote">has changed their vote.</span>');
			}
			else
			{
				$('#main').append('<li><b>'+msg.name+'</b> <span class="vote">has cancelled their vote.</span>');
			}
		break;
		case 'judgement':
			var guilties = 0;
			var innos = 0;
			for (i in msg.votes)
			{
				if (msg.votes[i] >0) //Inno
				{
					innos+=msg.votes[i];
				}
				else if (msg.votes[i] <0) //Guilty
				{
					guilties-=msg.votes[i];
				}
			}
			$('#main').append('<li><h2><span class="guilty"><b>'+guilties+'</b></span> - <span class="inno"><b>'+innos+'</b></span></h2>');
			if (msg.result) //Inno
			{
				$('#main').append('<li><span class="guilty"><b>Guilty!</b></span>');
			}
			else //Guilty
			{
				$('#main').append('<li><span class="inno"><b>Innocent!</b></span>');
			}
			var message = '';
			for (i in msg.votes)
			{
				switch (msg.votes[i])
				{
					case -1: case -3: message += '<li>'+i+' voted <span class="guilty">guilty</span>.</li>'; break;
					case 0: message += '<li>'+i+' <span class="abstain">abstained</span>.</li>'; break;
					case 1: case 3: message += '<li>'+i+' voted <span class="inno">innocent</span>.</li>'; break;
				}
			}
			$('#main').append(message);
		break;
		case 'will':
			if (msg == '')
			{
				$('#main').append('<li class="highlight"><span>We could not find a last will.</span></li>');
			}
			else
			{
				$('#main').append('<li class="highlight"><span>Their last will reads:</span></li>');
				$('#main').append('<li><div class="will">'+msg+'</div></li>');
			}
		break;
		default:
			alert('Bad message type!');
		break;
	}
	//Scroll down.
	var goto = $("#main")[0].scrollHeight;
	$("#main").animate({scrollTop:goto});
}
function openModList(targ)
{
	if ($(targ).hasClass('more'))
	{
		var alreadyOpen = (targ.children.length > 0);
		$('#morelist').remove();
		if (!alreadyOpen)
		{
			var actions = {
				'Blackmail':function()
				{
					var button = this.parentNode.parentNode;
					var li = button.parentNode.parentNode;
					var index = $('#userlist li').index(li);
					socket.emit(Type.TOGGLE,users[index],'blackmail');
				},
				'Seance':function()
				{
					console.log('seance!');
				}
			};
			var notifications = {
				'Roleblocked':function()
				{
					console.log('seance!');
				},
				'Healed':function()
				{
					console.log('blackmail!');
				},
				'Attacked(immune)':function()
				{
					console.log('seance!');
				},
				'Target immune':function()
				{
					console.log('seance!');
				},
				'Witched':function()
				{
					console.log('seance!');
				},
				'Shot by Vet':function()
				{
					console.log('You were shot by the Veteran you visited!');
				},
				'Vet shot':function()
				{
					console.log('You shot someone that visited you!');
				}
			};
			var list = $('<ul id="morelist"></ul>');
			list.css('top',targ.getBoundingClientRect().bottom);
			//Actions
			list.append($('<li class="morelistheading">Actions</li>'));
			for (i in actions)
			{
				var tmp = $('<li class="morelistitem">'+i+'</li>');
				tmp.click(actions[i]);
				list.append(tmp);
			}
			//Prenots
			list.append($('<li class="morelistheading">Notifications</li>'));
			for (i in notifications)
			{
				var tmp = $('<li class="morelistitem">'+i+'</li>');
				tmp.click(actions[i]);
				list.append(tmp);
			}
			//Append
			$(targ).append(list);
		}
	}
}
function openUserWill(e)
{
	
}
