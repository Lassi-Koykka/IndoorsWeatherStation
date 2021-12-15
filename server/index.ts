import fs from "fs"
import path from "path"
import { Buffer } from 'buffer';
import { createInterface } from "readline";
import ObjectsToCsv from "objects-to-csv";
import SerialPort from "serialport";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express from "express";
const app = express();


interface IData {
    timestamp: number;
    temperature: number;
    humidity: number;
    heatIndex: number;
    minTemperature: number;
    maxTemperature: number;
    backlightOn: boolean;
}

interface ISettings {
    minTemperature: number;
    maxTemperature: number;
    backlightOn: boolean;
  }

let latestData: IData = {
    timestamp: -1,
    temperature: -1,
    humidity: -1,
    heatIndex: -1,
    minTemperature: -1,
    maxTemperature: -1,
    backlightOn: true
}


const httpServer = createServer(app);

app.use('/data', express.static(path.join(__dirname,"data")));
app.get("/data", (req, res) => {
    let html = "<h1>Files:</h1><ul>"
    const filesInDir = fs.readdirSync(path.join(__dirname,"data"))
    filesInDir.forEach(f => html += `<li> <a href="/data/${f}">${f}</a> </li>`)
    html += "</ul>"
    return res.type("html").send(html)
})

const dataDirPath = path.join(__dirname, "data")
if(!fs.existsSync(dataDirPath))
    fs.mkdirSync(dataDirPath)



const io = new Server(httpServer, {
    cors: {origin: "*"}
})

io.on("connection", (socket: Socket) => {
    console.log("Client connected")
    io.emit("data", latestData)
    
    socket.on("updateSettings", (settings: ISettings) => {
        console.log("Updating settings")
        let buf = Buffer.from([
            Number(settings.backlightOn), 
            ...tempIntoBytes(settings.minTemperature),
            ...tempIntoBytes(settings.maxTemperature),
        ]);
    
        port.write(buf);
    })
    
});

const tempIntoBytes = (x: number) => {
    const num = Math.round(x * 10)
    let buf = Buffer.alloc(2)
    buf.writeUInt16BE(num, 0)
    return buf
} 


const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 })

port.on("open", () => console.log("Connected to serial data"))

const lineReader = createInterface({
    input: port as any
});

// ON NEW DATA
lineReader.on("line", (line) => {

    console.log(line)

    const date = new Date();

    const dateString = date.toISOString().slice(0, 10);
    const timestamp = Math.round(date.getTime() / 1000);
    
    const values = line.split(";").map(s => !!Number(s) ? Number(s) : -1)

    if(values.length < 6) return

    const dataObject: IData = {
        timestamp: timestamp,
        temperature: values[0],
        humidity: values[1],
        heatIndex: values[2],
        minTemperature: values[3],
        maxTemperature: values[4],
        backlightOn: values[5] === 1
    }

    latestData = dataObject

    console.log(dataObject);

    io.emit("data", dataObject)

    if(Object.values(dataObject).every(x => !!x)) {
        const fileName = path.join(dataDirPath, "data-" + dateString + ".csv")
        const csv = new ObjectsToCsv([dataObject]);
        csv.toDisk(fileName, {append: true})
    }
});


httpServer.listen(8080, () => console.log("Listening on http://localhost:8080"))