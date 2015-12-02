//Mysql database
var pg = require('pg');
var mysql = require('mysql');

var connection;

module.exports = {
	connect:function(){
		
		/*var connectString = process.env.DATABASE_URL || 'localhost';
		var client = new pg.Client(connectString);
		client.connect();*/
		var db_config = {
			host: 'ec2-23-23-199-181.compute-1.amazonaws.com',
			user: 'aubtmwsueljmlo',
			port: 5432,
			password: 'NgGgFPZeIadarZo81gp-1EKN93',
			database: 'd80g2kksssndck'
		};
		console.log('Connecting to MySQL database...');
		connection = mysql.createConnection(db_config);
		connection.connect(function(err){
			if (err) 
			{
				throw err;
			}
			else
			{
				console.log('Connected!');
			}
		});
	},
	query: function(query, callback){
		connection.query(query,callback);
	}
};
