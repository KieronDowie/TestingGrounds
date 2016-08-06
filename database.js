var pg = require('pg');

var client;

module.exports = {
	connect:function(){
		var connectString = process.env.DATABASE_URL || "postgres://aubtmwsueljmlo:NgGgFPZeIadarZo81gp-1EKN93@ec2-23-23-199-181.compute-1.amazonaws.com:5432/d80g2kksssndck?ssl=true";
		try
		{
			client = new pg.Client(connectString);
			client.connect();	
		}
		catch(e)
		{
			console.log("Could not connect.");
			console.log(e);
		}
	},
	query: function(query, params, callback){
		console.log(query);
		
		if (client)
		{
			try
			{
				client.query(query,params, callback);
			}
			catch (e)
			{
				console.log("Could not connect.");
				console.log(e);
			}
		}
		else
		{
			console.log("Cannot query before connecting.");
		}
	}
};
