/**
 * Device Classes for Smart Home Simulation
 */

// Base Device Class
class Device {
    constructor(id, name, maxPowerWatts) {
        this.id = id;
        this.name = name;
        this.isOn = false;
        this.maxPowerWatts = maxPowerWatts;
        this.gateway = null;
    }

    turnOn() {
        if (!this.isOn) {
            this.isOn = true;
            this.onStateChange();
        }
    }

    turnOff() {
        if (this.isOn) {
            this.isOn = false;
            this.onStateChange();
        }
    }

    toggle() {
        this.isOn ? this.turnOff() : this.turnOn();
    }

    getCurrentPowerConsumption() {
        return this.isOn ? this.maxPowerWatts : 0;
    }

    onStateChange() {
        if (this.gateway) {
            this.gateway.publish(`device/${this.id}/state`, {
                id: this.id,
                name: this.name,
                isOn: this.isOn,
                power: this.getCurrentPowerConsumption()
            });
        }
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            isOn: this.isOn,
            power: this.getCurrentPowerConsumption(),
            maxPower: this.maxPowerWatts
        };
    }
}

// Light Device
class Light extends Device {
    constructor(id, name) {
        super(id, name, 60); // 60W LED equivalent
        this.brightness = 100; // 0-100%
    }

    setBrightness(level) {
        this.brightness = Math.max(0, Math.min(100, level));
        if (this.gateway) {
            this.gateway.publish(`device/${this.id}/brightness`, {
                id: this.id,
                brightness: this.brightness
            });
        }
    }

    getCurrentPowerConsumption() {
        if (!this.isOn) return 0;
        return (this.maxPowerWatts * this.brightness) / 100;
    }

    getState() {
        return {
            ...super.getState(),
            brightness: this.brightness,
            type: 'light'
        };
    }
}

// Air Conditioner Device
class AirConditioner extends Device {
    constructor(id, name) {
        super(id, name, 1500); // 1500W
        this.mode = 'cool'; // cool, heat, auto, fan
        this.targetTemperature = 24;
        this.fanSpeed = 'auto'; // low, medium, high, auto
    }

    setMode(mode) {
        const validModes = ['cool', 'heat', 'auto', 'fan'];
        if (validModes.includes(mode)) {
            this.mode = mode;
            if (this.gateway) {
                this.gateway.publish(`device/${this.id}/mode`, {
                    id: this.id,
                    mode: this.mode
                });
            }
        }
    }

    setTargetTemperature(temp) {
        this.targetTemperature = Math.max(16, Math.min(30, temp));
        if (this.gateway) {
            this.gateway.publish(`device/${this.id}/target-temp`, {
                id: this.id,
                targetTemperature: this.targetTemperature
            });
        }
    }

    setFanSpeed(speed) {
        const validSpeeds = ['low', 'medium', 'high', 'auto'];
        if (validSpeeds.includes(speed)) {
            this.fanSpeed = speed;
        }
    }

    getCurrentPowerConsumption() {
        if (!this.isOn) return 0;
        // Simulate variable power based on mode
        const modeMultiplier = {
            'cool': 1.0,
            'heat': 1.2,
            'auto': 0.8,
            'fan': 0.1
        };
        return this.maxPowerWatts * (modeMultiplier[this.mode] || 1);
    }

    getState() {
        return {
            ...super.getState(),
            mode: this.mode,
            targetTemperature: this.targetTemperature,
            fanSpeed: this.fanSpeed,
            type: 'ac'
        };
    }
}

// Water Heater Device
class WaterHeater extends Device {
    constructor(id, name) {
        super(id, name, 2000); // 2000W
        this.targetTemperature = 50; // degrees C
        this.currentWaterTemp = 25;
        this.isHeating = false;
    }

    setTargetTemperature(temp) {
        this.targetTemperature = Math.max(30, Math.min(70, temp));
        if (this.gateway) {
            this.gateway.publish(`device/${this.id}/target-temp`, {
                id: this.id,
                targetTemperature: this.targetTemperature
            });
        }
    }

    // Simulate water heating
    update() {
        if (this.isOn) {
            if (this.currentWaterTemp < this.targetTemperature) {
                this.currentWaterTemp += 0.5;
                this.isHeating = true;
            } else {
                this.isHeating = false;
            }
        } else {
            // Cool down slowly when off
            if (this.currentWaterTemp > 25) {
                this.currentWaterTemp -= 0.1;
            }
            this.isHeating = false;
        }
    }

    getCurrentPowerConsumption() {
        if (!this.isOn) return 0;
        // Only consume power when actively heating
        return this.isHeating ? this.maxPowerWatts : 50; // 50W standby
    }

    getState() {
        return {
            ...super.getState(),
            targetTemperature: this.targetTemperature,
            currentWaterTemp: Math.round(this.currentWaterTemp * 10) / 10,
            isHeating: this.isHeating,
            type: 'waterHeater'
        };
    }
}

// Create device instances
const devices = {
    light1: new Light('light1', 'Living Room Light'),
    light2: new Light('light2', 'Bedroom Light'),
    light3: new Light('light3', 'Kitchen Light'),
    ac: new AirConditioner('ac', 'Air Conditioner'),
    waterHeater: new WaterHeater('waterHeater', 'Water Heater')
};
