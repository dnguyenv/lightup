// Please replace the username and password with your bluemix credentials
exports.SpeechToText = {
  "password": "xxxxx",
  "username": "xxxxx",
  "version":  "v1"
}
// You can change the voice of the robot to your favorite voice.
// Some of the available options are:
// en-US_AllisonVoice
// en-US_LisaVoice
// en-US_MichaelVoice (the default)
//Credentials for Watson Text to Speech service
exports.TextToSpeech = {
  "voice": "en-US_LisaVoice",
  "password": "xxxxx",
  "username": "xxxxx",
  "version":  "v1"
}

exports.Pins = {
  "LIGHT_PIN": 16
}

exports.Speak = {
  "on":"OK daddy, I'm turning the light on",
  "off":"OK daddy, I'm turning the light off",
  "greet": "Good morning. What do you want to do daddy?"
}
