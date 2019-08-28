function init() {
    // global vars
    timers = [];
    sounds = [];
	holdMultiply = 1;
	exhaleMultiply = 1;
	direction = "right";
	isMetronomeSoundPlaying = false;
	ticksDuration = 3000; // The ticks3Sound must have this exact duration:

	getDummyVideoElement().volume = 0;
	
    // Sounds
	gongSound = createJPlayer("#jplayerGong", "audio/gong.ogg", false);
	gong3Sound = createJPlayer("#jplayerGong3", "audio/gong3.ogg", false);
	ticks3Sound = createJPlayer("#jplayerTicks3", "audio/tick3.ogg", false);
	metronomeSound = createJPlayer("#jplayerMetronome", "audio/metronome.ogg", true);

	// Exercise radio buttons
	series2Element=$("#series2");
	series3Element=$("#series3");
	series4Element=$("#series4");
	series5Element=$("#series5");
	series6Element=$("#series6");
	
	inhaleElement=$("#inhale");
	holdElement=$("#hold");
	exhaleElement=$("#exhale");
	timeElement = $("#time");
	timeDisplayElement = $("#timeDisplay");
	testBtnElement = $("#testBtn");
    documentVersionElement = $("#documentVersion");

	startStopElement=$("#startStop");
	clockElement=$("#clock");
	keepUnlockedMessageElement=$("#keepUnlockedMessage");
	cyclesElement=$("#cycles");
	configInputElements = $("#config :input");

	directionImageElement = $("#directionImage");

	clockCircle=clockElement.TimeCircles({ start: false, time: { Days: { show: false }, Hours: { show: false }, Minutes: { show: false }, Seconds: { text: "Hello" } }});
	
	series2Element.click(refreshExerciseTimes);
	series3Element.click(refreshExerciseTimes);
	series4Element.click(refreshExerciseTimes);
	series5Element.click(refreshExerciseTimes);
	series6Element.click(refreshExerciseTimes);
	inhaleElement.keyup(refreshExerciseTimes);
	
	inhaleElement.on("click", function () { $(this).select(); });
	timeElement.on("click", function () { $(this).select(); });

	loadFromStorage();
	refreshExerciseTimes();

	var body = document.documentElement;
	if (body.requestFullscreen) {
	    body.requestFullscreen();
	} else if (body.webkitrequestFullscreen) {
	    body.webkitrequestFullscreen();
	} else if (body.mozrequestFullscreen) {
	    body.mozrequestFullscreen();
	} else if (body.msrequestFullscreen) {
	    body.msrequestFullscreen();
	}

	window.addEventListener("load", function () { window.scrollTo(0, 0); });
	document.addEventListener("touchmove", function (e) { e.preventDefault() });
    
	if (isTestMode())
	    testBtnElement.show();

	documentVersionElement.text(document.lastModified);
}

function startStop() {
    if (startStopElement.val() == "Start")
        start();
    else
        stop();
}

function start() {
    startStopElement.val('Reset');
    saveToStorage();
    timeElement.hide()
    timeDisplayElement.show();

    setCyclesCount(0); // reset cycles display
    showKeepUnlockedMessage();

    // if inhale value is invalid - change to 1
    if ($.isNumeric(inhaleElement.val()) == false || inhaleElement.val() < 1) {
        inhaleElement.val(1);
        refreshExerciseTimes();
    }

    inhaleDuration = inhaleElement.val() * 1000;

    configInputElements.attr("disabled", true); // disable inputs
    setDirectionImage("right");

    durationMinutes = timeElement.val();
    endTime = new Date(new Date().getTime() + (durationMinutes * 60 * 1000));

    touchUserElements();

    mySetTimeout(function () { doWork('prepare'); }, 0);
    mySetTimeout(function () { runClockAndPreventDisplayTurnOff(); }, 0);
}

