/**
 * Main Application Entry Point
 * Initializes all modules and starts the simulation
 */

// Simulation state
let simulationRunning = true;
let powerHistory = [];
let sensorIntervals = {};

// Initialize the application
function initializeApp() {
    console.log('🏠 Smart Home Simulation Starting...');

    // Register all devices with gateway
    Object.values(devices).forEach(device => {
        gateway.registerDevice(device);
    });

    // Register all sensors with gateway
    Object.values(sensors).forEach(sensor => {
        gateway.registerSensor(sensor);
    });

    // Subscribe to events for logging
    gateway.subscribe('*', (message, topic) => {
        console.log(`[${topic}]`, message);
    });

    // Initialize UI
    initializeUI();

    // Start simulation loops
    startSimulation();

    console.log('✅ Smart Home Simulation Ready!');
}

// Initialize UI components
function initializeUI() {
    // Render device controls
    renderDeviceControls();

    // Render sensor displays
    renderSensorDisplays();

    // Render automation rules
    renderAutomationRules();

    // Initialize charts
    initializeCharts();

    // Update UI periodically
    setInterval(updateUI, 1000);
}

// Render device control panels
function renderDeviceControls() {
    const container = document.getElementById('devices-container');
    if (!container) return;

    container.innerHTML = '';

    gateway.getAllDevices().forEach(device => {
        const state = device.getState();
        const card = createDeviceCard(state);
        container.appendChild(card);
    });
}

// Create device card element
function createDeviceCard(state) {
    const card = document.createElement('div');
    card.className = `device-card ${state.isOn ? 'active' : ''}`;
    card.id = `device-${state.id}`;

    let controlsHTML = '';

    if (state.type === 'ac') {
        controlsHTML = `
            <div class="device-controls">
                <div class="mode-selector">
                    <button class="mode-btn ${state.mode === 'cool' ? 'active' : ''}" onclick="setACMode('cool')">❄️ Cool</button>
                    <button class="mode-btn ${state.mode === 'heat' ? 'active' : ''}" onclick="setACMode('heat')">🔥 Heat</button>
                    <button class="mode-btn ${state.mode === 'auto' ? 'active' : ''}" onclick="setACMode('auto')">🔄 Auto</button>
                </div>
                <div class="temp-control">
                    <button onclick="adjustACTemp(-1)">−</button>
                    <span class="target-temp">${state.targetTemperature}°C</span>
                    <button onclick="adjustACTemp(1)">+</button>
                </div>
            </div>
        `;
    } else if (state.type === 'waterHeater') {
        controlsHTML = `
            <div class="device-controls">
                <div class="water-temp">
                    <span class="label">Water Temp:</span>
                    <span class="value">${state.currentWaterTemp}°C</span>
                </div>
                <div class="temp-control">
                    <button onclick="adjustWaterHeaterTemp(-5)">−</button>
                    <span class="target-temp">Target: ${state.targetTemperature}°C</span>
                    <button onclick="adjustWaterHeaterTemp(5)">+</button>
                </div>
            </div>
        `;
    } else if (state.type === 'light') {
        controlsHTML = `
            <div class="device-controls">
                <div class="brightness-control">
                    <input type="range" min="0" max="100" value="${state.brightness}" 
                           onchange="setLightBrightness('${state.id}', this.value)">
                    <span>${state.brightness}%</span>
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="device-header">
            <div class="device-icon">${getDeviceIcon(state.type)}</div>
            <div class="device-info">
                <h3>${state.name}</h3>
                <span class="device-status">${state.isOn ? 'ON' : 'OFF'}</span>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" ${state.isOn ? 'checked' : ''} 
                       onchange="toggleDevice('${state.id}')">
                <span class="slider"></span>
            </label>
        </div>
        <div class="device-power">
            <span class="power-icon">⚡</span>
            <span class="power-value">${state.power.toFixed(0)} W</span>
        </div>
        ${controlsHTML}
    `;

    return card;
}

// Get device icon based on type
function getDeviceIcon(type) {
    const icons = {
        'light': '💡',
        'ac': '❄️',
        'waterHeater': '🚿'
    };
    return icons[type] || '📱';
}

// Render sensor displays
function renderSensorDisplays() {
    const container = document.getElementById('sensors-container');
    if (!container) return;

    container.innerHTML = '';

    gateway.getAllSensors().forEach(sensor => {
        const state = sensor.getState();
        const card = createSensorCard(state);
        container.appendChild(card);
    });
}

// Create sensor card element
function createSensorCard(state) {
    const card = document.createElement('div');
    card.className = 'sensor-card';
    card.id = `sensor-${state.id}`;

    let displayValue = state.value;
    if (typeof displayValue === 'number') {
        displayValue = displayValue.toFixed(1);
    } else if (typeof displayValue === 'boolean') {
        displayValue = displayValue ? 'Detected' : 'No Motion';
    }

    card.innerHTML = `
        <div class="sensor-icon">${getSensorIcon(state.id)}</div>
        <div class="sensor-info">
            <h4>${state.name}</h4>
            <div class="sensor-value">
                <span class="value">${displayValue}</span>
                <span class="unit">${state.unit}</span>
            </div>
        </div>
        <div class="sensor-indicator ${getSensorIndicatorClass(state)}"></div>
    `;

    return card;
}

// Get sensor icon
function getSensorIcon(id) {
    const icons = {
        'temperature': '🌡️',
        'motion': '🚶',
        'humidity': '💧',
        'power': '⚡',
        'distance': '📏',
        'light': '☀️'
    };
    return icons[id] || '📊';
}

// Get sensor indicator class
function getSensorIndicatorClass(state) {
    switch (state.id) {
        case 'temperature':
            return state.value > 26 ? 'hot' : state.value < 20 ? 'cold' : 'normal';
        case 'motion':
            return state.value ? 'active' : 'inactive';
        case 'humidity':
            return state.value > 70 ? 'high' : state.value < 30 ? 'low' : 'normal';
        case 'light':
            return state.value < 300 ? 'low' : 'normal';
        default:
            return 'normal';
    }
}

// Render automation rules
function renderAutomationRules() {
    const container = document.getElementById('automation-container');
    if (!container) return;

    container.innerHTML = '';

    automationEngine.getAllRules().forEach(rule => {
        const card = createAutomationCard(rule);
        container.appendChild(card);
    });
}

// Create automation card
function createAutomationCard(rule) {
    const card = document.createElement('div');
    card.className = `automation-card ${rule.enabled ? 'enabled' : 'disabled'}`;
    card.id = `rule-${rule.id}`;

    card.innerHTML = `
        <div class="rule-info">
            <h4>${rule.name}</h4>
            <p>${rule.description}</p>
            <span class="trigger-count">Triggered: ${rule.triggerCount} times</span>
        </div>
        <label class="toggle-switch">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} 
                   onchange="toggleRule('${rule.id}')">
            <span class="slider"></span>
        </label>
    `;

    return card;
}

// Initialize charts
let powerChart, sensorChart;

function initializeCharts() {
    // Power consumption chart
    const powerCtx = document.getElementById('power-chart');
    if (powerCtx) {
        powerChart = new Chart(powerCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Power (W)',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#aaa'
                        }
                    }
                }
            }
        });
    }

    // Power breakdown pie chart
    const breakdownCtx = document.getElementById('power-breakdown-chart');
    if (breakdownCtx) {
        powerBreakdownChart = new Chart(breakdownCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#00d4ff',
                        '#ff6b6b',
                        '#4ecdc4',
                        '#ffe66d',
                        '#c44569'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            padding: 10
                        }
                    }
                }
            }
        });
    }
}

