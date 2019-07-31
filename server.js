const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to Mongo
mongo.connect('mongodb://127.0.0.1/mongochat', (err, db) => {
  if (err) {
    throw err;
  }

  console.log('MongoDB connected...');
  //   Connect to socket.io
  client.on('connection', socket => {
    let chat = db.collection('chat');

    // Send status from client to server
    sendStatus = status => {
      socket.emit('status', status);
    };

    // Get chats from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id })
      .toArray((err, res) => {
        if (err) {
          throw err;
        }
        //   Emit messages
        socket.emit('output', res);
      });
    //   Handle input  events
    socket.on('input', data => {
      let name = data.name;
      let message = data.message;

      // Check for name and message
      if (name == '' || message == '') {
        // Send error status
        sendStatus('Please enter a name and message');
      } else {
        // Insert message into database
        chat.insert({ name: name, message: message }, () => {
          client.emit('output', [data]);

          // Send status object
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });
    //   Handle clear
    socket.on('clear', data => {
      // Remove all chats from mongo collection
      chat.remove({}, () => {});
      // Emit cleared
      socket.emit('cleared');
    });
  });
});
