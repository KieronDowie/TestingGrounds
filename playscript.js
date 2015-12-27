wmod = false;
var current_rolelist = [
	"Town Investigative",
	"Town Protective",
	"Random Town",
	"Random Town",
	"Random Town ",
	"Godfather",
	"Random Mafia",
	"Neutral Evil",
	"Town Support",
	"Random Mafia",
	"Town Killing",
	"Neutral Killing",
	"Town Power",
	"Neutral Benign",
	"Any"
];
//Globals
var rolelist_names = [];
var rolelist_result = [];
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
	if ($('#will').css('display') == 'none')
	{
		$('#will').show();
	}
	else
	{
		closeWill();
	}
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
	//Check if scrolled to bottom.
	var atBottom = ( 10 +$('#main').scrollTop() + $('#main').prop('offsetHeight') >= $('#main').prop('scrollHeight'));
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
		case 'hug':
			$('#main').append('<li>*<b>'+msg.name+' hugs '+msg.target+'</b>*</li>');
		break;
		case 'system':
			$('#main').append('<li><b>'+msg+'</b></li>');
		break;
		case 'highlight':
			var changes = ['maf','arso','jester','ww','town','sk','neut'];
			for (i in changes)
			{
				var start = '['+changes[i]+']';
				var end = '[/'+changes[i]+']';
				var a = msg.indexOf(start);
				var b = msg.indexOf(end);
				while ( a!=-1 && b!=-1)
				{
					var a = msg.indexOf(start);
					var b = msg.indexOf(end);
					msg = msg.replace(start,'<'+changes[i]+'>');
					msg = msg.replace(end,'</'+changes[i]+'>');
				}
			}
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
		case 'target':
			var str = msg.name+'('+msg.role+') is now targeting <b>'+msg.target+'</b>.';
			$('#main').append('<li><span class="mod">'+str+'</span></li>');
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
		case 'allroles':
			var list = $('<ul class="allroleslist"></ul>');
			for (i in msg)
			{
				list.append('<li class="displaylistitem allroles"><div class="innerlistitem">'+msg[i].name+'</div><div class="innerlistitem">'+msg[i].role+'</div></li>');
			}
			var li = $('<li></li>');
			li.append(list);
			$('#main').append(li);
		break;
		case 'rolelist':
			var list = $('<ul class="displaylist"></ul>');
			for (i in msg)
			{
				list.append('<li class="displaylistitem">'+msg[i]+'</li>');
			}
			var li = $('<li></li>');
			li.append(list);
			$('#main').append(li);
		break;
		default:
			alert('Bad message type!');
		break;
	}
	if (atBottom)
	{
		//Scroll down.
		var end = $("#main").prop('scrollHeight');
		$("#main").prop('scrollTop',end);
	}
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
					var name = $(this.parentNode).attr('name');
					socket.emit(Type.TOGGLE,name,'blackmail');
				},
				'Seance':function()
				{
					console.log('seance!');
				}
			};
			var notifications = {
				'Roleblocked':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'RB');
				},
				'Attacked(Healed)':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'HEAL');
				},
				'Attacked(Immune)':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'IMMUNE');
				},
				'Doused':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'DOUSE');
				},
				'Target immune':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'TARGETIMMUNE');
				},
				'Witched':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'WITCHED');
				},
				'Shot by Vet':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'SHOTVET');
				},
				'Vet shot':function()
				{
				   var name = $(this.parentNode).attr('name');
				   socket.emit(Type.PRENOT,name,'VETSHOT');
				}
			};
			var list = $('<ul id="morelist"></ul>');
			//Set name
			var li = targ.parentNode.parentNode;
			var index = $('#userlist li').index(li);
			var name = users[index];
			list.attr('name',name);
			
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
				tmp.click(notifications[i]);
				list.append(tmp);
			}
			//Append
			$(targ).append(list);
		}
	}
}
function openRolelist()
{
	if ($('#rolelist').length > 0)
	{
		$('#rolelist').remove();
	}
	else
	{
		var rolelist = $('<ul id="rolelist"></ul>');
		var roll = $('<div class="roll"></div>');
		roll.click(function()
		{
			socket.emit(Type.ROLL,current_rolelist.slice(0,users.length-1));
		});
		var showList = $('<div class="showlist">Show List</div>');
		showList.click(function()
		{
			socket.emit(Type.SHOWLIST,current_rolelist.slice(0,users.length-1));
		});
		var showRoles = $('<div class="showroles">Show Roles</div>');
		showRoles.click(function()
		{
			socket.emit(Type.SHOWALLROLES);
		});
		var setRoles = $('<div class="setroles"></div>');
		setRoles.click(function()
		{
			for (i = 1; i < users.length; i++)
			{
				var index = rolelist_names.indexOf($('.name')[i].innerHTML);
				$($('.role')[i]).val(rolelist_result[index]);
				$($('.role')[i]).css('background','green');
				$('.role')[i].old = rolelist_result[index];
			}
			socket.emit(Type.SETROLESBYLIST,rolelist_result,rolelist_names);
		});
		var controls = $('<li class="rolelistcontrols"></li>');
		
		controls.append(roll);
		controls.append(showList)
		controls.append(showRoles);
		controls.append(setRoles);
		
		rolelist.append(controls); 
		for (var i = 1; i< users.length; i++)
		{
			var top = $('<div class="top"></div>');
			top.append($('<span class="rolealignment">'+formatAlignment(current_rolelist[i-1])+'</span>'));
			var edit = $('<div class="editbutton"></div>');
			edit.click(function()
			{
				var li = this.parentNode.parentNode;
				var index = $('#rolelist li').index(li);
				var p = this.parentNode;
				var align = $($(p).children('.rolealignment')[0]);
				var val = current_rolelist[index-1];
				
				var editing = $('<input class="rolealignmentedit" type="text" value="'+val+'"></input>');
				align.html(editing);
				
				editing.keydown(function(e)
				{
					if (e.keyCode == 13) //Enter
					{
						var li = this.parentNode.parentNode.parentNode;
						var index = $('#rolelist li').index(li);
						current_rolelist[index-1] = this.value;
						var newrole = formatAlignment(this.value);
						$(this.parentNode).html(newrole);
					}
				});
			});
			top.append(edit);
			var bot = $('<div class="bottom"><span class="person"></span><span class="myrole"></span></div>');
			var li = $('<li></li>');
			li.append(top);
			li.append(bot);
			rolelist.append(li);
		}
		$('body').append(rolelist);
	}
}
function openUserWill(e)
{
	var li = e.parentNode.parentNode;
	var index = $('#userlist').children().index(li);
	socket.emit(Type.GETWILL,index);
}
function formatAlignment(str)
{                       
	//colors
	var towncolor="#19FF19";
	var mafiacolor="red";
	var randcolor="#42C0FB";
	var neutcolor='lightgrey';
	var hilitecolor="orange";
	str=str.replace(/[Tt]own/,"<span style='color:"+towncolor+"'>Town</span>");
	str=str.replace(/[Ii]nvestigative/,"<span style='color:"+randcolor+"'>Investigative</span>");
	str=str.replace(/[Ss]upport/,"<span style='color:"+randcolor+"'>Support</span>");
	str=str.replace(/[Pp]rotective/,"<span style='color:"+randcolor+"'>Protective</span>");
	str=str.replace(/[Pp]ower/,"<span style='color:"+randcolor+"'>Power</span>");
	str=str.replace(/[Rr]andom/,"<span style='color:"+randcolor+"'>Random</span>");
	str=str.replace(/[Kk]illing/,"<span style='color:"+randcolor+"'>Killing</span>");
	str=str.replace(/[Mm]afia/,"<span style='color:"+mafiacolor+"'>Mafia</span>");
	str=str.replace(/[Dd]eception/,"<span style='color:"+randcolor+"'>Deception</span>");
	str=str.replace(/[Ee]vil/,"<span style='color:"+randcolor+"'>Evil</span>");
	str=str.replace(/[Bb]enign/,"<span style='color:"+randcolor+"'>Benign</span>");
	str=str.replace(/[Nn]eutral/,"<span style='color:"+neutcolor+"'>Neutral</span>");
	str=str.replace(/[Aa]ny/,"<span style='color:white'>Any</span>");
	return str;      
}