// Update UI
function updateUI() {
    // Update sensor values
    gateway.getAllSensors().forEach(sensor => {
        const state = sensor.getState();
        const card = document.getElementById(`sensor-${state.id}`);
        if (card) {
            let displayValue = state.value;
            if (typeof displayValue === 'number') {
                displayValue = displayValue.toFixed(1);
            } else if (typeof displayValue === 'boolean') {
                displayValue = displayValue ? 'Detected' : 'No Motion';
            }

            const valueEl = card.querySelector('.value');
            if (valueEl) valueEl.textContent = displayValue;

            const indicator = card.querySelector('.sensor-indicator');
            if (indicator) {
                indicator.className = `sensor-indicator ${getSensorIndicatorClass(state)}`;
            }
        }
    });

    // Update device states
    gateway.getAllDevices().forEach(device => {
        const state = device.getState();
        const card = document.getElementById(`device-${state.id}`);
        if (card) {
            card.className = `device-card ${state.isOn ? 'active' : ''}`;

            const statusEl = card.querySelector('.device-status');
            if (statusEl) statusEl.textContent = state.isOn ? 'ON' : 'OFF';

            const powerEl = card.querySelector('.power-value');
            if (powerEl) powerEl.textContent = `${state.power.toFixed(0)} W`;

            // Update water heater temperature
            if (state.type === 'waterHeater') {
                const waterTempEl = card.querySelector('.water-temp .value');
                if (waterTempEl) waterTempEl.textContent = `${state.currentWaterTemp}°C`;
            }
        }
    });

    // Update total power
    const totalPower = gateway.getTotalPowerConsumption();
    const totalEl = document.getElementById('total-power');
    if (totalEl) totalEl.textContent = `${totalPower.toFixed(0)} W`;

    // Update large total power display in energy section
    const totalLargeEl = document.getElementById('total-power-large');
    if (totalLargeEl) totalLargeEl.textContent = `${totalPower.toFixed(0)} W`;

    // Update active devices count
    const activeDevices = gateway.getAllDevices().filter(d => d.isOn).length;
    const activeDevicesEl = document.getElementById('active-devices');
    if (activeDevicesEl) activeDevicesEl.textContent = activeDevices;

    // Update power chart
    if (powerChart) {
        const now = new Date().toLocaleTimeString();
        powerChart.data.labels.push(now);
        powerChart.data.datasets[0].data.push(totalPower);

        // Keep last 30 data points
        if (powerChart.data.labels.length > 30) {
            powerChart.data.labels.shift();
            powerChart.data.datasets[0].data.shift();
        }

        powerChart.update('none');
    }

    // Update power breakdown chart
    if (powerBreakdownChart) {
        const breakdown = gateway.getPowerBreakdown();
        const activeDevices = breakdown.filter(d => d.power > 0);

        powerBreakdownChart.data.labels = activeDevices.map(d => d.name);
        powerBreakdownChart.data.datasets[0].data = activeDevices.map(d => d.power);
        powerBreakdownChart.update('none');
    }

    // Update automation rules
    automationEngine.getAllRules().forEach(rule => {
        const card = document.getElementById(`rule-${rule.id}`);
        if (card) {
            card.className = `automation-card ${rule.enabled ? 'enabled' : 'disabled'}`;
            const countEl = card.querySelector('.trigger-count');
            if (countEl) countEl.textContent = `Triggered: ${rule.triggerCount} times`;
        }
    });

    // Update activity log
    updateActivityLog();
}

