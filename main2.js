function init() {
	// Reps/sets: 5/4 or 10/2 or alternate
	const reps5_4 = "5/4"
	const reps10_2 = "10/2"
	const repsAlt = "alt"

	// Swing type: Two-are or One-arm
	const sw2 = "2"
	const sw1 = "1"

	// Pushup type: Plams or Fists
	const pup = "palms"
	const puf = "fists"

    // global vars
    timers = [];
    sounds = [];
	holdMultiply = 1;
	exhaleMultiply = 1;
	ticksDuration = 3000; // The ticks3Sound must have this exact duration:

	getDummyVideoElement().volume = 0;
	
    // Sounds
	gongSound = createJPlayer("#jplayerGong", "audio/gong.ogg", false);
	gong3Sound = createJPlayer("#jplayerGong3", "audio/gong3.ogg", false);
	ticks3Sound = createJPlayer("#jplayerTicks3", "audio/tick3.ogg", false);

	// input elements
	series2Element=$("#series2");
	series3Element=$("#series3");
	series4Element=$("#series4");
	series5Element=$("#series5");

	reps5Element=$("#reps5");
	reps10Element=$("#reps10");
	repsaltElement=$("#repsalt");

	sw2Element=$("#sw2");
	sw1Element=$("#sw1");

	pupElement=$("#pup");
	pufElement=$("#puf");
	
	inhaleElement=$("#inhale");
	holdElement=$("#hold");
	exhaleElement=$("#exhale");
	timeElement = $("#time");
	timeDisplayElement = $("#timeDisplay");
	testBtnElement = $("#testBtn");
    documentVersionElement = $("#documentVersion");

	startStopElement=$("#startStop");
	timerElement=$("#timer");
	keepUnlockedMessageElement=$("#keepUnlockedMessage");
	cyclesElement=$("#cycles");
	configInputElements = $("#config :input");

	series2Element.click(refreshExerciseTimes);
	series3Element.click(refreshExerciseTimes);
	series4Element.click(refreshExerciseTimes);
	series5Element.click(refreshExerciseTimes);
	inhaleElement.keyup(refreshExerciseTimes);

	loadFromStorage();
	refreshExerciseTimes();

	window.addEventListener("load", function () { window.scrollTo(0, 0); });
	document.addEventListener("touchmove", function (e) { e.preventDefault() });
    
	if (isTestMode())
	    testBtnElement.show();

	documentVersionElement.text(version());
}

function version() {
	d = new Date(document.lastModified)
	major = d.getUTCFullYear() - 2019
	minor = d.getUTCMonth() + 1
	build = d.getUTCDate()
	rev = d.getUTCHours() * 100 + d.getUTCMinutes()
	return major + "." + minor + "." + build + "." + rev
}

function rand() {
	// rand series
	dice = throwDice()
	series = diceToSeries(dice)

	// "if you rolled the same rep count as the last session, roll again"
	while (series == getSeries()) {
		dice = throwDice()
		series = diceToSeries(dice)
	}

	setSeries(series)

	// rand reps/sets
	setReps(throwDice())

	// swing type
	setSwingType(throwDice())

	// pushup type
	setPushupType(throwDice())
}

function diceToSeries(dice) {
	if (dice == 1)
		return 2
	if (dice == 2 || dice == 3)
		return 3
	if (dice == 4 || dice == 5)
		return 4
	return 5
}

function getSeries() {
	if (series2Element.is(':checked'))
		return 2
	if (series3Element.is(':checked'))
		return 3
	if (series3Element.is(':checked'))
		return 3
	if (series4Element.is(':checked'))
		return 4
	return 5
}

function setSeries(series) {
	if (series == 2)
		series2Element.prop("checked", true);
	else if (series == 3)
		series3Element.prop("checked", true);
	else if (series == 4)
		series4Element.prop("checked", true);
	else
		series5Element.prop("checked", true);
}

function setReps(dice) {
	if (dice == 1 || dice == 2)
		reps5Element.prop("checked", true);
	else if (dice == 3 || dice == 4)
		repsaltElement.prop("checked", true);
	else
		reps10Element.prop("checked", true);
}

function setSwingType(dice) {
	if (dice == 1 || dice == 2 || dice == 3)
		sw2Element.prop("checked", true);
	else
		sw1Element.prop("checked", true);
}

function setPushupType(dice) {
	if (dice == 1 || dice == 2 || dice == 3)
		pupElement.prop("checked", true);
	else
		pufElement.prop("checked", true);
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

    timers.forEach(function (timer) { clearTimeout(timer); });
    timers = [];

    sounds.forEach(function (sound) { sound.jPlayer("stop"); });

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

// Use a function instead of storing the selector at "init" (I think that if you do that, then you can't 'play' the video from js on some smartphones)
function getDummyVideoElement() {
	return document.getElementById("dummyVideo");
}

function loadFromStorage() {
	loadRadio(series2Element);
	loadRadio(series3Element);
	loadRadio(series4Element);
	loadRadio(series5Element);
	loadRadio(reps5Element);
	loadRadio(reps10Element);
	loadRadio(repsaltElement);
	loadRadio(sw2Element);
	loadRadio(sw1Element);
	loadRadio(pupElement);
	loadRadio(pufElement);
}

function saveToStorage() {
	saveRadio(series2Element);
	saveRadio(series3Element);
	saveRadio(series4Element);
	saveRadio(series5Element);
	saveRadio(reps5Element);
	saveRadio(reps10Element);
	saveRadio(repsaltElement);
	saveRadio(sw2Element);
	saveRadio(sw1Element);
	saveRadio(pupElement);
	saveRadio(pufElement);
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
    gongSound.jPlayer("play");
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

function mySetTimeout(func, duration) {
	var timer = setTimeout(func, duration);
	timers.push(timer);
}

function setSecondsText(text) {
	timerElement.val = text
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
	    }

        // stop if this is the end of a full cycle (just switched to 'right' for the next cycle) and only 30 seconds or less left
	    if (state === 'exhale' && getTimeLeftMilli() <= 30000)
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

function getTimeLeftMilli() {
    return endTime - new Date().getTime();
}

function play3Ticks() {
    ticks3Sound.jPlayer("play");
}

function restartClock(durationMilli) {
	setSecondsText(durationMilli / 1000)
}

function throwDice() {
	dice = Math.floor((Math.random() * 6) + 1);
	debug("dice: " + dice)
	return dice
}

function debug(msg) {
	console.log(msg)
}