# mqtt-online-check
Check for internet connectivity and publish the status via MQTT.

Makes use of [is-online](https://github.com/sindresorhus/is-online). A future enhancement might be to integrate regular speed tests.

## Usage
mqtt-traffic can be configured using environment variables:

- **MQTT_ONLINE_CHECK_MQTT_BROKER:** URL of your MQTT broker, e.g. `mqtt://test.mosquitto.org`
- **MQTT_ONLINE_CHECK_MQTT_TOPIC_PREFIX:** MQTT topic prefix to publish states on, e.g. `Home/Internet/`
- **MQTT_ONLINE_CHECK_MQTT_ERROR_TOPIC:** *(optional)* MQTT topic to publish error messages on, e.g. `Error/OnlineCheck`

## Docker Image
A Docker image for the **armhf** architecture (Raspberry Pi et al.) is available on [Docker Hub](https://hub.docker.com/r/randombyte/armhf-mqtt-online-check).

## Example

### Option 1: Docker
````sh
docker run --rm -it \
-e MQTT_ONLINE_CHECK_MQTT_BROKER="mqtt://test.mosquitto.org" \
-e MQTT_ONLINE_CHECK_MQTT_TOPIC_PREFIX="Home/Internet/" \
-e MQTT_ONLINE_CHECK_MQTT_ERROR_TOPIC="Error/OnlineCheck" \
randombyte/armhf-mqtt-online-check:latest
````

### Option 2: Source
````sh
MQTT_ONLINE_CHECK_MQTT_BROKER="mqtt://test.mosquitto.org" \
MQTT_ONLINE_CHECK_MQTT_TOPIC_PREFIX="Home/Internet/" \
MQTT_ONLINE_CHECK_MQTT_ERROR_TOPIC="Error/OnlineCheck" \
npm start
````

### MQTT Message Examples

| Topic        | Payload
| ------------- |-------------|
| `Home/Internet/Connectivity` | `1` (online) |
| `Home/Internet/Connectivity` | `0` (offline) |

## License
Released under the [MIT License](https://opensource.org/licenses/MIT).
