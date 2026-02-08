/**
 * Automation Rules Engine
 * Handles HVAC and Lighting automation based on sensor readings
 */

class AutomationRule {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.enabled = true;
        this.lastTriggered = null;
        this.triggerCount = 0;
    }

    evaluate() {
        // Override in subclasses
        return false;
    }

    execute() {
        // Override in subclasses
    }

    run() {
        if (!this.enabled) return false;

        if (this.evaluate()) {
            this.execute();
            this.lastTriggered = Date.now();
            this.triggerCount++;
            return true;
        }
        return false;
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            enabled: this.enabled,
            lastTriggered: this.lastTriggered,
            triggerCount: this.triggerCount
        };
    }
}

// HVAC Automation: Turn on AC when hot and motion detected
class HVACCoolingRule extends AutomationRule {
    constructor() {
        super(
            'hvac-cooling',
            'HVAC Cooling',
            'Turn on AC when temperature > 26°C and motion is detected'
        );
        this.temperatureThreshold = 26;
    }

    evaluate() {
        const temp = sensors.temperature.value;
        const motion = sensors.motion.value;
        const acIsOff = !devices.ac.isOn;

        return temp > this.temperatureThreshold && motion && acIsOff;
    }

    execute() {
        devices.ac.setMode('cool');
        devices.ac.turnOn();

        if (gateway) {
            gateway.publish('automation/triggered', {
                rule: this.id,
                action: 'AC turned on (cooling mode)',
                reason: `Temperature: ${sensors.temperature.value.toFixed(1)}°C, Motion: detected`
            });
        }
    }
}

// HVAC Automation: Turn off AC when no motion
class HVACOffRule extends AutomationRule {
    constructor() {
        super(
            'hvac-off',
            'HVAC Auto-Off',
            'Turn off AC after 5 minutes of no motion'
        );
        this.noMotionDuration = 0;
        this.thresholdMinutes = 5;
    }

    evaluate() {
        const motion = sensors.motion.value;
        const acIsOn = devices.ac.isOn;

        if (!motion && acIsOn) {
            this.noMotionDuration += 2; // Increment by update interval (2 seconds)
            return this.noMotionDuration >= this.thresholdMinutes * 60;
        } else {
            this.noMotionDuration = 0;
            return false;
        }
    }

    execute() {
        devices.ac.turnOff();
        this.noMotionDuration = 0;

        if (gateway) {
            gateway.publish('automation/triggered', {
                rule: this.id,
                action: 'AC turned off',
                reason: `No motion for ${this.thresholdMinutes} minutes`
            });
        }
    }
}

// Lighting Automation: Turn on lights when dark and motion detected
class LightingOnRule extends AutomationRule {
    constructor() {
        super(
            'lighting-on',
            'Auto Lights On',
            'Turn on lights when ambient light < 300 lux and motion is detected'
        );
        this.lightThreshold = 300;
    }

    evaluate() {
        const ambientLight = sensors.light.value;
        const motion = sensors.motion.value;
        const allLightsOff = !devices.light1.isOn && !devices.light2.isOn && !devices.light3.isOn;

        return ambientLight < this.lightThreshold && motion && allLightsOff;
    }

    execute() {
        devices.light1.turnOn();
        devices.light2.turnOn();

        if (gateway) {
            gateway.publish('automation/triggered', {
                rule: this.id,
                action: 'Lights turned on',
                reason: `Ambient light: ${sensors.light.value.toFixed(0)} lux, Motion: detected`
            });
        }
    }
}

// Lighting Automation: Turn off lights when no motion
class LightingOffRule extends AutomationRule {
    constructor() {
        super(
            'lighting-off',
            'Auto Lights Off',
            'Turn off lights after 2 minutes of no motion'
        );
        this.noMotionDuration = 0;
        this.thresholdMinutes = 2;
    }

    evaluate() {
        const motion = sensors.motion.value;
        const anyLightOn = devices.light1.isOn || devices.light2.isOn || devices.light3.isOn;

        if (!motion && anyLightOn) {
            this.noMotionDuration += 2;
            return this.noMotionDuration >= this.thresholdMinutes * 60;
        } else {
            this.noMotionDuration = 0;
            return false;
        }
    }

    execute() {
        devices.light1.turnOff();
        devices.light2.turnOff();
        devices.light3.turnOff();
        this.noMotionDuration = 0;

        if (gateway) {
            gateway.publish('automation/triggered', {
                rule: this.id,
                action: 'Lights turned off',
                reason: `No motion for ${this.thresholdMinutes} minutes`
            });
        }
    }
}

// Humidity-based HVAC adjustment
class HumidityRule extends AutomationRule {
    constructor() {
        super(
            'humidity-control',
            'Humidity Control',
            'Adjust AC mode based on humidity levels'
        );
        this.highHumidityThreshold = 70;
    }

    evaluate() {
        const humidity = sensors.humidity.value;
        const acIsOn = devices.ac.isOn;

        return humidity > this.highHumidityThreshold && acIsOn;
    }

    execute() {
        // Set to cool mode for dehumidification
        devices.ac.setMode('cool');
        devices.ac.setFanSpeed('high');

        if (gateway) {
            gateway.publish('automation/triggered', {
                rule: this.id,
                action: 'AC set to high fan for dehumidification',
                reason: `Humidity: ${sensors.humidity.value.toFixed(1)}%`
            });
        }
    }
}

// Automation Engine
class AutomationEngine {
    constructor() {
        this.rules = new Map();
        this.activityLog = [];
        this.isRunning = false;
    }

    addRule(rule) {
        this.rules.set(rule.id, rule);
    }

    removeRule(id) {
        this.rules.delete(id);
    }

    enableRule(id) {
        const rule = this.rules.get(id);
        if (rule) rule.enabled = true;
    }

    disableRule(id) {
        const rule = this.rules.get(id);
        if (rule) rule.enabled = false;
    }

    toggleRule(id) {
        const rule = this.rules.get(id);
        if (rule) rule.enabled = !rule.enabled;
        return rule?.enabled;
    }

    evaluate() {
        this.rules.forEach((rule, id) => {
            const triggered = rule.run();
            if (triggered) {
                this.activityLog.push({
                    ruleId: id,
                    ruleName: rule.name,
                    timestamp: Date.now()
                });

                // Keep only last 50 entries
                if (this.activityLog.length > 50) {
                    this.activityLog.shift();
                }
            }
        });
    }

    getAllRules() {
        return Array.from(this.rules.values()).map(r => r.getState());
    }

    getActivityLog() {
        return this.activityLog.slice(-20);
    }
}

// Create automation engine instance and add rules
const automationEngine = new AutomationEngine();
automationEngine.addRule(new HVACCoolingRule());
automationEngine.addRule(new HVACOffRule());
automationEngine.addRule(new LightingOnRule());
automationEngine.addRule(new LightingOffRule());
automationEngine.addRule(new HumidityRule());
