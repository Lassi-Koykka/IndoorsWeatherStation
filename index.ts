import SerialPort from "serialport";

const port = new SerialPort('/dev/ttyUSB0', {baudRate: 9600})

port.on("open", () => console.log("Connected to serial data"))

port.on("readable", () => {
    const line = port.read()?.toString()!
    console.log(line)
})

//port.on("data", (data) => console.log("Data:", data))