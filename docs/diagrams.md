# Smart Home Simulation - Block Diagrams

## 1. General Setup Block Diagram

This diagram shows the overall system architecture and data flow between all components.

```mermaid
graph TB
    subgraph UI["👤 User Interface Layer"]
        Dashboard["Dashboard<br/>(HTML/CSS/JS)"]
        Controls["Device Controls"]
        Charts["Energy Charts"]
        SensorDisplay["Sensor Display"]
    end
    
    subgraph Gateway["🌐 IoT Gateway / Controller"]
        MessageBroker["Message Broker<br/>(Pub/Sub)"]
        DeviceRegistry["Device Registry"]
        SensorRegistry["Sensor Registry"]
    end
    
    subgraph Automation["⚙️ Automation Layer"]
        RulesEngine["Rules Engine"]
        HVACRules["HVAC Rules"]
        LightRules["Lighting Rules"]
    end
    
    subgraph Sensors["📡 Sensor Layer"]
        TempSensor["🌡️ Temperature<br/>15-40°C"]
        MotionSensor["🚶 Motion<br/>Detected/Not"]
        HumiditySensor["💧 Humidity<br/>20-80%"]
        PowerSensor["⚡ Power<br/>0-5000W"]
        DistanceSensor["📏 Distance<br/>0-500cm"]
        LightSensor["☀️ Light<br/>0-1000 lux"]
    end
    
    subgraph Devices["💡 Device Layer"]
        Light1["💡 Light 1<br/>60W"]
        Light2["💡 Light 2<br/>60W"]
        Light3["💡 Light 3<br/>60W"]
        AC["❄️ Air Conditioner<br/>1500W"]
        WaterHeater["🚿 Water Heater<br/>2000W"]
    end
    
    Dashboard <--> MessageBroker
    Controls --> MessageBroker
    MessageBroker --> Charts
    MessageBroker --> SensorDisplay
    
    MessageBroker <--> DeviceRegistry
    MessageBroker <--> SensorRegistry
    MessageBroker <--> RulesEngine
    
    RulesEngine --> HVACRules
    RulesEngine --> LightRules
    
    DeviceRegistry --> Light1 & Light2 & Light3 & AC & WaterHeater
    SensorRegistry --> TempSensor & MotionSensor & HumiditySensor & PowerSensor & DistanceSensor & LightSensor
    
    HVACRules -.->|"Control"| AC
    LightRules -.->|"Control"| Light1 & Light2 & Light3
    
    TempSensor & MotionSensor & HumiditySensor -->|"Readings"| RulesEngine
    LightSensor & MotionSensor -->|"Readings"| RulesEngine
```

### Data Flow Description

1. **Sensors** continuously publish readings to the IoT Gateway
2. **IoT Gateway** broadcasts sensor data to:
   - Dashboard for visualization
   - Automation Rules Engine for evaluation
3. **Rules Engine** evaluates conditions and sends commands to devices
4. **Devices** receive commands and update their state
5. **Dashboard** displays real-time device states and sensor readings

---

## 2. HVAC Block Diagram Implementation

Detailed view of the HVAC automation logic with temperature, humidity, and motion sensors controlling the air conditioner.

```mermaid
flowchart TB
    subgraph Sensors["📡 HVAC Sensors"]
        Temp["🌡️ Temperature Sensor<br/>Current: 25°C"]
        Motion["🚶 Motion Sensor<br/>Occupancy Detection"]
        Humidity["💧 Humidity Sensor<br/>Current: 50%"]
    end
    
    subgraph Logic["⚙️ HVAC Control Logic"]
        TempCheck{"Temperature<br/>> 26°C?"}
        MotionCheck{"Motion<br/>Detected?"}
        HumidityCheck{"Humidity<br/>> 70%?"}
        NoMotionTimer{"No Motion<br/>> 5 min?"}
    end
    
    subgraph Actions["🎯 Control Actions"]
        ACOn["Turn AC ON<br/>Mode: Cool"]
        ACOff["Turn AC OFF"]
        HighFan["Set High Fan<br/>Dehumidify"]
    end
    
    subgraph Device["❄️ Air Conditioner"]
        ACState["Current State"]
        ACMode["Mode: Cool/Heat/Auto"]
        ACPower["Power: 1500W"]
    end
    
    subgraph Monitor["📊 Energy Monitor"]
        PowerConsumption["⚡ Power Consumption<br/>Real-time Display"]
        History["📈 Usage History"]
    end
    
    Temp --> TempCheck
    Motion --> MotionCheck
    Motion --> NoMotionTimer
    Humidity --> HumidityCheck
    
    TempCheck -->|"Yes"| MotionCheck
    MotionCheck -->|"Yes"| ACOn
    TempCheck -->|"No"| HumidityCheck
    MotionCheck -->|"No"| NoMotionTimer
    NoMotionTimer -->|"Yes"| ACOff
    HumidityCheck -->|"Yes"| HighFan
    
    ACOn --> ACState
    ACOff --> ACState
    HighFan --> ACMode
    
    ACState --> ACPower
    ACPower --> PowerConsumption
    PowerConsumption --> History
```

