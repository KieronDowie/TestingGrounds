$(document).ready(function()
{
	$('#submit').click(function()
	{					
		$.ajax({
			url:'/MCP/setPass', 
			data:$('#password').val(),
			success:function(result)
			{
				console.log('updated pass woo');
			},
			error:function(e)
			{
				console.log(e);
				console.log('ERROR! Unable to make AJAX request.');
			}
		});
	});
});
