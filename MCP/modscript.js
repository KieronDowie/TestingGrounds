$(document).ready(function()
{
	$('li>a').click(function(e)
	{
		var action = e.target.innerHTML;
		window.location = '/MCP/'+action;
	});
});