// Update activity log
function updateActivityLog() {
    const logContainer = document.getElementById('activity-log');
    if (!logContainer) return;

    const logs = automationEngine.getActivityLog();

    logContainer.innerHTML = logs.slice(-10).reverse().map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `<div class="log-entry">
            <span class="log-time">${time}</span>
            <span class="log-rule">${log.ruleName}</span>
        </div>`;
    }).join('');
}

// Start simulation
function startSimulation() {
    // Sensor update loop
    setInterval(() => {
        if (!simulationRunning) return;

        Object.values(sensors).forEach(sensor => {
            sensor.simulate();
        });

        // Update water heater simulation
        devices.waterHeater.update();

    }, 2000);

    // Automation evaluation loop
    setInterval(() => {
        if (!simulationRunning) return;

        automationEngine.evaluate();

    }, 2000);
}

// Device control functions
function toggleDevice(id) {
    const device = gateway.getDevice(id);
    if (device) {
        device.toggle();
        updateDeviceCard(id);
    }
}

function updateDeviceCard(id) {
    const device = gateway.getDevice(id);
    if (device) {
        const state = device.getState();
        const container = document.getElementById('devices-container');
        const oldCard = document.getElementById(`device-${id}`);
        const newCard = createDeviceCard(state);

        if (oldCard && container) {
            container.replaceChild(newCard, oldCard);
        }
    }
}

function setACMode(mode) {
    devices.ac.setMode(mode);
    updateDeviceCard('ac');
}

function adjustACTemp(delta) {
    const newTemp = devices.ac.targetTemperature + delta;
    devices.ac.setTargetTemperature(newTemp);
    updateDeviceCard('ac');
}

function adjustWaterHeaterTemp(delta) {
    const newTemp = devices.waterHeater.targetTemperature + delta;
    devices.waterHeater.setTargetTemperature(newTemp);
    updateDeviceCard('waterHeater');
}

function setLightBrightness(id, brightness) {
    const device = gateway.getDevice(id);
    if (device && device.setBrightness) {
        device.setBrightness(parseInt(brightness));
    }
}

function toggleRule(id) {
    automationEngine.toggleRule(id);
    renderAutomationRules();
}

// Simulation controls
function toggleSimulation() {
    simulationRunning = !simulationRunning;
    const btn = document.getElementById('sim-toggle');
    if (btn) {
        btn.textContent = simulationRunning ? '⏸️ Pause' : '▶️ Resume';
        btn.className = `sim-btn ${simulationRunning ? 'running' : 'paused'}`;
    }
}

// Manual sensor override
function setMotionDetected(detected) {
    sensors.motion.setValue(detected);
}

function setTemperature(temp) {
    sensors.temperature.setValue(temp);
}

function setAmbientLight(lux) {
    sensors.light.setValue(lux);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
