var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/pages/world.html');
});

io.on('connection', function(socket){
  console.log('client connected');

  // send the clients id to the client itself.
  socket.send(socket.id);
  var socketId = socket.id;
  socket.on('movement', function(msg){
	try {
		var playerPosition = JSON.parse(msg)
		playerPosition.playerId = socketId;
		io.emit('movement', JSON.stringify(playerPosition));
	} catch(err) {
		console.log(err)
	}
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
