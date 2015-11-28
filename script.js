var time = 0;
var units = ['day','hour','min','sec'];

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
