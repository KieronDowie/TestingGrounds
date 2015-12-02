//Mysql database
var pg = require('pg');
var mysql = require('mysql');

var connection;

module.exports = {
	connect:function(){
		var connectString = process.env.DATABASE_URL || 'localhost';
		var client = new pg.Client(connectString);
		client.connect();	
	},
	query: function(query, callback){
		connection.query(query,callback);
	}
};
