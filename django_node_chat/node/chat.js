var http = require('http');
var server = http.createServer().listen(4000);
var cookie_reader = require('cookie');
var querystring = require('querystring');
var io = require('socket.io').listen(
		server,
		{
			'authorization': function(data, accept){
        			if(data.headers.cookie){
            				data.cookie = cookie_reader.parse(data.headers.cookie);
            				return accept(null, true);
        			}
        			return accept('error', false);
			},

    			'log level': 1

		});
var redis = require('redis');
var sub = redis.createClient();

//Subscribe to the Redis chat channel
sub.subscribe('chat');

io.sockets.on('connection', function (socket) {
    
    //Grab message from Redis and send to client
    sub.on('message', function(channel, message){
        socket.send(message);
    });
    
    //Client is sending message through socket.io
    socket.on('send_message', function (message) {
	var cookie = socket.handshake.headers.cookie.split(" ");
	var sessionidtemp = cookie[2].split("=");
        values = querystring.stringify({
            comment: message,
            sessionid: sessionidtemp[1],
        });
       
        var options = {
            host: 'localhost',
            port: 3000,
            path: '/node_api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': values.length
            }
        };
        
        //Send message to Django server
        var req = http.request(options, function(res){
            res.setEncoding('utf8');
            
            //Print out error message
            res.on('data', function(message){
                if(message != 'Everything worked :)'){
                    console.log('Message: ' + message);
                }
            });
        });
        
        req.write(values);
        req.end();
    });
});