
var rpio = require('rpio'),
    watson = require('watson-developer-cloud'),
    config = require('./config'),  // gets our username and passwords from the config.js files
    exec = require('child_process').execSync,
    fs = require('fs'),
    text_to_speech = watson.text_to_speech(config.TextToSpeech),
    speech_to_text = watson.speech_to_text(config.SpeechToText);

// Initiate Microphone Instance to Get audio samples
var mic = require('mic');
var micInstance = mic({ 'rate': '44100', 'channels': '2', 'debug': false, 'exitOnSilence': 6 });
var micInputStream = micInstance.getAudioStream();

micInputStream.on('data', function(data) {
    //console.log("Recieved Input Stream: " + data.length);
});

micInputStream.on('error', function(err) {
    console.log("Error in Input Stream: " + err);
});

micInputStream.on('silence', function() {
    // detect silence.
});
micInstance.start();

initPins();

speak(config.Speak.greet);

console.log("TJBot is listening, you may speak now.");

var recognizeparams = {
  content_type: 'audio/l16; rate=44100; channels=2',
  model: 'en-US_BroadbandModel'  // Specify your language model here
};
var textStream = micInputStream.pipe(
    speech_to_text.createRecognizeStream(recognizeparams)
);

textStream.setEncoding('utf8');
textStream.on('data', function(str) {
    console.log(' ===== Speech to Text ===== : ' + str); // print each text we receive
    parseText(str);
});

textStream.on('error', function(err) {
  console.log(' === Watson Speech to Text : An Error has occurred =====') ; // handle errors
  console.log(err) ;
  console.log("Press <ctrl>+C to exit.") ;
});

function parseText(str){
    var containsTurn = (str.indexOf("turn") >= 0),
      containsChange = str.indexOf("change") >= 0,
      containsSet = str.indexOf("set") >= 0,
      containsLight = (str.indexOf("light") >= 0);
    if ((containsTurn || containsChange || containsSet ) && containsLight) {
        parseCommand(str);
    }
}

var commandList = {
    "off": rpio.LOW,
    "on": rpio.HIGH
}

/*Initialize the pins*/
function initPins(){
  rpio.open(config.Pins.LIGHT_PIN,rpio.OUTPUT,rpio.LOW);
}

var switchLight = function(gpioVal){
  //console.log('switchLight: ', gpioVal);
  rpio.write(config.Pins.LIGHT_PIN,gpioVal);
}
// reset the pins before exist
process.on('SIGINT', function () {
    initPins();
    process.nextTick(function () { process.exit(0); });
});

function parseCommand(msg){
  var words = msg.split(" ");
   for(var i=0; i < words.length; i++){
     if (words[i] in commandList){
        processCommand(words[i]);
        break;
     }
   }
}

var processCommand = function(command){
  speak(config.Speak[command]);
  setTimeout(function(){
    switchLight(commandList[command])
  },5000)
}

function speak(text){
    //micInstance.stop();
    var params = {
        text: text,
        voice: config.TextToSpeech.voice,
        accept: 'audio/wav'
    };
    /* Streaming the resulting audio to file and play the file using aplay */

    text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav')).on('close', function() {
        var create_audio = exec('aplay output.wav', function(error, stdout, stderr) {
            if (error !== null) {
                console.log('Error occurred while playing back: ' + error);
            }
        });
    });
}
