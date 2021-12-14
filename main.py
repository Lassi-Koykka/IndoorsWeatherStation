import serial;
from datetime import date, datetime;



arduino_port = "/dev/ttyUSB0"
baud = 9600

ser = serial.Serial(arduino_port, baud)

print("Connected to serial")

while True:
    try:
        getData = str(ser.readline())
        print(getData)
        data = getData[2:][:-3]
        # print(data)
        filename = "data/results-" + str(date.today()) + ".csv"
        lastFilename = filename

        if filename != lastFilename:
            file.close()

        timeStamp = int(datetime.today().timestamp())

        file = open(filename, "a")
        file.write(f"{timeStamp},{data}\n")

    except KeyboardInterrupt:
        file.close()
        print()
        print("Closing file and stopping...")
        print()
        break;