function stop() {
    startStopElement.val('Start');
    getDummyVideoElement().pause();
    hideKeepUnlockedMessage();
    timeElement.show()
    timeDisplayElement.hide();
    directionImageElement.hide();

    timers.forEach(function (timer) { clearTimeout(timer); });
    timers = [];

    sounds.forEach(function (sound) { sound.jPlayer("stop"); });

    isMetronomeSoundPlaying = false;
    clockCircle.stop();
    configInputElements.attr("disabled", false);
    setSecondsText('finished');
}

// This method is part of a user-event callstack (the user clicks the "Start button")
// We "touch" all user elements so the smartphone browser will allow manipulating them latter from background thread
// Workaround for mobile: http://stackoverflow.com/questions/14970204/android-not-playing-html5-audio-from-an-interval
function touchUserElements() {
    // play/pause video
    getDummyVideoElement().play();
    getDummyVideoElement().pause();

    // Play/pause all audio
    sounds.forEach(function(sound) {
        sound.jPlayer("play");
        sound.jPlayer("pause");
    });
}

function createJPlayer(elementSelector, audioUrl, shouldLoop) {
    var sound = $(elementSelector).jPlayer({
        ready: function () {
            $(this).jPlayer("setMedia", { mp3: audioUrl })
        },
        loop: shouldLoop
    });

    sounds.push(sound);
    return sound;
}

function isTestMode() {
    return window.location.search.indexOf('test') > -1;
}

function metronomeMode() {
    return window.location.search.indexOf('metronome') > -1;
}

// Use a function instead of storing the selector at "init" (I think that if you do that, then you can't 'play' the video from js on some smartphones)
function getDummyVideoElement() {
	return document.getElementById("dummyVideo");
}

function loadFromStorage() {
    loadInput(inhaleElement);
    loadInput(timeElement);
	loadRadio(series2Element);
	loadRadio(series3Element);
	loadRadio(series4Element);
	loadRadio(series5Element);
	loadRadio(series6Element);
}

function saveToStorage() {
    saveInput(inhaleElement);
    saveInput(timeElement);
	saveRadio(series2Element);
	saveRadio(series3Element);
	saveRadio(series4Element);
	saveRadio(series5Element);
	saveRadio(series6Element);
}

function refreshExerciseTimes() {
	if ($.isNumeric(inhaleElement.val()) ==  true && inhaleElement.val() < 1)
		inhaleElement.val(1);

	if (series2Element.is(':checked')) {
		holdMultiply = 4;
		exhaleMultiply = 2;
	}
	else {
		holdMultiply = 1.5;
		exhaleMultiply = 2;
	}

	holdElement.text((inhaleElement.val() * holdMultiply).toString());
	exhaleElement.text((inhaleElement.val() * exhaleMultiply).toString());
}

function test() {
    metronomeSound.jPlayer("play");

        //$("#jplayerGong").jPlayer({
        //    ready: function () {
        //        $(this).jPlayer("setMedia", {
        //            mp3: "audio/gong.ogg"
        //        }).jPlayer("play");

        //    },
        //    loop: true
        //});
}

function getCyclesCount() {
    return parseFloat(cyclesElement.val());
}

function setCyclesCount(count) {
    cyclesElement.val(count);
    cyclesElement.text(count);
}

function showKeepUnlockedMessage() {
    keepUnlockedMessageElement.fadeIn(1000);
}

function hideKeepUnlockedMessage() {
    keepUnlockedMessageElement.fadeOut(500);
}

function setDirectionImage(imageDirection) {
    directionImageElement.show();

    if (imageDirection === 'switch') {
        if (direction === 'right')
            imageDirection = 'left';
        else
            imageDirection = 'right';
    }
        
    direction = imageDirection;

    if (direction === 'right')
        directionImageElement.attr("src", "images/arrow-right.png");
    else if (direction === 'left')
        directionImageElement.attr("src", "images/arrow-left.png");
    else
        directionImageElement.attr("src", "");

}
function mySetTimeout(func, duration) {
	var timer = setTimeout(func, duration);
	timers.push(timer);
}

