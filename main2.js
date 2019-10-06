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

// Dominant side: L or R
const domL = "L";
const domR = "R";

// Used to display "rest" and to identify the rest set in code
const rest = "Rest";

// durations
const readyMilli = 5000; // ready phase duration
const setAboutToEndDuration = 10000; // 10s before the end of the set the "tick tock" sound will be played
const setEndingDuration = 3000; // 3s before the end of the set the "charge" sound will be played

function init() {
	// global vars
	running = false;
	trainingSession = [];
	timers = [];
	clockTimer = null;
    sounds = [];
	debugMode = window.location.search.indexOf('debug') > -1;
	//var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

	getDummyVideoElement().volume = 0;
	
	var soundSources = {
		exclamation: "audio/exclamation.mp3",
		charge: "audio/charge.mp3",
		ticktock: "audio/ticktock.mp3",
		alternate: "audio/alternate.mp3",
		end: "audio/end.mp3",
		race: "audio/race.mp3",
		dice: "audio/dice.mp3"
	};

	// Sounds
	exclamationSound = createJPlayer("#jplayerExclamation", soundSources["exclamation"], false);
	chargeSound = createJPlayer("#jplayerCharge", soundSources["charge"], false);
	ticktockSound = createJPlayer("#jplayerTickTock", soundSources["ticktock"], false);
	alternateSound = createJPlayer("#jplayerAlternate", soundSources["alternate"], false);
	endSound = createJPlayer("#jplayerEnd", soundSources["end"], false);
	raceSound = createJPlayer("#jplayerRace", soundSources["race"], false);
	diceSound = createJPlayer("#jplayerDice", soundSources["dice"], false);

	// elements
	configElement = $("#config");
	cogElement = $("#cog");
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

	swingsGroupElement=$("#swingsGroup");
	sw2Element=$("#sw2");
	sw1Element=$("#sw1");

	pushupsGroupElement=$("#pushupsGroup");
	pupElement=$("#pup");
	pufElement=$("#puf");

	dominantSideGroupElement=$("#dominantSideGroup");
	domlElement=$("#doml");
	domrElement=$("#domr");
	
	elapsedElement = $("#elapsed");
	totalTimeElement = $("#totalTime");
	currentSeriesElement = $("#currentSeries");
	timeElement = $("#time");
	currentSetElement = $("#currentSet");
	nextSetElement = $("#nextSet");
    versionElement = $("#version");
    versionTitleElement = $("#versionTitle");

	timerElement=$("#timer");
	keepUnlockedMessageElement=$("#keepUnlockedMessage");
	configInputElements = $("#config :input");

	cogEndSoundChargeElement=$("#endSoundCharge");
	cogEndSoundRaceElement=$("#endSoundRace");
	cogEndSoundNoneElement=$("#endSoundNone");

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
	domlElement.click(refreshConfig);
	domrElement.click(refreshConfig);
	
	refreshConfig();

	cogEndSoundChargeElement.click(refreshCogEndSound);
	cogEndSoundRaceElement.click(refreshCogEndSound);
	cogEndSoundNoneElement.click(refreshCogEndSound);

	configElement.show( "0" );

	window.addEventListener("load", function () { window.scrollTo(0, 0); });
	document.addEventListener("touchmove", function (e) { e.preventDefault() });
    
	versionElement.text(version());

	$(window).blur(function() {
		if (running)
			showKeepUnlockedMessage();
	});

	$(window).focus(function() {
		if (running)
        	hideKeepUnlockedMessage();
	});

	versionTitleElement.mayTriggerLongClicks( { delay: 600 } )
		.on( 'longClick', function() {
			debugMode = true;
			initDebugMode();
		} );

	if (debugMode)
		initDebugMode();
}

function initDebugMode() {
	var isStandalone = Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
	var standalone = isStandalone ? ", standalone" : "";

	versionTitleElement.text("debug" + standalone + ":");
	debug("debug mode." + standalone);

	getDummyVideoElement().attr('src', "video/DebugMovie.mp4");
	getDummyVideoElement()[0].load();
}

