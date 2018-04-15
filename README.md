# mqtt-online-check
Check for internet connectivity publish status changes via MQTT.

Might not be the best solution for this problem, but my provider does strange things with my connection.

## Usage
mqtt-traffic can be configured using environment variables:

- **MQTT_ONLINE_CHECK_HOSTNAME:** Hostname to check connectivity with, e.g. `google.com`
- **MQTT_ONLINE_CHECK_MQTT_BROKER:** URL of your MQTT broker, e.g. `mqtt://test.mosquitto.org`
- **MQTT_ONLINE_CHECK_MQTT_TOPIC:** MQTT topic to publish states on, e.g. `Home/Online`

### Example
````sh
MQTT_ONLINE_CHECK_HOSTNAME="google.com" \
MQTT_ONLINE_CHECK_MQTT_BROKER="mqtt://test.mosquitto.org" \
MQTT_ONLINE_CHECK_MQTT_TOPIC="Home/Online" \
npm start
````

### Payloads
#### Online
````json
{
    "state": 1,
    "online": true
}
````

#### Maybe Online
A lot of pings to the host succeeded, but we wait some more time (~5 minutes) until we are sure.

````json
{
    "state": 2
}
````

#### Offline
````json
{
    "state": 3,
    "online": false
}
````

#### Pings
We ping the host to check for internet connectivity. As soon as the `successfulPingsThreshold` is reached, we wait some more time (~5 minutes) until we are sure to be online.

If two state messages contain the same value of `successfulPings`, this indicates that a ping failed. If too many pings fail, the value for `successfulPings` gets reset to zero.

````json
{
    "successfulPings": 8,
    "successfulPingsThreshold": 10
}
````

## Docker Image
A Docker image for the **armhf** architecture (Raspberry Pi et al.) is available on [Docker Hub](https://hub.docker.com/r/randombyte/armhf-mqtt-online-check).

**Example:**
````sh
docker run --rm -it \
-e MQTT_ONLINE_CHECK_HOSTNAME="google.com" \
-e MQTT_ONLINE_CHECK_MQTT_BROKER="mqtt://test.mosquitto.org" \
-e MQTT_ONLINE_CHECK_MQTT_TOPIC="Home/Online" \
randombyte/armhf-mqtt-online-check:latest
````

## License
Released under the [MIT License](https://opensource.org/licenses/MIT).
