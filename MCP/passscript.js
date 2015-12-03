$(document).ready(function()
{
	$('#date').glDatePicker();
	$('#datesubmit').click(function()
	{
		var send = $('#date').val()+'-'+$('#time').val();
		console.log(send);
		$.ajax({
			url:'/MCP/setDate', 
			data:send,
			success:function(result)
			{
				if (result=='success')
				{
					alert('Date changed succesfully!');
				}
				else
				{
					alert(result);
				}
			},
			error:function(e)
			{
				console.log(e);
				console.log('ERROR! Unable to make AJAX request.');
			}
		});
	});
	$('#submit').click(function()
	{					
		$.ajax({
			url:'/MCP/setPass', 
			data:$('#password').val(),
			success:function(result)
			{
				alert('Password changed.');
			},
			error:function(e)
			{
				console.log(e);
				console.log('ERROR! Unable to make AJAX request.');
			}
		});
	});
});
