const ping = require("ping");
const mqtt = require("mqtt");
const debug = require("debug")("mqtt-online-check");
const config = require("./config.json");
const deadThreshold = 20;
const appearsAliveThreshold = 10; // 10 roundtrips have been successful
const isAliveTimespan = 300000; // Online for 5 minutes
const waitTimeDefault = 1000; // wait one sec between rountrips
const waitTimeWhenOnline = isAliveTimespan; // Wait 5 min if already pretty sure to be online
let deadCount = 0;
let aliveCount = 0;
let looksAliveTimestamp = 0;
let lastState;

/* Check config */
if (!config.host || !config.brokerUrl || !config.overallTopic || !config.detailTopic) {
	console.log("There's something missing in your config.json, please refer to config.example.json for an example");
	process.exit(1);
}

const mqttClient = mqtt.connect(config.brokerUrl);

console.log("MQTT Broker: " + config.brokerUrl);
console.log("Host: " + config.host);

function probeHost(hostname) {
	return ping.promise.probe(hostname).then(function(res) {
		let status = res.alive ? `alive (${res.time}ms)` : "dead";
		debug(`${res.host} (${res.numeric_host}) is: ${status}`);
		return res.alive;
	});
}

function probe() {
	probeHost(config.host).then(function(alive) {
		let waitTime = waitTimeDefault;

		if (!alive) {
			publishDetailState("Ping failed");
			if (deadCount < deadThreshold) {
				deadCount++;
			} else {
				publishOverallState("Offline");
				deadCount = 0;
				aliveCount = 0;
				looksAliveTimestamp = 0;
			}
		} else {
			publishDetailState("Ping succeeded");
			aliveCount++;
		}
		let aliveCountState = `Alive count: ${aliveCount} | Dead count buffer: ${deadCount}/${deadThreshold}`;
		debug(aliveCountState);
		publishDetailState(aliveCountState);

		if (aliveCount > appearsAliveThreshold) {
			if (debug.enabled) {
				let appearsOnlineState = "Appears online";
				debug(appearsOnlineState);
				publishOverallState(appearsOnlineState);
			}
			if (!looksAliveTimestamp) {
				debug("Setting timestamp");
				looksAliveTimestamp = new Date().getTime();
			}
		}
		if (looksAliveTimestamp) {
			let timestamp = new Date().getTime();
			let diff = timestamp - looksAliveTimestamp;

			if (diff > isAliveTimespan) {
				let onlineState = `Is online: ${diff / 1000 / 60}min passed without reset`;
				debug(onlineState);
				publishDetailState(onlineState);
				publishOverallState("Online");
				waitTime = waitTimeWhenOnline;
			} else {
				let assuranceState = `Appears online: assurance in ${(isAliveTimespan - diff) / 1000}sec...`;
				debug(assuranceState);
				publishDetailState(assuranceState);
			}
		}
		setTimeout(probe, waitTime);
	});
}

function publishOverallState(state) {
	if (lastState === state) {
		// Do not send same state repetitively
		return;
	}
	lastState = state;
	mqttClient.publish(config.overallTopic, state, {
		qos: 2, // must arrive and must arrive exactly once - also ensures order
		retain: true
	});
}

function publishDetailState(state) {
	if (!debug.enabled) {
		return;
	}
	mqttClient.publish(config.detailTopic, state, {
		qos: 2 // must arrive and must arrive exactly once - also ensures order
	});
}

mqttClient.on("connect", function() {
	probe();
});
