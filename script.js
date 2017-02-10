var time = 0;
var units = ['day', 'hour', 'min', 'sec'];

var Type = {
    PING: 0,
    PONG: 1,
    MSG: 2,
    ROOMLIST: 3,
    TOGGLE: 4,
    JOINROOM: 5,
    JOIN: 6,
    LEAVE: 7,
    SYSTEM: 9,
    SETROLE: 10,
    HIGHLIGHT: 11,
    SETPHASE: 12,
    WHISPER: 13,
    MOD: 14,
    TOGGLELIVING: 15,
    PRENOT: 16,
    VOTE: 17,
    CLEARVOTES: 18,
    VERDICT: 19,
    TICK: 20,
    JUDGEMENT: 21,
    SETDEV: 22,
    WILL: 23,
    SETMOD: 24,
    SWITCH: 25,
    ACCEPT: 26,
    ROLEUPDATE: 27,
    DENY: 28,
    KICK: 29,
    ROLECARD: 30,
    ROLL: 31,
    SETROLESBYLIST: 32,
    MASSROLEUPDATE: 33,
    SHOWLIST: 34,
    SHOWALLROLES: 35,
    LATENCIES: 36,
    GETWILL: 37,
    HEY: 38,
    TARGET: 39,
    HUG: 40,
    ME: 41,
    ROLELIST: 42,
    AUTOLEVEL: 43,
    SUGGESTIONS: 44,
    SYSSENT: 45,
    CUSTOMROLES: 46,
    HELP: 47,
    PAUSEPHASE: 48,
    SETDAYNUMBER: 49,
    SETSPEC: 50,
    REMSPEC: 51,
    LOGINDEX: 52
};

$(document).ready(function()
{
	$('#entername').keyup(function()
	{
		checkName($('#entername').val());
	});
	reqTime();
	$(".tgsig input").focus(function() { $(this).select(); } );
	$(".tgsig input").mouseup(function() { return false; } );
});

var socket = io.connect({ 'pingInterval': 45000 });

function reqTime()
{
	$.ajax({url:'/time', success:function(result)
	{
		if (result == 'now')
		{
			$('#clock').html('<span class="nowtesting">NOW TESTING</span>');
		}
		else
		{
			time = parseInt(result);
			tick();
		}
	}, error:function()
	{
		console.log('ERROR! Unable to make AJAX request.');
	}});
}
function checkName(name)
{
	$.ajax({url:'/namecheck', data:name,success:function(result)
		{
			if (result=='taken')
			{
				$('#error').html('That name is taken. Please choose a different name.');
				$('#error').css('display','block');
				$('#send').attr('disabled','disabled');
			}
			else if (result=='invalid')
			{
				$('#error').html('Names may only contain letters, numbers, underscores and dashes.');
				$('#error').css('display','block');
				$('#send').attr('disabled','disabled');
			}
			else if (result=='empty')
			{
				$('#error').html('Your name cannot be empty.');
				$('#error').css('display','block');
				$('#send').attr('disabled','disabled');
			}
			else if (result=='noletters')
			{
				$('#error').html('Your name must contain at least one letter.');
				$('#error').css('display','block');
				$('#send').attr('disabled','disabled');
			}
			else if (result=='toolong')
			{
				$('#error').html('Your name cannot be more than 20 characters.');
				$('#error').css('display','block');
				$('#send').attr('disabled','disabled');
			}
			else if (result=='lol')
			{
				$('#error').html('Very clever. Truly we are but peons in the shadow of your vast intellect.');
				$('#error').css('display','block');
			}
			else
			{
				$('#error').html('');
				$('#error').css('display','none');
				$('#send').removeAttr('disabled');
			}
		}, error:function()
		{
			console.log('ERROR! Unable to make AJAX request.');
		}});
}
function tick()
{
	time--;
	if (time != 0)
	{
		var current = getTime(time);
		var clock = $('#clock');
		for (i in current)
		{
			clock.children()[i].innerHTML = formatTime(current[i])+'<span class="unit">'+units[i]+'</span>';
		}
		setTimeout(tick,1000);
	}
	else
	{
		$('#clock').html('<span class="nowtesting">NOW TESTING</span>');
	}
}
function getTime(time)
{
	var seconds = time % 60;
	time-=seconds;
	time = time / 60; //minutes
	var minutes = time % 60;
	time-=minutes;
	time = time /60; //hours
	var hours = time % 24;
	time-=hours;
	time = time / 24; //days
	var days = time;
	return [days,hours,minutes,seconds];
}
function formatTime(num)
{
	if ((num+'').length == 1)
	{
		num = '0'+num;
	}
	return num;
}
function loginindex() {
    var username_element = document.getElementById('username');
    var password_element = document.getElementById('password');

    var username = username_element.value.trim();
    var password = password_element.value.trim();

    socket.emit(Type.LOGINDEX, username, password);
}
socket.on('disconnect', function () {
    if (!kicked) {
        if (connectAttempt < 10) {
            if ($('.blocker').length == 0) {
                var blocker = $('<div class="blocker"></div>');
                var kitteh = $('<img src="http://media.giphy.com/media/zwmeWxShpVVyU/giphy.gif">');
                kitteh.on('error', function () {
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
            if (connectAttempt == 0) {
                socket.connect();
                connectAttempt++;
                $('#count').html(connectAttempt + '/10');
            }
            else if (connectAttempt < 10) {
                setTimeout(function () {
                    socket.connect();
                    connectAttempt++;
                    $('#count').html(connectAttempt + '/10');
                }, 1000);
            }
        }
        else {
            $('#try').html('<p>Our dancing kitty has failed to reconnect you. No milk for him tonight. Please rejoin.</p>');
        }
    }
});