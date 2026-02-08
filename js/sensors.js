/**
 * Sensor Classes for Smart Home Simulation
 */

// Base Sensor Class
class Sensor {
    constructor(id, name, unit, minValue, maxValue) {
        this.id = id;
        this.name = name;
        this.unit = unit;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.value = (minValue + maxValue) / 2;
        this.history = [];
        this.gateway = null;
        this.updateInterval = 2000; // ms
    }

    // Simulate value change
    simulate() {
        // Override in subclasses
    }

    // Update value and publish
    setValue(newValue) {
        this.value = Math.max(this.minValue, Math.min(this.maxValue, newValue));
        this.history.push({
            value: this.value,
            timestamp: Date.now()
        });

        // Keep last 60 readings
        if (this.history.length > 60) {
            this.history.shift();
        }

        if (this.gateway) {
            this.gateway.publish(`sensor/${this.id}/reading`, {
                id: this.id,
                name: this.name,
                value: this.value,
                unit: this.unit,
                timestamp: Date.now()
            });
        }
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            value: this.value,
            unit: this.unit,
            history: this.history.slice(-20)
        };
    }
}

// Temperature Sensor
class TemperatureSensor extends Sensor {
    constructor() {
        super('temperature', 'Temperature', '°C', 15, 40);
        this.value = 25;
        this.baseValue = 25;
        this.trend = 0;
    }

    simulate() {
        // Gradual random walk with mean reversion
        this.trend += (Math.random() - 0.5) * 0.3;
        this.trend *= 0.95; // Dampen trend

        let change = this.trend + (Math.random() - 0.5) * 0.2;
        let newValue = this.value + change;

        // Mean reversion toward base
        newValue += (this.baseValue - newValue) * 0.02;

        // If AC is on, temperature should decrease
        if (typeof devices !== 'undefined' && devices.ac && devices.ac.isOn) {
            if (devices.ac.mode === 'cool') {
                newValue -= 0.3;
            } else if (devices.ac.mode === 'heat') {
                newValue += 0.3;
            }
        }

        this.setValue(newValue);
    }
}

// Motion Sensor
class MotionSensor extends Sensor {
    constructor() {
        super('motion', 'Motion', '', 0, 1);
        this.value = false;
        this.lastMotionTime = Date.now();
        this.motionProbability = 0.7; // Probability of motion being detected
    }

    simulate() {
        // Simulate realistic motion patterns
        const now = Date.now();
        const timeSinceLastMotion = now - this.lastMotionTime;

        if (this.value) {
            // If motion is currently detected, small chance it stops
            if (Math.random() > 0.85) {
                this.setValue(false);
            }
        } else {
            // If no motion, chance of new motion based on probability
            if (Math.random() < this.motionProbability * 0.1) {
                this.setValue(true);
                this.lastMotionTime = now;
            }
        }
    }

    setValue(detected) {
        this.value = detected;
        if (this.gateway) {
            this.gateway.publish(`sensor/${this.id}/reading`, {
                id: this.id,
                name: this.name,
                value: this.value,
                detected: this.value,
                timestamp: Date.now()
            });
        }
    }

    getState() {
        return {
            ...super.getState(),
            detected: this.value
        };
    }
}

// Humidity Sensor
class HumiditySensor extends Sensor {
    constructor() {
        super('humidity', 'Humidity', '%', 20, 80);
        this.value = 50;
    }

    simulate() {
        // Gradual random walk
        let change = (Math.random() - 0.5) * 2;

        // Mean reversion
        change += (50 - this.value) * 0.01;

        this.setValue(this.value + change);
    }
}

// Power Consumption Sensor (aggregate)
class PowerSensor extends Sensor {
    constructor() {
        super('power', 'Power Consumption', 'W', 0, 5000);
        this.value = 0;
    }

    simulate() {
        // Calculate total power from all devices
        if (typeof gateway !== 'undefined') {
            this.setValue(gateway.getTotalPowerConsumption());
        }
    }
}

// Distance/Height Sensor
class DistanceSensor extends Sensor {
    constructor() {
        super('distance', 'Distance', 'cm', 0, 500);
        this.value = 200;
        this.objectPresent = false;
    }

    simulate() {
        // Simulate object presence/absence
        if (Math.random() < 0.05) {
            this.objectPresent = !this.objectPresent;
        }

        let targetValue = this.objectPresent ? 50 + Math.random() * 50 : 300 + Math.random() * 100;

        // Smooth transition
        this.setValue(this.value + (targetValue - this.value) * 0.2);
    }

    getState() {
        return {
            ...super.getState(),
            objectPresent: this.value < 100
        };
    }
}

// Light Sensor
class LightSensor extends Sensor {
    constructor() {
        super('light', 'Ambient Light', 'lux', 0, 1000);
        this.value = 300;
        this.timeOfDay = 'day'; // day, evening, night
    }

    simulate() {
        // Simulate ambient light based on time of day (use hour of actual time for demo)
        const hour = new Date().getHours();

        let baseLight;
        if (hour >= 6 && hour < 18) {
            baseLight = 500 + Math.random() * 300; // Day
            this.timeOfDay = 'day';
        } else if (hour >= 18 && hour < 21) {
            baseLight = 150 + Math.random() * 100; // Evening
            this.timeOfDay = 'evening';
        } else {
            baseLight = 20 + Math.random() * 30; // Night
            this.timeOfDay = 'night';
        }

        // Add light from indoor lights
        if (typeof devices !== 'undefined') {
            Object.values(devices).forEach(device => {
                if (device instanceof Light && device.isOn) {
                    baseLight += 50 * (device.brightness / 100);
                }
            });
        }

        // Smooth transition
        this.setValue(this.value + (baseLight - this.value) * 0.1);
    }

    getState() {
        return {
            ...super.getState(),
            timeOfDay: this.timeOfDay,
            isLow: this.value < 300
        };
    }
}

// Create sensor instances
const sensors = {
    temperature: new TemperatureSensor(),
    motion: new MotionSensor(),
    humidity: new HumiditySensor(),
    power: new PowerSensor(),
    distance: new DistanceSensor(),
    light: new LightSensor()
};
