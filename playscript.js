window.onbeforeunload = function(){
  return 'If you are in a game and need to leave, please inform the mod before closing this page.';
};
mod = false;
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
var autorolelists = {
	3:["Citizen","Citizen","Godfather"],
	8: ["Town Investigative", "Town Protective", "Random Town","Random Town","Random Town", "Godfather","Random Mafia","Neutral Benign"],
	9: ["Town Investigative", "Town Protective", "Town Support","Random Town","Random Town","Random Town", "Godfather","Random Mafia","Neutral Benign"],
	10: ["Town Investigative", "Town Protective", "Town Support","Random Town","Random Town","Random Town", "Godfather","Random Mafia","Neutral Evil","Neutral Benign"],
}
//Globals
var customRolesRollable = true;
var rolelist_names = [];
var rolelist_result = [];
$(document).ready(function(){	
	$('header ul li').on('click',function(e)
	{
		if ($(e.target).is('li') || $(e.target).is('span'))
		{
			var phase = $('header ul li').index(this);
			socket.emit(Type.SETPHASE,phase);
		}
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

function mutemusic(phase)
{
	if (musicon == 0)
	{
		musicon = 1;
		if (currentphase == 0)
		{
			mpregame.currentTime = 0;
			mpregame.volume = 1;
		}
		if (currentphase == 1)
		{
			whoami.volume = 1;
		}
		if (currentphase == 2)
		{
			mmodtime.currentTime = 0;
			mmodtime.volume = 1;
		}
	}
	else
	{
		mpregame.volume = 0;
		whoami.volume = 0;
		mmodtime.volume = 0;
		musicon = 0;
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
function showPanel(panel)
{
	panel.toggle();
	if (panel.hasClass('grow'))
	{
		panel.removeClass('grow');
		panel.addClass('shrink');
	}
	else if (panel.hasClass('shrink'))
	{
		panel.removeClass('shrink');
		panel.addClass('grow');
	}
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
		case 'help':
			var li = $('<li></li>');
			li.append(msg);
			$('#main').append(li);
		break;
		case 'me':
			$('#main').append('<li class="me">*<em>'+msg+'</em>*</li>');
		break;
		case 'rolecard':
			$('#main').append('<li class="rolecardcontainer">'+msg+'</li>');
		break;
		case 'hug':
			$('#main').append('<li>*<b>'+msg.name+' hugs '+msg.target+'</b>*</li>');
		break;
		case 'system':
			$('#main').append('<li><b>'+msg+'</b></li>');
		break;
		case 'automod':
			$('#main').append('<li>'+msg+'</li>');
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
			if (msg.target != '')
			{
				if (msg.role)
				{
					msg.role = '('+msg.role+') is';
				}
				else
				{
					msg.role = ' are';
				}
				var str = msg.name+msg.role+' now targeting <b>'+msg.target+'</b>.';
			}
			else
			{
				if (msg.role)
				{
					var str = msg.name+'('+msg.role+') cancels their targetting.';
				}
				else
				{
					var str = 'You cancel your targetting.';
				}
			}
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
	if ($(targ).hasClass('more') || $(targ).hasClass('downarrow'))
	{
		if ($(targ).hasClass('downarrow'))
		{
			targ = $(targ).parent()[0];
		}
		var alreadyOpen = $('#morelist').length > 0;
		$('#morelist').remove();
		if (!alreadyOpen)
		{
			var actions = {
				'Blackmail':function()
				{
					var name = $(this.parentNode).attr('name');
					socket.emit(Type.TOGGLE,name,'blackmail');
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
			list.css('top',$(targ).height());
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
function autoModSettings()
{
	//Remove the role list, if it exists
	if ($('#rolelist').length > 0)
	{
		$('#rolelist').remove();
	}
	if ($('#automodsettings').length > 0)
	{
		$('#automodsettings').remove();
	}
	else
	{
		var ams = $('<ul id="automodsettings"></ul>');
		var levels = {
			'Manual': 'Turn automod off.',
			'Targetting': 'Automod will listen for night actions sent in using /target and present you with a table at the end of the night.',
			'Targetting + Suggestions':'AutoMod will listen for night actions sent in using /target and present you with a table at the end of the night, as well as suggested actions.'
		};
		for (i in levels)
		{
			var li = $('<li><div><h3>'+i+'</h3><p>'+levels[i]+'</p></div></li>');
			li.click(function(){
				var index = $(this).parent().children().index($(this));
				socket.emit(Type.AUTOLEVEL,index);
				$('#automodsettings').remove();	
			});
			ams.append(li);
		}
		$('body').append(ams);
	}
}
function openRolelist()
{
	//Remove the automod settings, if they exist, prevents layering
	if ($('#automodsettings').length > 0)
	{
		$('#automodsettings').remove();
	}
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
			var custom = $('#customRolesChk').is(':checked');
			socket.emit(Type.ROLL,current_rolelist.slice(0,users.length-1), custom);
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
		var extraControls = $('<div class="extracontrols"></div>');
		var optionsPanel = $('<div class="options"></div>');
		var customRoles = $('<div class="customroles"></div>');
		var p = $('<p>Custom roles: </p>');
		var chk = $('<input id="customRolesChk" type="checkbox" />');
		var autoButton = $('<div id="autoRolesButton"><p>Autolist</p></div>');
		autoButton.click(function(){
			autoList();
		});
		chk.prop('checked', customRolesRollable)
		customRoles.append(p);
		customRoles.append(chk);
		extraControls.append(optionsPanel);
		optionsPanel.append(customRoles);
		extraControls.append(autoButton);
		rolelist.append(extraControls);
		$('body').append(rolelist);
	}
}
function openUserWill(e)
{
	var li = e;
	while ( ! $(li).is('li'))
	{
		li = $(li).parent();
	}
	var index = $('#userlist').children().index(li);
	socket.emit(Type.GETWILL,index);
}
function autoList()
{
	var num = users.length-1;
	if (autorolelists[num])
	{
		current_rolelist = autorolelists[num];
		var list = $(".rolealignment");
		for (i=0; i < list.length ; i++)
		{
			$($(".rolealignment")[i]).html( autorolelists[num][i] );
		}
	}
	else
	{
		alert('There is no preset rolelist for this number of players.');
	}
}
function grabDivider()
{
	grabbed = true;
	$('body').mousemove(function(e)
	{
		if (grabbed)
		{
			resizeDivider(e);
		}
	});
	$('body').mouseup(function(){
		releaseDivider();
	});
}
function releaseDivider()
{
	grabbed = false;
}
function resizeDivider(e)
{
	$('#main').css('width',e.pageX);
	$('#adjustabledivider').css('left',e.pageX);
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
	str=str.replace(/[Cc]asual/,"<span style='color:"+randcolor+"'>Casual</span>");
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
function createTable(cls)
{
	var table = {
		object: $('<table class="'+cls+'"></table>'),
		body: $('<tbody></tbody>'),
		addRow:function(data, automated, classes){
			var tr;
			if (automated === true)
			{
				if (classes)
				{
					var classstr = classes.join(' ');
					tr = $('<tr class="'+classstr+'"></tr>');
				}
				else
				{
					tr = $('<tr></tr>');
				}
			}
			else
			{
				if (classes)
				{
					var classstr = classes.join(' ');
					tr = $('<tr class="unauto '+classstr+'"></tr>');
				}
				else
				{
					tr = $('<tr class="unauto"></tr>');
				}
				//Hover handlers
				tr.mouseenter(function(e){
					var tooltip = $('<div class="tooltip"></div>');
					var p = "<p>Could not automate.</p><p><b>Reason</b>: "+automated.reason+"</p>"
					tooltip.append(p);
					$('body').append(tooltip);
					tooltip.css('top',e.pageY);
					tooltip.css('left',e.pageX);
				}).mouseleave(function(){
					$('.tooltip').remove();
				}).mousemove(function(e){
					var tooltip = $('.tooltip');
					tooltip.css('top',e.pageY);
					tooltip.css('left',e.pageX);
				});
			}
			for (var i in data)
			{
				var td = $('<td></td>');
				td.append(data[i]);
				tr.append(td);
			}
			this.body.append(tr);
		}
	};
	table.object.append(table.body);
	return table;
}
function chooseAutoButton(info, label)
{
	var func;
	switch (info[0])
	{
		/*Messages*/
		case '<All>':
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[1]).children()[0]).html();
				socket.emit(Type.MSG,to);
			};
		break;
		/*Actions*/
		case '<Kill>': case'<Revive>':
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[1]).children()[0]).html();
				socket.emit(Type.TOGGLELIVING,to);
				//Stupid button swapping stuff that I have no idea why I thought was a good idea at the time.
				var index = users.indexOf(to);
				var buttons = $('.killbutton, .revivebutton');
				if ($(buttons[index]).hasClass('killbutton'))
				{
					$(buttons[index]).removeClass('killbutton');
					$(buttons[index]).addClass('revivebutton');
					$(buttons[index]).html('<span>Revive</span>');
				}
				else
				{
					$(buttons[index]).removeClass('revivebutton');
					$(buttons[index]).addClass('killbutton');
					$(buttons[index]).html('<span>Kill</span>');
				}
			};
		break;
		case '<Set Role>':
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[1]).children()[0]).html();
				var arr = to.split('/');
				socket.emit(Type.SETROLE,arr[0],arr[1]);
				//Change the input box
				var index = users.indexOf(arr[0]);
				var input = $('.role');
				$(input[index]).val(arr[1]);
			}
		break;
		case '<Disguise>':
			func = function(){
				var arr = info[1].split('/');
				socket.emit(Type.MSG,'/disguise '+ arr[0] +' '+ arr[1]);
				//Swap all messages in the table.
				var container = $('.automodcontainer');
				container = container[container.length-1];
				//Loop for all names
				var names = $(container).find('.playername');
				for ( i in names)
				{
					if ($(names[i]).html() == arr[0])
					{
						$(names[i]).html(arr[1]);
					}
					else if ($(names[i]).html() == arr[1])
					{
						$(names[i]).html(arr[0]);
					}
				}
			}
		break;
		case '<Blackmail>':
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[1]).children()[0]).html();
				socket.emit(Type.TOGGLE,to,'blackmail');
			};
		break;
		case '<Jail>':
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[1]).children()[0]).html();
				socket.emit(Type.TOGGLE,to,'jailed');
				var index = users.indexOf(to);
				var buttons = $('.jailbutton, .releasebutton');
				if ($(buttons[index]).hasClass('jailbutton'))
				{
					$(buttons[index]).removeClass('jailbutton');
					$(buttons[index]).addClass('releasebutton');
					$(buttons[index]).html('<span>Release</span>');
				}
				else
				{
					$(buttons[index]).removeClass('releasebutton');
					$(buttons[index]).addClass('jailbutton');
					$(buttons[index]).html('<span>Jail</span>');
				}
			};
		break;
		case '<Clean>':
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[1]).children()[0]).html();
				socket.emit(Type.MSG,'/clean '+to);
			};
		break;
		/*Default is to treat it as a name*/
		default:
			func = function(){
				var tr = $(this).parent().parent();
				var to = $($(tr.children()[0]).children()[0]).html();
				var msg = $($(tr.children()[1]).html()).html();
				socket.emit(Type.MSG,'/sys '+to+' '+msg);
			};
		break;
	}
	var button = $('<div class="automodbutton">'+label+'</div>');
	button.click(func);
	return button;
}
function addModControls()
{
	//Add numbering interface
	var spn = $('<input type="number" min="1" max="99" value="'+daynumber+'"/>');
	spn.change(function(){
		socket.emit(Type.SETDAYNUMBER,$(this).val());
	});
	var lbl = $('<span>Day/Night:</span>');
	$('#modnumbering').empty();
	$('#modnumbering').append(lbl);
	$('#modnumbering').append(spn);
}
function addPauseButton(phase)
{
	if (paused)
	{
		var pause = $('<div class="playbutton"></div>');
	}
	else
	{
		var pause = $('<div class="pausebutton"></div>');
	}	
	pause.click(function(){
		socket.emit(Type.PAUSEPHASE);
		if ($(this).hasClass('playbutton'))
		{
			$(this).removeClass('playbutton');
			$(this).addClass('pausebutton');
		}
		else if ($(this).hasClass('pausebutton')){
			$(this).removeClass('pausebutton');
			$(this).addClass('playbutton');
		}
	});
	$($('header ul li')[phase]).append(pause);
}
