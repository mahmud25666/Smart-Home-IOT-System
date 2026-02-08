# Smart Home Simulation System

A complete software simulation of a smart room environment with IoT architecture, device control, sensor monitoring, and automation rules.

![Dashboard Preview](assets/screenshots/dashboard.png)

## 🚀 Quick Start

Simply open `index.html` in any modern web browser - no server or installation required!

```bash
# On Windows, double-click index.html or:
start index.html

# Or use a local server for development:
npx serve .
```

## 🏠 Features

### Simulated Devices
- **3 Lights** - Individual brightness control, 60W each
- **Air Conditioner** - Cool/Heat/Auto modes, temperature control, 1500W
- **Water Heater** - Temperature control with heating simulation, 2000W

### Sensors
| Sensor | Range | Purpose |
|--------|-------|---------|
| Temperature | 15-40°C | HVAC control logic |
| Motion | On/Off | Occupancy detection |
| Humidity | 20-80% | HVAC behavior adjustment |
| Power | 0-5000W | Energy monitoring |
| Distance | 0-500cm | Presence detection |
| Light | 0-1000 lux | Ambient light level |

### Automation Rules
1. **HVAC Cooling** - AC turns on when temp > 26°C + motion detected
2. **HVAC Auto-Off** - AC turns off after 5 min of no motion
3. **Lights On** - Lights on when dark (< 300 lux) + motion detected
4. **Lights Off** - Lights off after 2 min of no motion
5. **Humidity Control** - AC mode adjustment for high humidity

### Dashboard Features
- Real-time power consumption charts
- Device power breakdown (pie chart)
- Manual sensor overrides for testing
- Automation activity log
- Responsive design for all screen sizes

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│                    (Dashboard - HTML/CSS/JS)                │
├─────────────────────────────────────────────────────────────┤
│                      IoT GATEWAY                            │
│              (Pub/Sub Message Broker)                       │
├──────────────────┬──────────────────┬───────────────────────┤
│  AUTOMATION      │     DEVICES      │       SENSORS         │
│  ENGINE          │                  │                       │
│  ┌─────────────┐ │ ┌──────────────┐ │ ┌───────────────────┐ │
│  │ HVAC Rules  │ │ │ Light 1,2,3  │ │ │ Temperature       │ │
│  │ Light Rules │ │ │ Air Cond.    │ │ │ Motion, Humidity  │ │
│  │ Humidity    │ │ │ Water Heater │ │ │ Power, Distance   │ │
│  └─────────────┘ │ └──────────────┘ │ │ Light             │ │
│                  │                  │ └───────────────────┘ │
└──────────────────┴──────────────────┴───────────────────────┘
```

## 📁 Project Structure

```
smart-home-simulation/
├── index.html          # Main dashboard
├── styles.css          # Premium dark theme
├── js/
│   ├── iot-gateway.js  # Central message broker
│   ├── devices.js      # Device classes
│   ├── sensors.js      # Sensor classes
│   ├── automation.js   # Rules engine
│   └── app.js          # Application entry
└── docs/
    ├── README.md       # This file
    └── diagrams.md     # Block diagrams
```

## 🎮 Usage Guide

### Manual Device Control
1. Click the toggle switch on any device card to turn it on/off
2. For lights: Use the brightness slider
3. For AC: Select mode (Cool/Heat/Auto) and adjust temperature
4. For Water Heater: Adjust target temperature

### Sensor Override (Testing)
Use the "Manual Sensor Override" buttons to test automation:
- **Trigger Motion** - Simulates someone entering the room
- **Set Hot (30°C)** - Tests HVAC cooling automation
- **Set Dark (100 lux)** - Tests lighting automation

### Automation Control
- Toggle each automation rule on/off individually
- View trigger count and activity log

## 🔧 Customization

### Adjusting Automation Thresholds
Edit `js/automation.js`:
```javascript
// Example: Change AC trigger temperature
this.temperatureThreshold = 28; // Default: 26

// Example: Change lights-off delay
this.thresholdMinutes = 5; // Default: 2
```

### Adding New Devices
Edit `js/devices.js`:
```javascript
const devices = {
    // ... existing devices
    newDevice: new Light('newDevice', 'New Light')
};
```

## 📊 Block Diagrams

See [docs/diagrams.md](docs/diagrams.md) for detailed system diagrams including:
- General Setup Block Diagram
- HVAC Implementation Block Diagram
- Lighting Implementation Block Diagram

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js
- **Architecture**: Simulated MQTT pub/sub pattern
- **Styling**: Custom CSS with CSS Variables

## 📝 License

This project is for educational and demonstration purposes.
