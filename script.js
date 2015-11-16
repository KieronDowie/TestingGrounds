$(document).ready(function()
{
	$('#entername').keyup(function()
	{
		checkName($('#entername').val());
	});
});
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