### HVAC Logic Rules

| Rule | Condition | Action |
|------|-----------|--------|
| **Cooling** | Temp > 26°C AND Motion Detected | AC ON (Cool mode) |
| **Auto-Off** | No Motion for 5 minutes | AC OFF |
| **Humidity** | Humidity > 70% AND AC is ON | Set High Fan |

### Power Consumption

- **Cooling Mode**: 1500W
- **Heating Mode**: 1800W (1.2x multiplier)
- **Fan Only**: 150W (0.1x multiplier)
- **Auto Mode**: 1200W (0.8x multiplier)

---

## 3. Lighting Block Diagram Implementation

Detailed view of the lighting automation logic with motion and ambient light sensors controlling the room lights.

```mermaid
flowchart TB
    subgraph Sensors["📡 Lighting Sensors"]
        LightSensor["☀️ Light Sensor<br/>Ambient: 300 lux"]
        MotionSensor["🚶 Motion Sensor<br/>Occupancy"]
    end
    
    subgraph Logic["⚙️ Lighting Control Logic"]
        LightCheck{"Ambient Light<br/>< 300 lux?"}
        MotionCheck{"Motion<br/>Detected?"}
        NoMotionTimer{"No Motion<br/>> 2 min?"}
        AnyLightOn{"Any Light<br/>Currently ON?"}
    end
    
    subgraph Actions["🎯 Control Actions"]
        LightsOn["Turn Lights ON<br/>(Living + Bedroom)"]
        LightsOff["Turn ALL Lights OFF"]
    end
    
    subgraph Devices["💡 Light Devices"]
        Light1["💡 Living Room<br/>60W | Brightness: 100%"]
        Light2["💡 Bedroom<br/>60W | Brightness: 100%"]
        Light3["💡 Kitchen<br/>60W | Brightness: 100%"]
    end
    
    subgraph Monitor["📊 Energy Monitor"]
        TotalPower["⚡ Total: 0-180W"]
        Breakdown["📊 Per-Light Usage"]
    end
    
    LightSensor --> LightCheck
    MotionSensor --> MotionCheck
    MotionSensor --> NoMotionTimer
    
    LightCheck -->|"Yes (Dark)"| MotionCheck
    MotionCheck -->|"Yes"| AnyLightOn
    AnyLightOn -->|"No"| LightsOn
    
    LightCheck -->|"No (Bright)"| NoMotionTimer
    MotionCheck -->|"No"| NoMotionTimer
    NoMotionTimer -->|"Yes"| LightsOff
    
    LightsOn --> Light1
    LightsOn --> Light2
    LightsOff --> Light1 & Light2 & Light3
    
    Light1 & Light2 & Light3 --> TotalPower
    TotalPower --> Breakdown
```

### Lighting Logic Rules

| Rule | Condition | Action |
|------|-----------|--------|
| **Lights On** | Ambient Light < 300 lux AND Motion Detected AND All Lights OFF | Turn ON Living + Bedroom Lights |
| **Lights Off** | No Motion for 2 minutes AND Any Light ON | Turn OFF All Lights |

### Power Consumption per Light

| Light | Max Power | With Brightness |
|-------|-----------|-----------------|
| Living Room | 60W | 60W × (brightness/100) |
| Bedroom | 60W | 60W × (brightness/100) |
| Kitchen | 60W | 60W × (brightness/100) |
| **Max Total** | **180W** | Variable |

---

## 4. System Integration Diagram

Shows how all components integrate and communicate in real-time.

```mermaid
sequenceDiagram
    participant U as User/Dashboard
    participant G as IoT Gateway
    participant S as Sensors
    participant R as Rules Engine
    participant D as Devices
    
    Note over S: Sensors update every 2s
    
    loop Every 2 seconds
        S->>G: Publish sensor readings
        G->>U: Update sensor display
        G->>R: Forward to automation
        
        R->>R: Evaluate rules
        
        alt Rule triggered
            R->>G: Device command
            G->>D: Execute command
            D->>G: State update
            G->>U: Update device display
            G->>U: Log activity
        end
    end
    
    U->>G: Manual control (toggle device)
    G->>D: Execute command
    D->>G: State update
    G->>U: Update display
```

---

## Viewing These Diagrams

These diagrams are written in Mermaid.js format. To view them:

1. **In VS Code**: Install "Markdown Preview Mermaid Support" extension
2. **Online**: Paste into [Mermaid Live Editor](https://mermaid.live)
3. **In GitHub**: Diagrams render automatically in markdown files
4. **Export as Image**: Use Mermaid Live Editor to export PNG/SVG
