# mqtt-online-check
Check for internet connectivity and publish the status via MQTT.

Makes use of [is-online](https://github.com/sindresorhus/is-online).

## Usage
mqtt-traffic can be configured using environment variables:

- **MQTT_ONLINE_CHECK_MQTT_BROKER:** URL of your MQTT broker, e.g. `mqtt://test.mosquitto.org`
- **MQTT_ONLINE_CHECK_MQTT_TOPIC:** MQTT topic to publish the state on, e.g. `Internet/Connectivity`

## Docker Image
A Docker image for the **armhf** architecture (Raspberry Pi et al.) is available on [Docker Hub](https://hub.docker.com/r/randombyte/mqtt-online-check).

## Example

### Option 1: Docker
````sh
docker run --rm -it \
-e MQTT_ONLINE_CHECK_MQTT_BROKER="mqtt://test.mosquitto.org" \
-e MQTT_ONLINE_CHECK_MQTT_TOPIC="Internet/Connectivity" \
randombyte/mqtt-online-check:latest
````

### Option 2: Source
````sh
MQTT_ONLINE_CHECK_MQTT_BROKER="mqtt://test.mosquitto.org" \
MQTT_ONLINE_CHECK_MQTT_TOPIC="Internet/Connectivity" \
npm start
````

### MQTT Message Examples

| Topic        | Payload
| ------------- |-------------|
| `Internet/Connectivity` | `1` (online) |
| `Internet/Connectivity` | `0` (offline) |

## License
Released under the [MIT License](https://opensource.org/licenses/MIT).
