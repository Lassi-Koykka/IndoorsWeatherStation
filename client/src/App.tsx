import React, { useEffect, useState } from 'react';
import { Checkbox, CircularProgress, Button } from "@mui/material";
import { io, Socket } from "socket.io-client";
import './App.css';
const url = "http://localhost:8080"

const textfieldStyles: React.CSSProperties = {
  background: "none",
  border: "none",
  fontWeight: "bold",
  textAlign: "center",
  borderBottom: "2px solid white",
  fontSize: "calc(10px + 2vmin)",
  width: "100%",
  color: "white"
}

interface ISettings {
  minTemperature: number;
  maxTemperature: number;
  backlightOn: boolean;
}

interface IData {
  timestamp: number;
  temperature: number;
  humidity: number;
  heatIndex: number;
  minTemperature: number;
  maxTemperature: number;
  backlightOn: boolean;
}

const initialValues: IData = {
  timestamp: Math.round((new Date).getTime() / 1000),
  temperature: 0,
  humidity: 0,
  heatIndex: 0,
  minTemperature: 0,
  maxTemperature: 0,
  backlightOn: true
}

const areEqual = (o1: { [key: string]: any }, o2: { [key: string]: any }) => {
  return !Object.entries(o1).some(([key, value]) => value !== o2[key])
}

function App() {
  const [data, setData] = useState<IData>(initialValues);
  const [settings, setSettings] = useState<ISettings>();
  const [socket, setSocket] = useState<Socket>();
  

  useEffect(() => {
    setSocket(io(url));
  }, [])

  useEffect(() => {
    if(socket) {
      socket.on("connect", () => { console.log("Connected! Socket id:", socket.id); });
      socket.on("disconnect", () => { console.log("Disconnected!"); });
      socket.on("data", (newData: IData) => {
        console.log("Setting data");
        setData(newData);
      });
    }
  }, [socket])

  useEffect(() => {
    if (settings === undefined && !areEqual(data, initialValues)) {
      setSettings({ backlightOn: data.backlightOn, minTemperature: data.minTemperature, maxTemperature: data.maxTemperature })
    }
  }, [data])

  const handleSubmit = () => {
    if (socket && settings && settings.minTemperature < settings.maxTemperature) {
      console.log("Updating settings")
      socket.emit("updateSettings", settings)
    }
  }


  return (
    <div className="App">
      <header className="App-header">
        <div>
          <img src="cloud.png" alt="Cloud" />
          <h1 style={{ marginTop: "0", color: "yellow" }}>Weather Station</h1>
          {areEqual(data, initialValues) ? <CircularProgress /> :
            <>
              <table style={{ width: "100%" }}>
                <tr>
                  <th style={{ textAlign: "start" }}>Temperature:</th>
                  <th style={{ textAlign: "end" }}>{data.temperature}</th>
                  <th style={{ textAlign: "center" }}>°C</th>
                </tr>
                <tr>
                  <th style={{ textAlign: "start" }}>Humidity:</th>
                  <th style={{ textAlign: "end" }}>{data.humidity}</th>
                  <th style={{ textAlign: "center" }}>%</th>
                </tr>
                <tr>
                  <th style={{ textAlign: "start" }}>Temperature index:</th>
                  <th style={{ textAlign: "end" }}>{data.heatIndex.toFixed(1)}</th>
                </tr>
                <tr>
                  <th style={{ textAlign: "start" }}>Max temperature:</th>
                  <th style={{ textAlign: "end" }}>{data.maxTemperature}</th>
                  <th style={{ textAlign: "center" }}>°C</th>
                </tr>
                <tr>
                  <th style={{ textAlign: "start" }}>Min temperature:</th>
                  <th style={{ textAlign: "end" }}>{data.minTemperature}</th>
                  <th style={{ textAlign: "center" }}>°C</th>
                </tr>
              </table>
              {settings &&
                <>
                  <h4 style={{ fontWeight: "normal", color: "#e74c3c" }}>Settings:</h4>
                  <table style={{ width: "100%" }}>
                    <tr>
                      <th style={{ textAlign: "start", width: "50%" }}>Max temp:</th>
                      <th style={{ textAlign: "end" }}>
                        <input required type="number" style={textfieldStyles} value={settings.maxTemperature || ""} placeholder='0' onChange={(e) => !!Number(e.target.value) && setSettings({ ...settings, maxTemperature: Math.round(Number(e.target.value) * 10) / 10 })} />
                      </th>
                      <th>°C</th>
                    </tr>
                    <tr>
                      <th style={{ textAlign: "start", width: "50%" }}>Min temp:</th>
                      <th style={{ textAlign: "end" }}>
                        <input required type="number" style={textfieldStyles} value={settings.minTemperature || ""} placeholder='0' onChange={(e) => !!Number(e.target.value) && setSettings({ ...settings, minTemperature: Math.round(Number(e.target.value) * 10) / 10 })} />
                      </th>
                      <th>°C</th>
                    </tr>
                  </table>
                  <p>Display backlight on <Checkbox style={{ height: "auto", color: "white" }} checked={settings.backlightOn} onChange={(e, checked) => setSettings({...settings, backlightOn: checked})} /></p>
                  <Button 
                  disabled={!(settings.minTemperature < settings.maxTemperature)}
                  onClick={() => handleSubmit()} 
                  size="large" variant="contained" 
                  style={{fontFamily: "inherit", fontWeight: "bold"}} >
                    {(settings.minTemperature < settings.maxTemperature) ? "Update Settings" : "Min temp must be less than max"}
                  </Button>
                </>
              }
            </>
          }
        </div>
      </header>
    </div>
  );
}

export default App;
