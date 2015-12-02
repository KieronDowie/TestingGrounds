//Mysql database
var pg = require('pg');
var mysql = require('mysql');

var client;

module.exports = {
	connect:function(){
		var connectString = process.env.DATABASE_URL || 'localhost';
		client = new pg.Client(connectString);
		client.connect();	
	},
	query: function(query, callback){
		if (client)
		{
			client.query(query,callback);
		}
	}
};
