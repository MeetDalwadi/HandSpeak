// Speech Recognition
function record() {
    var recognition = new webkitSpeechRecognition();
    recognition.lang = "en-GB";

    recognition.onresult = function(event) {
        document.getElementById('speechToText').value = event.results[0][0].transcript;
    }
    recognition.start();
}

// Video player functionality
var words = JSON.parse(document.querySelector('[data-words-list]').dataset.wordsList || '[]');
var i = 0;
var videoPlayer = document.getElementById("videoPlayer");

function play() {
    if (i < words.length) {
        var file = words[i] + ".mp4";
        console.log("Playing video:", file);
        videoPlayer.src = `/static/assets/${file}`;
        videoPlayer.play();
        i++;
        videoPlayer.addEventListener('ended', play);
    } else {
        console.log("Finished playing all videos");
        i = 0;
        videoPlayer.removeEventListener('ended', play);
    }
}

function playPause() {
    if (videoPlayer.paused) {
        if (i === 0) {
            console.log("Starting playback");
            play();
        } else {
            console.log("Resuming playback");
            videoPlayer.play();
        }
    } else {
        console.log("Pausing playback");
        videoPlayer.pause();
    }
}