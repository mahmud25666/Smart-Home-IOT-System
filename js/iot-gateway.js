/**
 * IoT Gateway - Central Message Broker
 * Handles pub/sub communication between sensors, devices, and UI
 */
class IoTGateway {
    constructor() {
        this.subscribers = new Map();
        this.devices = new Map();
        this.sensors = new Map();
        this.messageLog = [];
    }

    // Subscribe to a topic
    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic).push(callback);
    }

    // Publish message to topic
    publish(topic, message) {
        const timestamp = Date.now();
        const logEntry = { topic, message, timestamp };
        this.messageLog.push(logEntry);
        
        // Keep only last 100 messages
        if (this.messageLog.length > 100) {
            this.messageLog.shift();
        }

        // Notify all subscribers
        if (this.subscribers.has(topic)) {
            this.subscribers.get(topic).forEach(callback => {
                callback(message, topic);
            });
        }

        // Wildcard subscribers
        if (this.subscribers.has('*')) {
            this.subscribers.get('*').forEach(callback => {
                callback(message, topic);
            });
        }
    }

    // Register a device
    registerDevice(device) {
        this.devices.set(device.id, device);
        device.gateway = this;
        this.publish('device/registered', { deviceId: device.id, name: device.name });
    }

    // Register a sensor
    registerSensor(sensor) {
        this.sensors.set(sensor.id, sensor);
        sensor.gateway = this;
        this.publish('sensor/registered', { sensorId: sensor.id, name: sensor.name });
    }

    // Get device by ID
    getDevice(id) {
        return this.devices.get(id);
    }

    // Get sensor by ID
    getSensor(id) {
        return this.sensors.get(id);
    }

    // Get all devices
    getAllDevices() {
        return Array.from(this.devices.values());
    }

    // Get all sensors
    getAllSensors() {
        return Array.from(this.sensors.values());
    }

    // Get all sensor readings
    getSensorReadings() {
        const readings = {};
        this.sensors.forEach((sensor, id) => {
            readings[id] = {
                name: sensor.name,
                value: sensor.value,
                unit: sensor.unit
            };
        });
        return readings;
    }

    // Get total power consumption
    getTotalPowerConsumption() {
        let total = 0;
        this.devices.forEach(device => {
            total += device.getCurrentPowerConsumption();
        });
        return total;
    }

    // Get power consumption by device
    getPowerBreakdown() {
        const breakdown = [];
        this.devices.forEach(device => {
            breakdown.push({
                id: device.id,
                name: device.name,
                power: device.getCurrentPowerConsumption(),
                isOn: device.isOn
            });
        });
        return breakdown;
    }

    // Get message log
    getMessageLog() {
        return this.messageLog.slice(-20);
    }
}

// Export singleton instance
const gateway = new IoTGateway();
