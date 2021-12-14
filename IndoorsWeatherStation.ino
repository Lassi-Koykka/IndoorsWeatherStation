#include <Wire.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#define DHTPIN 3
#define MINDOWNPIN 8
#define MINUPPIN 9
#define MAXDOWNPIN 10
#define MAXUPPIN 11
#define BUZZERPIN 5
#define DHTTYPE DHT11


long printInterval = 60000;
long lastPrintTime = 0;

DHT dht(DHTPIN, DHTTYPE);
float hOld = 0;
float tOld = 0;

float minTemp = 20.5;
float maxTemp = 23.5;

float minTempOld = minTemp;
float maxTempOld = maxTemp;


byte arrowUpChar[8] = {
  B11111111,
  B00000100,
  B00001110,
  B00011111,
  B00000100,
  B00000100,
  B00000100,
  B00000100,
};

byte arrowDownChar[8] = {
  B00000100,
  B00000100,
  B00000100,
  B00000100,
  B00011111,
  B00001110,
  B00000100,
  B11111111,
};

LiquidCrystal_I2C lcd(0x27, 16, 2);

int maxUpButtonPressed = 0;
int maxDownButtonPressed = 0;
int minUpButtonPressed = 0;
int minDownButtonPressed = 0;
int pressedLastLoop = 0;

int beeped = 0;

void setup() {

  // Init input pins
  pinMode(MAXUPPIN, INPUT);
  pinMode(MAXDOWNPIN, INPUT);
  pinMode(MINUPPIN, INPUT);
  pinMode(MINDOWNPIN, INPUT);

  // Output pins
  pinMode(BUZZERPIN, OUTPUT);


  Serial.begin(9600);

  dht.begin();
  Wire.begin();

  // Add custom characters
  lcd.createChar(0, arrowUpChar);
  lcd.createChar(1, arrowDownChar);
  lcd.begin(16, 2);
  lcd.backlight();

  lcd.clear();
  // Draw min and max temperatures
  lcd.setCursor(8, 0);
  lcd.write(byte(0));
  lcd.print(maxTemp, 1);
  lcd.write((char)223);
  lcd.print("C");

  lcd.setCursor(8, 1);
  lcd.write(byte(1));
  lcd.print(minTemp, 1);
  lcd.write((char)223);
  lcd.print("C");
}

void loop() {

  // Read button states if all buttons were not pressed last iteration
  maxUpButtonPressed = digitalRead(MAXUPPIN);
  maxDownButtonPressed = digitalRead(MAXDOWNPIN);
  minUpButtonPressed = digitalRead(MINUPPIN);
  minDownButtonPressed = digitalRead(MINDOWNPIN);


  if (maxUpButtonPressed && !pressedLastLoop) {
    maxTemp += 0.1;
  } else if (maxTemp - 0.1 >= minTemp && maxDownButtonPressed && !pressedLastLoop) {
    maxTemp -= 0.1;
  }

  if (minTemp + 0.1 <= maxTemp && minUpButtonPressed && !pressedLastLoop) {
    minTemp += 0.1;
  } else if (minDownButtonPressed && !pressedLastLoop) {
    minTemp -= 0.1;
  }

  //setPressed
  if (!maxUpButtonPressed && !maxDownButtonPressed && !minUpButtonPressed && !minDownButtonPressed) {
    pressedLastLoop = 0;
  } else {
    pressedLastLoop = 1;
  }


  // Read serial data
  if (Serial.available() > 2) {

    // FIRST BYTE
    uint8_t backlight = Serial.read();

    if (backlight > 0)
      lcd.backlight();
    else
      lcd.noBacklight();


    // SECOND BYTE
    uint8_t minByte = Serial.read();
    float newMinTemp = (float)minByte / 10;

    // THIRD BYTE
    uint8_t maxByte = Serial.read();
    float newMaxTemp = (float)maxByte / 10;

    // Serial.print("Backlight byte: ");
    // Serial.println(backlight);

    // Serial.println("Min byte: ");
    // Serial.println(minByte);
    // Serial.println(newMinTemp);

    // Serial.println("Max byte: ");
    // Serial.println(maxByte);
    // Serial.println(newMaxTemp);

    if (minByte > 0 && (newMinTemp < newMaxTemp || (newMaxTemp == 0 && newMinTemp < maxTemp))) {
      minTemp = newMinTemp;
    }

    if (maxByte > 0 && (newMaxTemp > newMinTemp || (newMinTemp == 0 && newMaxTemp > maxTemp))) {
      maxTemp = newMaxTemp;
    }

    while(Serial.available())
      Serial.read();
  }


  // Read values
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Reading from sensor failed");
    return;
  }

  float hic = dht.computeHeatIndex(t, h, false);

  long currTime = millis();

  // Print if first print or value has changed
  if (lastPrintTime == 0 || (currTime - lastPrintTime > printInterval && (tOld != tOld || h != hOld)) || (maxTemp != maxTempOld || minTemp != minTempOld)) {
    Serial.println(String(t) + ";" + String(h) + ";" + String(hic) + ";" + String(minTemp) + ";" + String(maxTemp));

    lastPrintTime = millis();
  }

  if (t != tOld) {
    tOld = t;
    lcd.setCursor(0, 0);
    float value = (int)(t * 10 + .5);
    lcd.print((float)value / 10, 1);
    lcd.write((char)223);
    lcd.print("C");
  }

  if (h != hOld) {
    hOld = h;
    lcd.setCursor(0, 1);
    int value = (int)(h * 10 + .5);
    lcd.print((float)value / 10, 1);
    lcd.print(" %");
  }

  if (maxTemp != maxTempOld) {
    maxTempOld = maxTemp;
    lcd.setCursor(9, 0);
    lcd.print(maxTemp, 1);
    lcd.write((char)223);
    lcd.print("C ");
  }

  if (minTemp != minTempOld) {
    minTempOld = minTemp;
    lcd.setCursor(9, 1);
    lcd.print(minTemp, 1);
    lcd.write((char)223);
    lcd.print("C ");
  }

  // Warn of too high or too low temp by beeping once
  if (!beeped && (t > maxTemp || t < minTemp)) {
    tone(BUZZERPIN, 200, 500);
    delay(1000);
    tone(BUZZERPIN, 200, 500);
    delay(1000);
    tone(BUZZERPIN, 200, 500);
    beeped = 1;
  } else if(beeped && t < maxTemp && t > minTemp) {
    beeped = 0;
  }
  
}
