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

// ready phase duration
const readyMilli = 5000;

function init() {
	// global vars
	running = false;
	trainingSession = [];
	timers = [];
	clockTimer = null;
    sounds = [];
	holdMultiply = 1;
	exhaleMultiply = 1;
	setEndingDuration = 3000; // 3s before the end of the set a sound will be played
	debugMode = window.location.search.indexOf('debug') > -1;

	getDummyVideoElement().volume = 0;
	
    // Sounds
	exclamationSound = createJPlayer("#jplayerExclamation", "audio/exclamation.ogg", false);
	chargeSound = createJPlayer("#jplayerCharge", "audio/charge.ogg", false);
	endSound = createJPlayer("#jplayerEnd", "audio/end.ogg", false);

	// elements
	configElement = $("#config");
	runElement = $("#run");
	sessionSwingElement=$("#sessionSwing");
	sessionSnatchElement=$("#sessionSnatch");

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
	
	elapsedElement = $("#elapsed");
	totalTimeElement = $("#totalTime");
	currentSeriesElement = $("#currentSeries");
	timeElement = $("#time");
	currentSetElement = $("#currentSet");
	nextSetElement = $("#nextSet");
	testBtnElement = $("#testBtn");
    documentVersionElement = $("#documentVersion");

	timerElement=$("#timer");
	keepUnlockedMessageElement=$("#keepUnlockedMessage");
	configInputElements = $("#config :input");

	loadFromStorage();

	sessionSwingElement.click(refreshConfig);
	sessionSnatchElement.click(refreshConfig);
	series2Element.click(refreshConfig);
	series3Element.click(refreshConfig);
	series4Element.click(refreshConfig);
	series5Element.click(refreshConfig);
	reps5Element.click(refreshConfig);
	reps10Element.click(refreshConfig);
	repsaltElement.click(refreshConfig);
	sw2Element.click(refreshConfig);
	sw1Element.click(refreshConfig);
	pupElement.click(refreshConfig);
	pufElement.click(refreshConfig);
	
	refreshConfig();

	window.addEventListener("load", function () { window.scrollTo(0, 0); });
	document.addEventListener("touchmove", function (e) { e.preventDefault() });
    
	if (isTestMode())
	    testBtnElement.show();

	documentVersionElement.text(version());

	$(window).blur(function() {
		if (running)
			showKeepUnlockedMessage();
	});

	$(window).focus(function() {
		if (running)
        	hideKeepUnlockedMessage();
    });
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

	refreshConfig();
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

function refreshConfig() {
	saveToStorage();

	session = getSessionType();

	if (session == session_snatch) {
		alert("Snatches are not supported yet");
		sessionSwingElement.prop('checked', true)
		return;
	}

	var totalTimeMins = getSeries() * 3 /*min*/ * 2 /*swings+pushups*/;
	setTotalTimeText(totalTimeMins + ":00");

	setTimerText("0");
	setCurrentSeriesText("");
	setCurrentSetText("");
	setNextSetText("");

	var series = getSeries();

	trainingSession = getSwingsSeries(series);
	trainingSession = trainingSession.concat(getPushupsSeries(series));

	debug("=== training session: ===");

	for (i = 0; i < trainingSession.length; i++) {
		set = trainingSession[i];
		debug("series " + set.series + ": " + set.name + ", " + set.duration / 1000 + " sec");
	}
}

function makeSet(name, type, series, duration) {
	return { name: name, type: type, series: series, duration: duration, endTime: new Date()}
}

function getSwingsSeries(series) {
	result = [];

	var grip = getSwingType() == sw2 ? "Two-arm" : "One-arm";
	var side = "R";

	function getSide() {
		if (getSwingType() == sw2)
			side = "";
		else if (side == "R")
			side = "L";
		else
			side = "R";

		return side;
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
			result.push(makeSet(grip + " Swings: 5" + getSide(),"Swings", i+1, 30000));
			result.push(makeSet(grip + " Swings: 5" + getSide(),"Swings", i+1, 30000));
			result.push(makeSet(grip + " Swings: 5" + getSide(),"Swings", i+1, 30000));
			result.push(makeSet(grip + " Swings: 5" + getSide(),"Swings", i+1, 30000));
			result.push(makeSet("Rest","Swings", i+1, 60000));
		}
		else {
			result.push(makeSet(grip + " Swings: 10" + getSide(),"Swings", i+1, 60000));
			result.push(makeSet(grip + " Swings: 10" + getSide(),"Swings", i+1, 60000));
			result.push(makeSet("Rest","Swings", i+1, 60000));
		}
	}

	return result;
}

function getPushupsSeries(series) {
	result = [];

	var grip = getPushupType() == pup ? "Palms" : "Fists";

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
			result.push(makeSet(grip + " Pushups: 5", "Pushups", i+1, 30000));
			result.push(makeSet(grip + " Pushups: 5", "Pushups", i+1, 30000));
			result.push(makeSet(grip + " Pushups: 5", "Pushups", i+1, 30000));
			result.push(makeSet(grip + " Pushups: 5", "Pushups", i+1, 30000));
			result.push(makeSet("Rest", "Pushups", i+1, 60000));
		}
		else {
			result.push(makeSet(grip + " Pushups: 10", "Pushups", i+1, 60000));
			result.push(makeSet(grip + " Pushups: 10", "Pushups", i+1, 60000));
			result.push(makeSet("Rest", "Pushups", i+1, 60000));
		}
	}

	return result;
}

