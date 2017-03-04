const ping = require("ping");
const beep = require("beepbeep");
const host = "google.com";
const deadThreshold = 20;
const isAliveTimespan = 300000;
let deadCount = 0;
let aliveCount = 0;
let looksAliveTimestamp = 0;

function probeHost(hostname) {
	return ping.promise.probe(hostname).then(function(res) {
		let status = res.alive ? `alive (${res.time}ms)` : "dead";
		console.log(`${res.host} (${res.numeric_host}) is: ${status}`);
		return res.alive;
	});
}

function probe() {
	probeHost(host).then(function(alive) {
		if (!alive) {
			if (deadCount < deadThreshold) {
				deadCount++;
			} else {
				deadCount = 0;
				aliveCount = 0;
				looksAliveTimestamp = 0;
			}
		} else {
			aliveCount++;
		}
		console.log(`Alive count: ${aliveCount} | Dead count buffer: ${deadCount}/${deadThreshold}`);
		if (aliveCount > 100) {
			console.log("======== Looks alive ========");
			if (!looksAliveTimestamp) {
				console.log("Setting timestamp");
				looksAliveTimestamp = new Date().getTime();
			}
		}
		if (looksAliveTimestamp) {
			let timestamp = new Date().getTime();
			let diff = timestamp - looksAliveTimestamp;

			if (diff > isAliveTimespan) {
				console.log(`======== Is alive (${diff / 1000 / 60}min passed without reset)========`);
				beep(1000);
			} else {
				console.log(`Assurance in ${(isAliveTimespan - diff) / 1000}sec...`);
			}
		}
		setTimeout(probe, 100);
	});
}

probe();
