// Session: swings & pushups or snatched
const session_swing = "swing";
const session_snatch = "snatch";

// Reps/sets: 5/4 or 10/2 or alternate
const reps5_4 = "5/4";
const reps10_2 = "10/2";
const repsAlt = "alt";

// Swing type: Two-are or One-arm
const sw2 = "2";
const sw1 = "1";

// Pushup type: Plams or Fists
const pup = "palms";
const puf = "fists";

function init() {
	// global vars
	trainingSession = [];
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
	sessionSwingElement=$("#sessionSwing");
	sessionSnatchElement=$("#sessionSnatch");
	sessionSwingElement.prop('checked', true);

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
	
	timeElement = $("#time");
	testBtnElement = $("#testBtn");
    documentVersionElement = $("#documentVersion");

	startStopElement=$("#startStop");
	timerElement=$("#timer");
	keepUnlockedMessageElement=$("#keepUnlockedMessage");
	configInputElements = $("#config :input");

	loadFromStorage();

	sessionSwingElement.click(configChanged);
	sessionSnatchElement.click(configChanged);
	series2Element.click(configChanged);
	series3Element.click(configChanged);
	series4Element.click(configChanged);
	series5Element.click(configChanged);
	reps5Element.click(configChanged);
	reps10Element.click(configChanged);
	repsaltElement.click(configChanged);
	sw2Element.click(configChanged);
	sw1Element.click(configChanged);
	pupElement.click(configChanged);
	pufElement.click(configChanged);
	
	configChanged();

	window.addEventListener("load", function () { window.scrollTo(0, 0); });
	document.addEventListener("touchmove", function (e) { e.preventDefault() });
    
	if (isTestMode())
	    testBtnElement.show();

	documentVersionElement.text(version());
}

function version() {
	d = new Date(document.lastModified);
	major = d.getUTCFullYear() - 2019;
	minor = d.getUTCMonth() + 1;
	build = d.getUTCDate();
	rev = d.getUTCHours() * 100 + d.getUTCMinutes();
	return major + "." + minor + "." + build + "." + rev;
}

function rand() {
	// rand series
	dice = rollDice();
	series = diceToSeries(dice);

	// "if you rolled the same rep count as the last session, roll again"
	while (series == getSeries()) {
		dice = rollDice();
		series = diceToSeries(dice);
	}

	setSeries(series);

	// rand reps/sets
	setRepsAndSets(rollDice());

	// swing type
	setSwingType(rollDice());

	// pushup type
	setPushupType(rollDice());

	configChanged();
}

function diceToSeries(dice) {
	if (dice == 1)
		return 2;
	if (dice == 2 || dice == 3)
		return 3;
	if (dice == 4 || dice == 5)
		return 4;
	return 5;
}