function test() {
	exclamationSound.jPlayer("stop");
    exclamationSound.jPlayer("play");
}

function playSetEnding() {
	chargeSound.jPlayer("stop");
    chargeSound.jPlayer("play");
}

function playSessionEnded() {
	endSound.jPlayer("stop");
    endSound.jPlayer("play");
}

function showKeepUnlockedMessage() {
	exclamationSound.jPlayer("stop");
	exclamationSound.jPlayer("play");
    keepUnlockedMessageElement.show();
}

function hideKeepUnlockedMessage() {
    keepUnlockedMessageElement.fadeOut(7000);
}

function mySetTimeout(func, duration) {
	var timer = setTimeout(func, duration);
	timers.push(timer);
	return timer;
}

function setTimerText(text) {
	timerElement.text(text)
}

function setElapsedText(text) {
	elapsedElement.text(text)
}

function setCurrentSetText(text) {
	currentSetElement.text(text)
}

function setNextSetText(text) {
	nextSetElement.text(text)
}

function setTotalTimeText(text) {
	totalTimeElement.text(text)
}

function setCurrentSeriesText(text) {
	currentSeriesElement.text(text)
}

function startStop() {
	if (running) {
		stop(true);
	}
    else {
		start();
	}
}

function start() {
	running = true;
	configElement.hide( "fast" );
	runElement.show( "fast" );

    configInputElements.attr("disabled", true); // disable inputs

	touchUserElements();

	// prevent screen lock
	getDummyVideoElement().pause();
	getDummyVideoElement().play();

	updateEndTimes(new Date(new Date().getTime() + readyMilli))
	
	var sessionStartTime = new Date(new Date().getTime() + readyMilli);

    mySetTimeout(function () { startSet(-1, sessionStartTime); }, 0);
}

function updateEndTimes(startTime) {
	endTime = startTime;
	for (i = 0; i < trainingSession.length; i++) {
		set = trainingSession[i];
		endTime = new Date(endTime.getTime() + set.duration);
		set.endTime = endTime;
		debug(set.name + ", " + pad(set.endTime.getHours()) + ":" + pad(set.endTime.getMinutes()) + ":" + pad(set.endTime.getSeconds()));
	}
}

function stop(manualStop) {
	running = false;
	configElement.show( "fast" );
	runElement.hide( "fast" );
    getDummyVideoElement().pause();

    timers.forEach(function (timer) { clearTimeout(timer); });
    timers = [];

	sounds.forEach(function (sound) { sound.jPlayer("stop"); });
	
	if (!manualStop)
		playSessionEnded();

	configInputElements.attr("disabled", false);

	// reset run elements
	refreshConfig();
}

function startSet(index, sessionStartTime) {
	if (clockTimer != null)
		clearTimeout(clockTimer);
	
	var lastSet = index == trainingSession.length - 1;
	var setEndTime = null;

	if (index == -1) {
		//duration = readyMilli;
		setEndTime = sessionStartTime;
		setCurrentSetText("Ready ...");
		setCurrentSeriesText(trainingSession[0].type + " series " + trainingSession[0].series + " / " + getSeries());
		setNextSetText(trainingSession[0].name);
	} 
	else {
		var set = trainingSession[index];

		//duration = set.duration;
		setEndTime = set.endTime;
		debug("started set #" + index + ": series " + set.series + ", " + set.name + ", " + set.duration + " sec");

		setCurrentSeriesText(set.type + " series " + set.series + " / " + getSeries());
		setCurrentSetText(set.name);

		if (index == trainingSession.length - 1)
			setNextSetText("Done!");
		else
			setNextSetText(trainingSession[index+1].name);	
	}
	
	// calc duration using the set end time that was planned instead of simply using the set duration, this is to fix time shifting due to js engine being stopped when the web browser is losing focus
	var duration = setEndTime - new Date().getTime();

	if (duration < 0) {
		duration = 0;
	}
	else {
		// reset timer
		setTimerText(Math.ceil(duration / 1000))
		
		// play a sound towards the end of the set, except on the last set (the session end sound will be played)
		if (!lastSet)
			mySetTimeout(function(){ playSetEnding(); }, duration - setEndingDuration);
		
		clockTimer = mySetTimeout(function () { refreshClock(sessionStartTime, setEndTime); }, 0);
	}

	// Start the next interval or stop if time ended
	mySetTimeout(function(){
		if (lastSet)
	        stop(false);
        else
			startSet(++index, sessionStartTime); 
	}, duration);
}

function refreshClock(sessionStartTime, setEndTime) {
	var timeLeft = setEndTime.getTime() - new Date();
	setTimerText(Math.ceil(timeLeft / 1000));

	var elapsed = new Date() - sessionStartTime;

	if (elapsed < 0) {
		// ready phase (session start time is in the future)
		setElapsedText("00:00")
	}
	else {
		var minutes = Math.floor(elapsed / 60000);
  		var seconds = ((elapsed % 60000) / 1000).toFixed(0);
		setElapsedText(pad(minutes) + ":" + pad(seconds))
	}

    clockTimer = mySetTimeout(function () {
        refreshClock(sessionStartTime, setEndTime);
    }, 1000);
}

function pad(number) {
    return (number < 10 ? "0" : "") + number.toString();
}

function rollDice() {
	dice = Math.floor((Math.random() * 6) + 1);
	return dice
}

function debug(msg) {
	if (debugMode)
		console.log(msg)
}