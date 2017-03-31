/*
Thien An Bot recipe to turn on/off a lamp using Watson text to speech and Watson
speech to text service
Duy Nguyen (dnguyenv@us.ibm.com)
*/
var rpio = require('rpio'),
    watson = require('watson-developer-cloud'),
    config = require('./config'),
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
    console.log(' ===== Text recognized ===== : ' + str);
    parseText(str);
});

textStream.on('error', function(err) {
  console.log(' === Watson Speech to Text : An Error has occurred =====') ; // handle errors
  console.log(err) ;
  console.log("Press <ctrl>+C to exit.") ;
});

/*Parse the recognized text to determine next step */

function parseText(text){
    var containsTurn = (text.indexOf("turn") >= 0),
      containsChange = text.indexOf("change") >= 0,
      containsSet = text.indexOf("set") >= 0,
      containsLight = (text.indexOf("light") >= 0);
    if ((containsTurn || containsChange || containsSet ) && containsLight) {
        parseCommand(text);
    }
}

/* Mapping command to rpio value */

var commandList = {
    "off": rpio.LOW,
    "on": rpio.HIGH
}

/*Initialize the pins*/
function initPins(){
  rpio.open(config.Pins.LIGHT_PIN,rpio.OUTPUT,rpio.LOW);
}

/* flip the LIGHT_PIN to gpioVal */
var switchLight = function(gpioVal){
  rpio.write(config.Pins.LIGHT_PIN,gpioVal);
}
// reset the pin before exist
process.on('SIGINT', function () {
    initPins();
    process.nextTick(function () { process.exit(0); });
});

/*Further parsing the text to determine appropirate command*/

function parseCommand(text){
  var words = text.split(" ");
   for(var i=0; i < words.length; i++){
     if (words[i] in commandList){
        processCommand(words[i]);
        break;
     }
   }
}

/* Speak the sentence accordingly to the command, and switch the light*/

var processCommand = function(command){

  speak(config.Speak[command]);

  setTimeout(function(){
    switchLight(commandList[command])
  },5000);

}

/* Stream the resuting audio data to file and play back*/

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
