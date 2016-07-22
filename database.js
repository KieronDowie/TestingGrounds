var pg = require('pg');

var client;

module.exports = {
	connect:function(){
		var connectString = process.env.DATABASE_URL || "postgres://aubtmwsueljmlo:NgGgFPZeIadarZo81gp-1EKN93@ec2-23-23-199-181.compute-1.amazonaws.com:5432/d80g2kksssndck?ssl=true";
		client = new pg.Client(connectString);
		client.connect();	
	},
	query: function(query, params, callback){
		if (client)
		{
			client.query(query,params, callback);
		}
	}
};
