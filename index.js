const ping = require("ping");
const mqtt = require("mqtt");
const debug = require("debug")("mqtt-online-check");

const host = process.env.MQTT_ONLINE_CHECK_HOSTNAME;
const mqttBroker = process.env.MQTT_ONLINE_CHECK_MQTT_BROKER;
const mqttTopic = process.env.MQTT_ONLINE_CHECK_MQTT_TOPIC;

if (!host || !mqttBroker || !mqttTopic) {
	console.log("Configuration environment variable(s) missing");
	process.exit(1);
}

const deadThreshold = 20;
const appearsAliveThreshold = 10; // 10 roundtrips have been successful
const isAliveTimespan = 300000; // Online for 5 minutes
const waitTimeDefault = 1000; // wait one sec between rountrips
const waitTimeWhenOnline = isAliveTimespan; // Wait 5 min if already pretty sure to be online
let deadCount = 0;
let aliveCount = 0;
let looksAliveTimestamp = 0;
let lastState;

const mqttClient = mqtt.connect(mqttBroker);

console.log("MQTT Broker: " + mqttBroker);
console.log("Host: " + host);

function probeHost(hostname) {
	return ping.promise.probe(hostname).then(function(res) {
		let status = res.alive ? `alive (${res.time}ms)` : "dead";
		debug(`${res.host} (${res.numeric_host}) is: ${status}`);
		return res.alive;
	});
}

function probe() {
	probeHost(host).then(function(alive) {
		let waitTime = waitTimeDefault;

		if (!alive) {
			if (deadCount < deadThreshold) {
				deadCount++;
			} else {
				publishState({
					online: false,
					state: 3
				});
				deadCount = 0;
				aliveCount = 0;
				looksAliveTimestamp = 0;
			}
			publishState({
				successfulPings: aliveCount,
				successfulPingsThreshold: appearsAliveThreshold
			});
		} else if (aliveCount <= appearsAliveThreshold) {
			aliveCount++;

			publishState({
				successfulPings: aliveCount,
				successfulPingsThreshold: appearsAliveThreshold
			});
		}
		if (debug.enabled) {
			debug(`Alive count: ${aliveCount}/${appearsAliveThreshold} ` +
				`| Dead count buffer: ${deadCount}/${deadThreshold}`);
		}

		if (aliveCount > appearsAliveThreshold) {
			debug("Appears online");
			if (!looksAliveTimestamp) {
				debug("Setting timestamp");
				publishState({
					state: 2
				});
				looksAliveTimestamp = new Date().getTime();
			}
		}
		if (looksAliveTimestamp) {
			let timestamp = new Date().getTime();
			let diff = timestamp - looksAliveTimestamp;

			if (diff > isAliveTimespan) {
				if (debug.enabled) {
					debug(`Is online: ${diff / 1000 / 60}min passed without reset`);
				}
				publishState({
					online: true,
					state: 1
				});
				waitTime = waitTimeWhenOnline;
			} else if (debug.enabled) {
				debug(`Appears online: assurance in ${(isAliveTimespan - diff) / 1000}sec...`);
			}
		}
		setTimeout(probe, waitTime);
	});
}

function publishState(stateMsg) {
	if (stateMsg.state) {
		if (lastState === stateMsg.state) {
			// Do not send same state repetitively
			return;
		}
		lastState = stateMsg.state;
	}
	const msg = JSON.stringify(stateMsg);
	mqttClient.publish(mqttTopic, msg, {
		qos: 2, // must arrive and must arrive exactly once - also ensures order
		retain: true
	});
}

mqttClient.on("connect", function() {
	probe();
});