function getSeries() {
	if (series2Element.is(':checked'))
		return 2;
	if (series3Element.is(':checked'))
		return 3;
	if (series3Element.is(':checked'))
		return 3;
	if (series4Element.is(':checked'))
		return 4;
	return 5;
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

function getSessionType() {
	if (sessionSnatchElement.is(':checked'))
		return session_snatch;
	return session_swing;
}

function getRepsAndSets() {
	if (reps5Element.is(':checked'))
		return reps5_4;
	if (repsaltElement.is(':checked'))
		return repsAlt;
	return reps10_2;
}

function setRepsAndSets(dice) {
	if (dice == 1 || dice == 2)
		reps5Element.prop("checked", true);
	else if (dice == 3 || dice == 4)
		repsaltElement.prop("checked", true);
	else
		reps10Element.prop("checked", true);
}

function getSwingType() {
	if (sw2Element.is(':checked'))
		return sw2;
	return sw1;
}

function setSwingType(dice) {
	if (dice == 1 || dice == 2 || dice == 3)
		sw2Element.prop("checked", true);
	else
		sw1Element.prop("checked", true);
}

function getPushupType() {
	if (pupElement.is(':checked'))
		return pup;
	return puf;
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
    timeElement.hide()
    timeDisplayElement.show();

    showKeepUnlockedMessage();

    // if inhale value is invalid - change to 1
    if ($.isNumeric(inhaleElement.val()) == false || inhaleElement.val() < 1) {
        inhaleElement.val(1);
        configChanged();
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
	loadRadio(sessionSwingElement);
	loadRadio(sessionSnatchElement);
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
	saveRadio(sessionSwingElement);
	saveRadio(sessionSnatchElement);
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

function configChanged() {
	saveToStorage();

	session = getSessionType();

	//session_swing
	if (session == session_snatch) {
		alert("Snatched are not supported yet");
		sessionSwingElement.prop('checked', true)
		return;
	}

	var series = getSeries();
	var repsCount = series * 20;
	var sessionMin = series * 3 /*min*/ * 2 /*swings+pushups*/

	trainingSession = getSwingsSeries(series);
	trainingSession = trainingSession.concat(getPushupsSeries(series));

	debug("=== training session: ===");

	for (i = 0; i < trainingSession.length; i++) {
		c = trainingSession[i];
		debug("series " + c.series + ": " + c.name + " " + c.time + " sec");
	}
}

function getSwingsSeries(series) {
	result = [];

	var grip = "R";

	function getGrip() {
		if (getSwingType() == sw2)
			grip = " (2H)";
		else if (grip == "R")
			grip = "L";
		else
			grip = "R";

		return grip;
	}

	repsAndSets = getRepsAndSets();
	curRepsAndSets = reps10_2;

	for (i = 0; i < series; i++) {
		if (repsAndSets == repsAlt) {
			// alternate reps and sets
			if (curRepsAndSets == reps10_2)
				curRepsAndSets = reps5_4;
			else
				curRepsAndSets = reps10_2;
		} else {
			curRepsAndSets = repsAndSets;
		}

		if (curRepsAndSets == reps5_4) {
			result.push({ name: "Swings 5" + getGrip(), type: "Swings", series: i+1, time: 30 });
			result.push({ name: "Swings 5" + getGrip(), type: "Swings", series: i+1, time: 30 });
			result.push({ name: "Swings 5" + getGrip(), type: "Swings", series: i+1, time: 30 });
			result.push({ name: "Swings 5" + getGrip(), type: "Swings", series: i+1, time: 30 });
			result.push({ name: "Rest", type: "Swings", series: i+1, time: 60 });
		}
		else {
			result.push({ name: "Swings 10" + getGrip(), type: "Swings", series: i+1, time: 60 });
			result.push({ name: "Swings 10" + getGrip(), type: "Swings", series: i+1, time: 60 });
			result.push({ name: "Rest", type: "Swings", series: i+1, time: 60 });
		}
	}

	return result;
}

function getPushupsSeries(series) {
	result = [];

	var grip;

	if (getPushupType()== pup)
		grip = "(Palms)";
	else
		grip = "(Fists)";

	repsAndSets = getRepsAndSets();
	curRepsAndSets = reps10_2;

	for (i = 0; i < series; i++) {
		if (repsAndSets == repsAlt) {
			// alternate reps and sets
			if (curRepsAndSets == reps10_2)
				curRepsAndSets = reps5_4;
			else
				curRepsAndSets = reps10_2;
		} else {
			curRepsAndSets = repsAndSets;
		}

		if (curRepsAndSets == reps5_4) {
			result.push({ name: "Pushups 5 " + grip, type: "Pushups", series: i+1, time: 30 });
			result.push({ name: "Pushups 5 " + grip, type: "Pushups", series: i+1, time: 30 });
			result.push({ name: "Pushups 5 " + grip, type: "Pushups", series: i+1, time: 30 });
			result.push({ name: "Pushups 5 " + grip, type: "Pushups", series: i+1, time: 30 });
			result.push({ name: "Rest", type: "Pushups", series: i+1, time: 60 });
		}
		else {
			result.push({ name: "Pushups 10 " + grip, type: "Pushups", series: i+1, time: 60 });
			result.push({ name: "Pushups 10 " + grip, type: "Pushups", series: i+1, time: 60 });
			result.push({ name: "Rest", type: "Pushups", series: i+1, time: 60 });
		}
	}

	return result;
}

function test() {
    gongSound.jPlayer("play");
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

function rollDice() {
	dice = Math.floor((Math.random() * 6) + 1);
	//debug("dice: " + dice)
	return dice
}

function debug(msg) {
	console.log(msg)
}