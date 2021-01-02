const mqtt = require("mqtt");
const isOnline = require("is-online");
const fast = require("fast-cli/api");

const mqttBroker = process.env.MQTT_ONLINE_CHECK_MQTT_BROKER;
let mqttTopicPrefix = process.env.MQTT_ONLINE_CHECK_MQTT_TOPIC_PREFIX;
const mqttErrorTopic = process.env.MQTT_ONLINE_CHECK_MQTT_ERROR_TOPIC; // optional

if (!mqttBroker || !mqttTopicPrefix) {
	console.log("Configuration environment variable(s) missing");
	process.exit(1);
}

// Remove any trailing slash from topic prefix because we can
mqttTopicPrefix = mqttTopicPrefix.replace(/\/$/, "");

const defaultInterval = 60000 * 5; // 5 min
const offlineInterval = 10000; // 10 sec
const speedTestMinInterval = 60000 * 20;
const speedTestMaxInterval = 60000 * 60;
let lastSpeedTest = 0;
let speedTestInterval = 0;

const mqttClient = mqtt.connect(mqttBroker);

console.log("MQTT Broker: " + mqttBroker);
console.log("MQTT Topic: " + mqttTopicPrefix);

async function probe() {
	console.log("Probing...");
	const online = await isOnline();

	if (online) {
		console.log("Online");
		publishConnectivity("1");
		const now = new Date().getTime();
		if (now - speedTestInterval > lastSpeedTest) {
			// Time for a speed test!
			lastSpeedTest = now;
			resetSpeedTestInterval();
			try {
				await runSpeedTest();
			} catch (err) {
				console.log(`Speed Test failed with error: ${err.message}`);
				publishError(err.message);
			}
		}

		setTimeout(probe, defaultInterval);
	} else {
		console.log("Offline");
		publishConnectivity("0");
		setTimeout(probe, offlineInterval);
	}
}

function publishConnectivity(connectivity) {
	mqttClient.publish(`${mqttTopicPrefix}/Connectivity`, connectivity, {
		qos: 1
	});
}

function publishSpeed(rate, direction) {
	mqttClient.publish(`${mqttTopicPrefix}/${direction}`, String(rate), {
		qos: 1
	});
}

function publishError(msg) {
	if (mqttErrorTopic) { // optional
		mqttClient.publish(`${mqttErrorTopic}`, msg, {
			qos: 1
		});
	}
}

async function runSpeedTest() {
	let data;
	console.log("Running speed test...");
	await fast({measureUpload: true}).forEach((result) => {
		data = result;
	});
	if (!data.isDone) {
		throw new Error("Speedtest failed to complete");
	}
	const downloadKbps = convertToKbps(data.downloadSpeed, data.downloadUnit);
	console.log(`Download speed is ${downloadKbps} Kbps (Kilobit per second)`);
	publishSpeed(downloadKbps, "Download");

	const uploadKbps = convertToKbps(data.uploadSpeed, data.uploadUnit);
	console.log(`Upload speed is ${uploadKbps} Kbps (Kilobit per second)`);
	publishSpeed(uploadKbps, "Upload");
}

function convertToKbps(rate, unit) {
	switch (unit) {
	case "Gbps":
		return rate * 1000 * 1000;
	case "Mbps":
		return rate * 1000;
	case "Kbps":
		return rate;
	default:
		throw new Error(`Failed to convert rate to Kbps: Unexpected unit ${unit}`);
	}
}

function resetSpeedTestInterval() {
	speedTestInterval = getRandomIntInclusive(speedTestMinInterval, speedTestMaxInterval);
	console.log(`Speed test interval set to ${speedTestInterval / 60000} minutes`);
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

mqttClient.on("connect", function() {
	probe();
});
