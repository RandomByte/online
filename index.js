const mqtt = require("mqtt");
const isOnline = require("is-online");

const mqttBroker = process.env.MQTT_ONLINE_CHECK_MQTT_BROKER;

// Remove any trailing slash from topic prefix because we can
const mqttTopicPrefix = process.env.MQTT_ONLINE_CHECK_MQTT_TOPIC_PREFIX.replace(/\/$/, "");

if (!mqttBroker || !mqttTopicPrefix) {
	console.log("Configuration environment variable(s) missing");
	process.exit(1);
}

const defaultInterval = 60000 * 5; // 5 min
const offlineInterval = 10000; // 10 sec

const mqttClient = mqtt.connect(mqttBroker);

console.log("MQTT Broker: " + mqttBroker);
console.log("MQTT Topic: " + mqttTopicPrefix);

async function probe() {
	console.log("Probing...");
	const online = await isOnline();

	if (online) {
		console.log("Online");
		publishConnectivity("Online");
		setTimeout(probe, defaultInterval);
	} else {
		console.log("Offline");
		publishConnectivity("Online");
		setTimeout(probe, offlineInterval);
	}
}

function publishConnectivity(connectivity) {
	mqttClient.publish(`${mqttTopicPrefix}/Connectivity`, connectivity, {
		qos: 1
	});
}

mqttClient.on("connect", function() {
	probe();
});