function setSecondsText(text) {
	clockCircle.options.time.Seconds.text = text;
	clockCircle.rebuild();
}

function doWork(state) {
	setSecondsText(state);
    
    var gong = true;
	var duration;	
	var nextState;
  
    // Calc state duration and get the next state
	if (state === 'prepare') {
	    duration = 5000;
	    nextState = 'inhale';
	    gong = false;
	}
	else if (state === 'inhale') {	
	    // Start metronome on first inhale
	    if (!isMetronomeSoundPlaying && metronomeMode()) {
	        metronomeSound.jPlayer("play");
	        isMetronomeSoundPlaying = true;
	    }

		duration = inhaleDuration;
		nextState = 'hold';
	}
	else if (state === 'hold') {
		duration = inhaleDuration * holdMultiply;
		nextState = 'exhale';
	}	
	else if (state === 'exhale') {
		duration = inhaleDuration * exhaleMultiply;
		nextState = 'inhale';
	}

	isLastExhale = state === 'exhale' && getTimeLeftMilli() <= duration;

	if (gong) {
        // play 1 gong or 3 gongs at the end of the last cycle
	    if (isLastExhale) {
	        gong3Sound.jPlayer("stop");
	        gong3Sound.jPlayer("play");
	    }
	    else {
	        gongSound.jPlayer("stop");
	        gongSound.jPlayer("play");
	    }
	}

    restartClock(duration);
	
	// play 3 ticks towards the end of the phase
	var ticksStart = duration - ticksDuration;
	mySetTimeout(function(){ play3Ticks(); }, ticksStart); 
	
	// Start the next interval or stop if time ended
	mySetTimeout(function(){ 
		// Increment cycles counter at the end of the cycle
	    if (state === 'exhale') {
	        setCyclesCount(getCyclesCount() + 0.5);
	        setDirectionImage("switch");
	    }

        // stop if this is the end of a full cycle (just switched to 'right' for the next cycle) and only 30 seconds or less left
	    if (state === 'exhale' && direction === 'right' && getTimeLeftMilli() <= 30000)
	        stop();
        else
	        doWork(nextState); 
	}, duration);
}

function runClockAndPreventDisplayTurnOff() {
    // update time display
    var timeLeftMilli = getTimeLeftMilli();
    var timeLeftMinutes = 0;
    var timeLeftSeconds = 0;

    if (timeLeftMilli >= 0) {
        var timeLeftMinutes = Math.floor((timeLeftMilli % 36e5) / 6e4);
        var timeLeftSeconds = Math.floor((timeLeftMilli % 6e4) / 1000);
    }

    timeDisplayElement.text(pad(timeLeftMinutes) + ":" + pad(timeLeftSeconds));

    getDummyVideoElement().play();
    getDummyVideoElement().pause();

    mySetTimeout(function () {
        runClockAndPreventDisplayTurnOff();
    }, 1000);
}

function pad(number) {
    return (number < 10) ? '0' + number.toString() : number.toString();
}

//function hasEnoughTimeForAnotherFullCycle() {
//    var halfCycleDuration = inhaleDuration + (inhaleDuration * holdMultiply) + (inhaleDuration * exhaleMultiply);
//    var fullCycleDuration = halfCycleDuration * 2;

//    var timeLeftDuration = getTimeLeftMilli();
//    timeLeftDuration += 30000; // 30 seconds grace to finish another cycle

//    return fullCycleDuration <= timeLeftDuration;
//}

function getTimeLeftMilli() {
    return endTime - new Date().getTime();
}

function play3Ticks() {
    ticks3Sound.jPlayer("play");
}

function restartClock(durationMilli) {
	clockElement.data('timer', durationMilli / 1000);
	clockCircle.restart();
}