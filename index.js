// https://www.facebook.com/Librer%C3%ADa-Bot-281015612274685/
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

const APP_TOKEN = 'EAALCyAFgXNUBANk8uPlfmIyreqrtLKKyWQ5zEWg4DXpEP7aqjgOZCeejigvov1oZBITTDJ7iA3UU4zyN7YyYfvZCfSL0mgdqxuubHiA2fzFyceYyis2fJHmXvtE5N1NzP1sumj5kjjZCXZCh0vsC45kDS6cRVTjJBzzrnqh9S2QZDZD';

var app = express();
app.use(bodyParser.json());

// Start server with Node
app.listen(3001, function(){
  console.log('Servidor en puerto 3001')
});

app.get('/', function(req, res){
  res.send('Bienvenido al taller');
});

// route for Webhook previously configured in facebook
app.get('/webhook', function(req, res){
  if(req.query['hub.verify_token'] === 'test_token_say_hello'){
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Permiso denegado.');
  }
});

// Message structure
//{ object: 'page',
//  entry:
//   [ { id: '281015612274685',
//       time: 1470515944686,
//       messaging: [Object] } ] }

app.post('/webhook', function(req, res){
  var data = req.body;
  if(data.object == 'page'){
    data.entry.forEach(function(pageEntry){
      pageEntry.messaging.forEach(function(messagingEvent){
        if(messagingEvent.message) {
          receiveMessage(messagingEvent);
        }
      });
    });
    // Send a notification to facebook indicating successfully received message(200)
    res.sendStatus(200);
  }
});


// Function to get message
function receiveMessage(event){
  var senderID = event.sender.id;
  var messageText = event.message.text;

  evaluateMessage(senderID, messageText);
}

function evaluateMessage(recipientId, message){
  var finalMessage = '';
  if(isContain(message, 'ayuda')){
    finalMessage = 'Por el momento no te puedo ayudar';
  } else if(isContain(message, 'gato')) {
    sendMessageImage(recipientId, finalMessage)
  } else if(isContain(message, 'clima')) {
    getWeather(function(temperature){
      message = getMessageWeather(temperature);
      sendMessageText(recipientId, message);
    })
  } else if(isContain(message, 'info')) {
    sendMessageTemplate(recipientId);
  } else {
    finalMessage = 'solo se repetir las cosas : ' + message;
  }
  sendMessageText(recipientId, finalMessage);
}

function sendMessageText(recipientId, message){
  //TODO: API imgur
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: message
    }
  }
  callSendAPI(messageData);
}

function sendMessageImage(recipientId, message){
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: "http://i.imgur.com/SOFXhd6.jpg"
        }
      }
    }
  }
  callSendAPI(messageData);
}

function sendMessageTemplate(recipientId){
  //TODO: API imgur
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [ elementTemplate() ]
        }
      }
    }
  }
  callSendAPI(messageData);
}

function elementTemplate(){
  return {
    title: 'Andres Vizcaino',
    subtitle: 'Taller Código facilito',
    item_url: 'https://www.facebook.com/codigofacilito/?fref=ts',
    image_url: 'http://i.imgur.com/SOFXhd6.jpg',
    buttons: [ buttonTemplate() ]
  }
}

function buttonTemplate(){
  return {
    type: 'web_url',
    url: 'https://www.facebook.com/codigofacilito/?fref=ts',
    title: 'CF'
  }
}

// It creates an object that facebook undestand
function callSendAPI(messageData){
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: APP_TOKEN },
    method: 'POST',
    json: messageData
  }, function(error, response, data){
    if(error){
      console.log('No es posible enviar el mensaje.');
    } else {
      console.log('Mensaje enviado.')
    }
  })
}

function getMessageWeather(temperature){
  if(temperature > 30){
    return "Nos encontramos a " + temperature + " hay demasiado calor";
  } else {
    return "Nos encontramos a " + temperature + " es un bonito dia para salir";
  }
}

function getWeather(callback){
  request('http://api.geonames.org/findNearByWeatherJSON?lat=16.750000&lng=-93.1166&username=andru1989',
    function(error, response, data){
      if(!error){
        var response = JSON.parse(data);
        var temperature = response.weatherObservation.temperature;
        callback(temperature);
      }
    });
}

function isContain(sentence, word){
  return sentence.indexOf(word) > -1;
}