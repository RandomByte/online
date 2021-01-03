const mqtt = require("mqtt");
const isOnline = require("is-online");

const mqttBroker = process.env.MQTT_ONLINE_CHECK_MQTT_BROKER;
let mqttTopic = process.env.MQTT_ONLINE_CHECK_MQTT_TOPIC;

if (!mqttBroker || !mqttTopic) {
	console.log("Configuration environment variable(s) missing");
	process.exit(1);
}


const defaultInterval = 60000 * 5; // 5 min
const offlineInterval = 10000; // 10 sec

const mqttClient = mqtt.connect(mqttBroker);

console.log("MQTT Broker: " + mqttBroker);
console.log("MQTT Topic: " + mqttTopic);

async function probe() {
	console.log("Probing...");
	const online = await isOnline();

	if (online) {
		console.log("Online");
		publishConnectivity("1");
		setTimeout(probe, defaultInterval);
	} else {
		console.log("Offline");
		publishConnectivity("0");
		setTimeout(probe, offlineInterval);
	}
}

function publishConnectivity(connectivity) {
	mqttClient.publish(mqttTopic, connectivity, {
		qos: 1
	});
}

mqttClient.on("connect", function() {
	probe();
});