function version() {
	var d = new Date(document.lastModified);
	var major = d.getUTCFullYear() - 2019;
	var minor = d.getUTCMonth() + 1;
	var build = d.getUTCDate();
	var rev = d.getUTCHours() * 100 + d.getUTCMinutes();
	rev = rev < 1000 ? "0" + String(rev) : rev;

	return major + "." + minor + "." + build + "." + rev;
}

function rand() {
	playDiceSound();

	// rand series
	var dice = rollDice();
	var series = diceToSeries(dice);

	// "if you rolled the same rep count as the last session, roll again"
	while (series == getSeries()) {
		dice = rollDice();
		series = diceToSeries(dice);
	}

	setSeries(series);

	// rand reps/sets
	setRepsAndSets(rollDice());

	if (getSessionType() == session_swing) {
		// swing type
		setSwingType(rollDice());

		// pushup type
		setPushupType(rollDice());
	}

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

function getDominantSide() {
	if (domlElement.is(':checked'))
		return domL;
	return domR;
}

// This method is part of a user-event callstack (the user clicks the "Start button")
// We "touch" all user elements so the smartphone browser will allow manipulating them latter from background "thread"
// Workaround for mobile: http://stackoverflow.com/questions/14970204/android-not-playing-html5-audio-from-an-interval
function touchUserElements() {
    // play/pause video
    getDummyVideoElement()[0].play();
    getDummyVideoElement()[0].pause();

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

// Use a function instead of storing the selector at "init" (I think that if you do that, then you can't 'play' the video from js on some smartphones)
function getDummyVideoElement() {
	return $("#dummyVideo");
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
	loadRadio(domlElement);
	loadRadio(domrElement);
	loadRadio(cogEndSoundChargeElement);
	loadRadio(cogEndSoundRaceElement);
	loadRadio(cogEndSoundNoneElement);
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
	saveRadio(domlElement);
	saveRadio(domrElement);
	saveRadio(cogEndSoundChargeElement);
	saveRadio(cogEndSoundRaceElement);
	saveRadio(cogEndSoundNoneElement);
}

function refreshConfig() {
	saveToStorage();

	var isSwing = getSessionType() == session_swing;

	if (isSwing) {
		swingsGroupElement.show( "0" );
		pushupsGroupElement.show( "0" );
		dominantSideGroupElement.hide( "fast" );
	}
	else {
		swingsGroupElement.hide( "fast" );
		pushupsGroupElement.hide( "fast" );
		dominantSideGroupElement.show( "0" );
	}

	setTimerText("0");
	setCurrentSeriesText("");
	setCurrentSetText("");
	setNextSetText("");

	var totalTimeMins = 0;
	var series = getSeries();

	if (isSwing) {
		totalTimeMins = series * 3 /*min*/ * 2 /*swings+pushups*/;
		trainingSession = getSwingsAndPushupsSeries(series);
	}
	else {
		totalTimeMins = series * 4 /*min*/;
		trainingSession = getSnatchesSeries(series);
	}

	setTotalTimeText(totalTimeMins + ":00");

	if (debugMode) {
		debug("=== training session: ===");

		for (i = 0; i < trainingSession.length; i++) {
			set = trainingSession[i];
			debug("series " + set.series + ": " + set.name + ", is alternate: " + set.isAlt + ", " + set.duration / 1000 + " sec");
		}
	}
}

function refreshCogEndSound() {
	saveToStorage();
	playSetEnding();
}
function makeSet(name, type, series, isAlt, duration) {
	return { name: name, type: type, series: series, duration: duration, isAlt: isAlt, endTime: new Date()}
}

function getSwingsAndPushupsSeries(series) {
	var result = [];

	var swGrip = getSwingType() == sw2 ? "Two-arm" : "One-arm";
	var puType = getPushupType() == pup ? "Palms" : "Fists";
	var side = "R";

	// one-arm swings: switch arms from set to set
	function getSide() {
		if (getSwingType() == sw2)
			side = "";
		else
			side = side == "R" ? "L" : "R";

		return side;
	}

	var repsAndSets = getRepsAndSets();
	var curRepsAndSets = reps10_2;

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

		var isAlt = i > 0 && repsAndSets == repsAlt;

		if (curRepsAndSets == reps5_4) {
			// swings series
			result.push(makeSet(swGrip + " Swings: 5" + getSide(),"Swings", i+1, isAlt, 30000));
			result.push(makeSet(swGrip + " Swings: 5" + getSide(),"Swings", i+1, isAlt, 30000));
			result.push(makeSet(swGrip + " Swings: 5" + getSide(),"Swings", i+1, isAlt, 30000));
			result.push(makeSet(swGrip + " Swings: 5" + getSide(),"Swings", i+1, isAlt, 30000));
			result.push(makeSet(rest, "Swings", i+1, false, 60000));

			// pushups series
			result.push(makeSet(puType + " Pushups: 5", "Pushups", i+1, false, 30000));
			result.push(makeSet(puType + " Pushups: 5", "Pushups", i+1, false, 30000));
			result.push(makeSet(puType + " Pushups: 5", "Pushups", i+1, false, 30000));
			result.push(makeSet(puType + " Pushups: 5", "Pushups", i+1, false, 30000));
			result.push(makeSet(rest, "Pushups", i+1, false, 60000));
		}
		else {
			//swings series
			result.push(makeSet(swGrip + " Swings: 10" + getSide(),"Swings", i+1, isAlt, 60000));
			result.push(makeSet(swGrip + " Swings: 10" + getSide(),"Swings", i+1, isAlt, 60000));
			result.push(makeSet(rest, "Swings", i+1, false, 60000));

			// pushups series
			result.push(makeSet(puType + " Pushups: 10", "Pushups", i+1, false, 60000));
			result.push(makeSet(puType + " Pushups: 10", "Pushups", i+1, false, 60000));
			result.push(makeSet(rest, "Pushups", i+1, false, 60000));
		}
	}

	return result;
}

function getSnatchesSeries(series) {
	var result = [];

	var sideSwitcher = getDominantSide() == domL ? "L" : "R";

	function getSide() {
		// switch first so we start with none dominant-side
		sideSwitcher = sideSwitcher == "R" ? "L" : "R";
		return sideSwitcher;
	}

	var repsAndSets = getRepsAndSets();
	var curRepsAndSets = reps10_2;
	var side = "";

	for (i = 0; i < series; i++) {
		side = getSide();

		if (repsAndSets == repsAlt) {
			// alternate reps and sets when back to the none dominant-side (e.g.: series 1: 5L/4, series 2: 5R/4, series 3: 10L/2, series 4: 10R/2)
			var isNoneDominantSide = i % 2 == 0;

			if (isNoneDominantSide) {
				if (curRepsAndSets == reps10_2)
					curRepsAndSets = reps5_4;
				else
					curRepsAndSets = reps10_2;
			}
		} else {
			curRepsAndSets = repsAndSets;
		}

		var isAlt = i > 0 && repsAndSets == repsAlt;

		if (curRepsAndSets == reps5_4) {
			result.push(makeSet("Snatches: 5" + side,"Snatches", i+1, isAlt, 30000));
			result.push(makeSet("Snatches: 5" + side,"Snatches", i+1, isAlt, 30000));
			result.push(makeSet("Snatches: 5" + side,"Snatches", i+1, isAlt, 30000));
			result.push(makeSet("Snatches: 5" + side,"Snatches", i+1, isAlt, 30000));
			result.push(makeSet(rest,"Snatches", i+1, false, 120000));
		}
		else {
			result.push(makeSet("Snatches: 10" + side,"Snatches", i+1, isAlt, 60000));
			result.push(makeSet("Snatches: 10" + side,"Snatches", i+1, isAlt, 60000));
			result.push(makeSet(rest,"Snatches", i+1, false, 120000));
		}
	}

	return result;
}

function playDiceSound() {
	diceSound.jPlayer("stop");
    diceSound.jPlayer("play");
}

function playSetAboutToEndSound() {
	ticktockSound.jPlayer("stop");
    ticktockSound.jPlayer("play");
}

function playNotifyAlternateSound() {
	alternateSound.jPlayer("stop");
    alternateSound.jPlayer("play");
}

function playSetEnding() {
	chargeSound.jPlayer("stop");
	raceSound.jPlayer("stop");
	
	if (cogEndSoundChargeElement.is(':checked')) {
		chargeSound.jPlayer("play");
	} else if (cogEndSoundRaceElement.is(':checked')) {
		raceSound.jPlayer("play");
	}
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

function openCog() {
	configElement.hide( "fast" );
	cogElement.show( "fast" );
}

function closeCog() {
	cogElement.hide( "fast" );
	configElement.show( "fast" );
}

function startStop() {
	if (running) {
		stop(true);
	}
    else {
		start();
	}
}

function preventReload() {
	return "Reloading the page will cancel the session. Are you sure?";  
}

function start() {
	running = true;
	configElement.hide( "fast" );
	runElement.show( "fast" );
    configInputElements.attr("disabled", true); // disable inputs
	$(window).on('beforeunload', preventReload);
	
	touchUserElements();

	updateEndTimes(new Date(new Date().getTime() + readyMilli))
	
	var sessionStartTime = new Date(new Date().getTime() + readyMilli);

    mySetTimeout(function () { startSet(-1, sessionStartTime); }, 0);
}

function stop(manualStop) {
	running = false;
	configElement.show( "fast" );
	runElement.hide( "fast" );
	$(window).unbind('beforeunload', preventReload);
	getDummyVideoElement()[0].pause();

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
	
	var ready = index == -1;
	var lastSet = index == trainingSession.length - 1;
	var setEndTime = null;

	if (ready) {
		//duration = readyMilli;
		setEndTime = sessionStartTime;
		setCurrentSetText("Ready ...");
		setCurrentSeriesText("Series " + trainingSession[0].series + " / " + getSeries());
		setNextSetText(trainingSession[0].name);
	} 
	else {
		var set = trainingSession[index];

		//duration = set.duration;
		setEndTime = set.endTime;
		debug("started set #" + index + ": series " + set.series + ", " + set.name + ", " + set.duration + " sec");

		setCurrentSeriesText("Series " + set.series + " / " + getSeries());
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
		if (!lastSet) {
			var nextSetIsRest = trainingSession[index+1].name == rest;
			var nextSetIsAlt = trainingSession[index+1].isAlt;

			if (!nextSetIsRest) {
				mySetTimeout(function(){ playSetEnding(); }, duration - setEndingDuration);

				if (!ready) {
					if (nextSetIsAlt) {
						mySetTimeout(function() {
							playNotifyAlternateSound();
							nextSetElement.addClass("blink");

							mySetTimeout(function(){
								nextSetElement.removeClass("blink");
							}, 4000);
						}, duration - setAboutToEndDuration);
					}
					else
						mySetTimeout(function(){ playSetAboutToEndSound(); }, duration - setAboutToEndDuration);
				}
			}
		}
		
		clockTimer = mySetTimeout(function () { refreshClock(sessionStartTime, setEndTime); }, 0);
	}

	currentSetElement.addClass("blink");
	
	mySetTimeout(function(){
		currentSetElement.removeClass("blink");
	}, 1500);

	// Start the next set or stop if time ended
	mySetTimeout(function(){
		if (lastSet)
	        stop(false);
        else
			startSet(++index, sessionStartTime); 
	}, duration);
}

function refreshClock(sessionStartTime, setEndTime) {
	// prevent screen lock. we do this on high interval in case the video stopped (e.g. user clicks "pause" button in app sound indication on smartphone)
	getDummyVideoElement()[0].pause();
	getDummyVideoElement()[0].play();

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

function updateEndTimes(startTime) {
	var endTime = startTime;
	for (i = 0; i < trainingSession.length; i++) {
		set = trainingSession[i];
		endTime = new Date(endTime.getTime() + set.duration);
		set.endTime = endTime;
		debug(set.name + ", " + pad(set.endTime.getHours()) + ":" + pad(set.endTime.getMinutes()) + ":" + pad(set.endTime.getSeconds()));
	}
}

function pad(number) {
    return (number < 10 ? "0" : "") + number.toString();
}

function rollDice() {
	var dice = Math.floor((Math.random() * 6) + 1);
	return dice
}

function debug(msg) {
	if (debugMode)
		console.log(msg)
}