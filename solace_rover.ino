#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>


// WIFI

const char* WIFI_SSID = "Airtel_Praveenraj_2.4";
const char* WIFI_PASSWORD = "22424460";
const char* SERVER_URL = "http://192.168.1.6:5000/api/telemetry";


// DHT11

#define DHT_PIN 5
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);


// OLED

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

#define SDA_PIN 8
#define SCL_PIN 9


// IR SENSORS

#define IR_FRONT 4
#define IR_LEFT 11
#define IR_RIGHT 12
#define IR_REAR 13

#define OBSTACLE LOW

bool frontObstacle = false;
bool leftObstacle = false;
bool rightObstacle = false;
bool rearObstacle = false;


// BUZZER

#define BUZZER_PIN 18


// L298N MOTOR DRIVER

// ENA and ENB are NOT controlled by ESP32.
// Keep the ENA and ENB jumpers installed.

#define IN1 7
#define IN2 10
#define IN3 15
#define IN4 16


// SENSOR DATA

float temperature = 0;
float humidity = 0;


// SERVER TIMING

unsigned long lastServerSend = 0;
const unsigned long SERVER_INTERVAL = 1000;



// SETUP

void setup() {

  Serial.begin(115200);

  // OLED
  Wire.begin(SDA_PIN, SCL_PIN);

  // DHT
  dht.begin();

  // OLED initialization
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {

    Serial.println("OLED failed");

  } else {

    display.clearDisplay();

    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    display.setCursor(0, 0);

    display.println("SOLACE ROVER");
    display.println();
    display.println("System Starting...");

    display.display();
  }

  // IR sensors
  pinMode(IR_FRONT, INPUT);
  pinMode(IR_LEFT, INPUT);
  pinMode(IR_RIGHT, INPUT);
  pinMode(IR_REAR, INPUT);

  // Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Motor control pins
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  stopMotors();

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {

    delay(300);

    Serial.print(".");
  }

  Serial.println();

  Serial.println("WiFi connected");

  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  display.clearDisplay();

  display.setCursor(0, 0);

  display.println("SOLACE ROVER");
  display.println();
  display.println("WiFi Connected");

  display.display();

  delay(1000);
}



// MAIN LOOP

void loop() {

  // Highest priority
  readIR();

  // Autonomous movement
  handleMovement();

  // Environment
  readDHT();

  // Local display
  updateOLED();

  // Send data to Flask
  sendTelemetry();

  delay(20);
}



// READ IR SENSORS

void readIR() {

  frontObstacle = digitalRead(IR_FRONT) == OBSTACLE;
  leftObstacle  = digitalRead(IR_LEFT) == OBSTACLE;
  rightObstacle = digitalRead(IR_RIGHT) == OBSTACLE;
  rearObstacle  = digitalRead(IR_REAR) == OBSTACLE;

  Serial.print("Front: ");
  Serial.print(frontObstacle);

  Serial.print(" | Left: ");
  Serial.print(leftObstacle);

  Serial.print(" | Right: ");
  Serial.print(rightObstacle);

  Serial.print(" | Rear: ");
  Serial.println(rearObstacle);
}



// AUTONOMOUS MOVEMENT

void handleMovement() {

  if (frontObstacle) {

    stopMotors();

    digitalWrite(BUZZER_PIN, HIGH);

    Serial.println("FRONT OBSTACLE - STOP");


    // Turn right if right side is clear
    if (!rightObstacle) {

      turnRight();

      delay(700);
    }


    // Otherwise turn left if left side is clear
    else if (!leftObstacle) {

      turnLeft();

      delay(400);
    }


    // Both sides blocked
    else {

      stopMotors();

      Serial.println("PATH BLOCKED");
    }

    return;
  }

  // No front obstacle
  digitalWrite(BUZZER_PIN, LOW);

  moveForward();
}



// MOVE FORWARD

void moveForward() {

  // Left side forward
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  // Right side forward
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}



// STOP

void stopMotors() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}



// TURN RIGHT

// Left side moves forward
// Right side stops
void turnRight() {

  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}



// TURN LEFT

void turnLeft() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}



// READ DHT11

void readDHT() {

  float newTemperature = dht.readTemperature();
  float newHumidity = dht.readHumidity();

  if (!isnan(newTemperature)) {

    temperature = newTemperature;
  }

  if (!isnan(newHumidity)) {

    humidity = newHumidity;
  }
}



// UPDATE OLED

void updateOLED() {

  display.clearDisplay();

  display.setCursor(0, 0);

  display.println("SOLACE ROVER");
  display.println();

  display.print("Temp: ");
  display.print(temperature);
  display.println(" C");

  display.print("Hum:  ");
  display.print(humidity);
  display.println(" %");

  display.println();

  display.print("Front: ");
  display.println(
    frontObstacle ? "BLOCKED" : "CLEAR"
  );

  display.print("Left:  ");
  display.println(
    leftObstacle ? "BLOCKED" : "CLEAR"
  );

  display.print("Right: ");
  display.println(
    rightObstacle ? "BLOCKED" : "CLEAR"
  );

  display.display();
}



// SEND TELEMETRY

void sendTelemetry() {

  if (millis() - lastServerSend < SERVER_INTERVAL) {

    return;
  }

  lastServerSend = millis();


  if (WiFi.status() != WL_CONNECTED) {

    return;
  }


  HTTPClient http;

  http.begin(SERVER_URL);

  http.addHeader(
    "Content-Type",
    "application/json"
  );


  String json = "{";

  json += "\"temperature\":";
  json += String(temperature, 1);

  json += ",";

  json += "\"humidity\":";
  json += String(humidity, 1);

  json += ",";

  json += "\"obstacles\":{";

  json += "\"front\":";
  json += frontObstacle ? "true" : "false";

  json += ",";

  json += "\"left\":";
  json += leftObstacle ? "true" : "false";

  json += ",";

  json += "\"right\":";
  json += rightObstacle ? "true" : "false";

  json += ",";

  json += "\"rear\":";
  json += rearObstacle ? "true" : "false";

  json += "},";

  json += "\"wifi_rssi\":";
  json += String(WiFi.RSSI());

  json += "}";


  Serial.println();

  Serial.println("Sending telemetry:");

  Serial.println(json);


  int responseCode = http.POST(json);

  Serial.print("Server response: ");

  Serial.println(responseCode);


  http.end();
}
