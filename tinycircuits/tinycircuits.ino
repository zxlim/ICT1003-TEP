/*
 * ICT1003 Computer Organisation and Architecture
 * Team Exploration Project.
 *
 * SmartBin Controller TinyCircuits Code.
 *
 * Unless otherwise stated, all code or content in this file is created
 * by and belongs to the Project Team.
 *
 * [ Group P3A ]
 * - Lim Zhao Xiang
 * - Gerald Peh
 * - Ryan Goh
 * - Teng Ming Hui
 * - Ang Jin Yuan Raymous
 * 
 * Requires the following Arduino libraries:
 * - ArduinoHttpClient
 * - TinyScreen
 * - VL53L0X TOF Sensor
 * - WiFi101
 * - Wireling
*/

#include <ArduinoHttpClient.h>
#include <TinyScreen.h>
#include <Wire.h>
#include <Wireling.h>
#include <WiFi101.h>
#include "VL53L0X.h"


// Serial is useful for development/ debugging.
#if defined(ARDUINO_ARCH_AVR)
#define SerialMonitorInterface Serial
#elif defined(ARDUINO_ARCH_SAMD)
#define SerialMonitorInterface SerialUSB
#endif


/****************************************
 *              CONSTANTS               *
*****************************************/
// Verbose Output to Serial Monitor: For development or diagnostic use only!
#define VERBOSE_MODE        true

// Controller information.
#define API_ENDPOINT        "/trashbins"
#define CONTROLLER_HOST     "smartbin.sitict.net"
#define CONTROLLER_PORT     80

// Delay in between sending sensor readings to the Controller in milliseconds.
#define UPDATE_LOOP_DELAY   5000

// WiFi SSID and Password.
#define WIFI_SSID           "ict1003-SmartBinNet"
#define WIFI_PASS           "SIT1003Sm4rtB1nN3tw0rk"

// Low power mode for WiFi connectivity. Set to true to conserve battery.
#define WIFI_LOWPOWER       true

// Number of octets in MAC addressing scheme.
#define MAC_SZ              6

// Wireling sensor ports.
#define WIRELING_TOF        3
#define WIRELING_MOISTURE   0

// Moisture MIN and MAX reading
#define MIN_CAP_READ        710
#define MAX_CAP_READ        975
#define MOISTURE_THRESHOLD  40

// Bin Depth in mm (For bin capacity calculation).
#define BIN_DEPTH           145
#define CAPACITY_OFFSET     2
#define READ_COUNT          20


/****************************************
 *           GLOBAL VARIABLES           *
*****************************************/
VL53L0X sensor_tof;
WiFiClient wifi_client;
HttpClient http_controller = HttpClient(wifi_client, CONTROLLER_HOST, CONTROLLER_PORT);
TinyScreen display = TinyScreen(TinyScreenDefault);

String client_wifi_ipv4_address;
char client_wifi_mac_address[13];

// Last update to Controller.
unsigned long next_update_time = 0;
bool controller_connected = false;

// Current bin distance reading.
int capacity_percent = 0;
int current_capacity = BIN_DEPTH;

// Liquid leaks detection.
bool liquid_detected = false;

// Whether button is pressed; Cleaner has cleaned the bin.
bool is_cleared = false;


/****************************************
 *            MISC FUNCTIONS            *
*****************************************/
void printMsg(char* message, int height_offset, bool clear_screen) {
  if (clear_screen == true) {
    display.clearScreen();
  }
  
  int print_width = display.getPrintWidth(message);
  
  int w = 48 - ((int) (print_width / 2.0));
  int h = 32 - (display.getFontHeight() / 2) + height_offset;
  
  display.setCursor(w, h);
  display.print(message);
}


/****************************************
 *             WIFI FUNCTIONS           *
*****************************************/
void initWiFi() {
  /*
   * Connects to the specified WiFi network using the WiFi101 library.
   * WiFi101 library reference: https://www.arduino.cc/en/Reference/WiFi101
  */  
  while (WiFi.status() != WL_CONNECTED) {
    // Not connected to WiFi. Check again 2 seconds.
    printMsg("Conecting to WiFi..", 0, true);
    WiFi.end();
    delay(2000);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    delay(3000);
  }

  if (WIFI_LOWPOWER == true) {
    WiFi.lowPowerMode();
  }

  // Retrieve the WiFi Shield IPv4 address.
  client_wifi_ipv4_address = getIPAddress();

  // Retrieve the WiFi Shield MAC address.
  byte mac_buffer[MAC_SZ];
  WiFi.macAddress(mac_buffer);
  sprintf(client_wifi_mac_address, "%02X%02X%02X%02X%02X%02X", mac_buffer[5], mac_buffer[4], mac_buffer[3], mac_buffer[2], mac_buffer[1], mac_buffer[0]);

  printMsg("WiFi Connected!", 0, true);
  if (VERBOSE_MODE == true) {
      SerialMonitorInterface.print("[initWiFi] WiFi connection successful. SmartBin IP Address: ");
      SerialMonitorInterface.println(client_wifi_ipv4_address);
  }
  delay(1000);
}


String getIPAddress() {
  if (WiFi.status() != WL_CONNECTED) {
    return String("");
  }
  
  IPAddress ipv4 = WiFi.localIP();
  return (String(ipv4[0]) + String(".") + \
         String(ipv4[1]) + String(".") + \
         String(ipv4[2]) + String(".") + \
         String(ipv4[3]));
}


/****************************************
 *          CONTROLLER FUNCTIONS        *
*****************************************/

void broadcastAdoption() {
  /*
   * Announce the presence of SmartBinClient to the Controller Server.
   * Controller Server will "adopt" (take control) client by responding
   * with a HTTP 200 OK.
  */
  printMsg("Connecting to", -5, true);
  printMsg("Controller...", 5, false);
  
  while (true) {
    String content_type = "application/json";
    String endpoint = String(API_ENDPOINT) + "/add";
    String payload = "{\"mac\":\"" + String(client_wifi_mac_address) + "\"}";

    http_controller.beginRequest();
    http_controller.post(endpoint, content_type, payload);
    http_controller.endRequest();

    int status_code = http_controller.responseStatusCode();

    if (status_code == 200) {
      controller_connected = true;
      
      if (VERBOSE_MODE == true) {
        SerialMonitorInterface.print("[broadcastAdoption] HTTP POST successful. SmartBin adopted and managed by Controller: ");
        SerialMonitorInterface.println(CONTROLLER_HOST);
      }

      printMsg("Controller:", -5, true);
      printMsg(CONTROLLER_HOST, 5, false);
      break;
    } else if (VERBOSE_MODE == true) {
      SerialMonitorInterface.print("[broadcastAdoption] HTTP POST failed. Status code: ");
      SerialMonitorInterface.println(status_code);
    }

    delay(5000);
  }
}


void postController() {
  /*
   * Update the Controller with latest data from this SmartBin instance.
  */
  
  String content_type = "application/json";
  String endpoint = String(API_ENDPOINT) + "/get/" + String(client_wifi_mac_address);
  
  String payload = "{\"action\": \"update_log\", ";
  payload += "\"current_capacity\": ";
  payload += String(capacity_percent) + ", ";
  payload += "\"liquid_detected\": ";
  payload += String(liquid_detected ? "true" : "false") + ", ";
  payload += "\"is_cleared\": ";
  payload += String(is_cleared ? "true" : "false") + "}";

  http_controller.beginRequest();
  http_controller.post(endpoint, content_type, payload);
  http_controller.endRequest();

  int status_code = http_controller.responseStatusCode();

  if (status_code == 200) {    
    if (is_cleared == true) {
      // Reset the button state. Since button was pressed and update is triggered,
      // don't change the next update time.
      is_cleared = false;

      if (VERBOSE_MODE == true) {
        SerialMonitorInterface.println("[postController] `is_clear` set to FALSE.");
      }
    } else {
      // Update the next timing to send updates to Controller.
      next_update_time = millis() + ((unsigned long) UPDATE_LOOP_DELAY);
    }

    if (VERBOSE_MODE == true) {
      SerialMonitorInterface.print("[postController] HTTP POST successful. Next update: ");
      SerialMonitorInterface.println(next_update_time);
    }
  } else {
    // Did not receive HTTP 200 OK.
    controller_connected = false;
    
    if (VERBOSE_MODE == true) {
      // Print to serial if verbose mode is true.
      SerialMonitorInterface.print("[postController] HTTP POST failed. Status Code: ");
      SerialMonitorInterface.println(status_code);
    }

    printMsg("Disconnected from", -5, true);
    printMsg("Controller!", 5, false);
  }
}

/****************************************
 *             TOF FUNCTIONS            *
*****************************************/
void initTOF() {
  /*
   * Initialise the Time-of-Flight sensor.
  */
  Wireling.selectPort(WIRELING_TOF);
  
  sensor_tof.init();
  sensor_tof.setTimeout(1000);
  sensor_tof.startContinuous(1000);
}


void updateBinCapacityValue() {
  /*
   * Read the current value of the TOF sensor and calculate the
   * current capacity of the bin.
  */
  int offset_low = 0;
  int offset_high = BIN_DEPTH;
  
  Wireling.selectPort(WIRELING_TOF);
  int all_readings = 0;

  for (int i = 0; i < READ_COUNT; i++) {
    all_readings += sensor_tof.readRangeSingleMillimeters();
  }

  int tof_distance = (int) (all_readings / READ_COUNT);

  if (current_capacity > CAPACITY_OFFSET) {
    offset_low = current_capacity - CAPACITY_OFFSET;
  }

  if (current_capacity < BIN_DEPTH) {
    offset_high = current_capacity + CAPACITY_OFFSET;
  }

  if (tof_distance > BIN_DEPTH) {
    capacity_percent = 0;
  } else if (tof_distance < offset_low || tof_distance > offset_high) {
    capacity_percent = (int) (((float) (BIN_DEPTH - tof_distance) / (float) BIN_DEPTH) * 100);
  }

  current_capacity = tof_distance;

  if (VERBOSE_MODE == true) {
    SerialMonitorInterface.print("[updateBinCapacityValue] TOF sensor reading average value: ");
    SerialMonitorInterface.print(current_capacity);
    SerialMonitorInterface.println("mm");
  }
}


/****************************************
 *          MOISTURE FUNCTIONS          *
*****************************************/
void updateMoistureValue() {
  /*
   * Read the current value of the moisture sensor and determine
   * whether there is any liquid leakage.
  */
  Wireling.selectPort(WIRELING_MOISTURE);
  Wire.beginTransmission(0x30);
  Wire.write(1);
  Wire.endTransmission();
  delay(5);
  int moisture_reading = 0;
  Wire.requestFrom(0x30, 2);
  
  if (Wire.available() == 2) {
    moisture_reading = Wire.read();
    moisture_reading <<= 8;
    moisture_reading |= Wire.read();
    moisture_reading = constrain(moisture_reading, MIN_CAP_READ, MAX_CAP_READ);
    moisture_reading = map(moisture_reading, MIN_CAP_READ, MAX_CAP_READ, 0, 100);
  }

  if (VERBOSE_MODE == true) {
    SerialMonitorInterface.print("[updateMoistureValue] Moisture reading value: ");
    SerialMonitorInterface.println(moisture_reading);
  }

  if (moisture_reading > MOISTURE_THRESHOLD) {
    liquid_detected = true;

    if (VERBOSE_MODE == true) {
      SerialMonitorInterface.println("[updateMoistureValue] `liquid_detected` set to TRUE.");
    }
  }
}


/****************************************
 *           BUTTON FUNCTIONS           *
*****************************************/
void updateButtonState() {
  if (is_cleared == true) {
    return;
  }
  
  if (display.getButtons()) {
    // A button is pressed.
    is_cleared = true;
    liquid_detected = false;

    if (VERBOSE_MODE == true) {
      SerialMonitorInterface.println("[updateButtonState] Button is pressed. `is_clear` set to TRUE.");
      SerialMonitorInterface.println("[updateButtonState] `liquid_detected` set to FALSE.");
    }

    display.fontColor(TS_8b_Black, TS_8b_Green);
    printMsg("SmartBin Marked", -5, true);
    printMsg("As Cleared!", 5, false);
    display.fontColor(TS_8b_White, TS_8b_Black);
  }
}


/****************************************
 *            CORE FUNCTIONS            *
*****************************************/
void setup() {
  /*
   * Setup code. Will be executed once on startup.
  */
  Wire.begin();
  Wireling.begin();

  display.begin();
  display.setBrightness(5);
  display.setFlip(false);
  display.setFont(thinPixel7_10ptFontInfo);
  display.fontColor(TS_8b_White, TS_8b_Black);

  if (VERBOSE_MODE == true) {
    SerialMonitorInterface.begin(9600);
    delay(1000);
    SerialMonitorInterface.println("[setup] Verbose mode is enabled.");
  }

  // Initialise WiFi. Pin configuration is different for TinyCircuits.
  WiFi.setPins(8, 2, A3, -1);
  initWiFi();

  // Initialise sensors.
  initTOF();

  // Inform controller for adoption.
  broadcastAdoption();
}


void loop() {
  /*
   * Main Function. Will be executed forever.
  */
  // Check WiFi connectivity status.
  if (WiFi.status() != WL_CONNECTED) {
    // Rejoin the WiFi network if it is no longer connected.
    initWiFi();
    controller_connected = false;
  }

  if (controller_connected == false) {
    // Re-broadcast adoption request. Ensures that Controller is up.
    broadcastAdoption();
  }

  // Constantly monitor for button presses.
  updateButtonState();

  unsigned long current_time = millis();

  // Check if it is time to send new updates to the Controller.
  // Marking the SmartBin as cleared by pressing the button will also trigger
  // an immediate update to the Controller.
  if (current_time > next_update_time || is_cleared == true) {    
    // Update sensor readings.
    updateBinCapacityValue();
    updateMoistureValue();

    if (liquid_detected == true && capacity_percent >= 80) {
      // Liquid Leakage and Capacity Alerts triggered.
      display.fontColor(TS_8b_White, TS_8b_Red);
      printMsg("Capacity Alert!", -15, true);
      
      display.fontColor(TS_8b_White, TS_8b_Blue);
      printMsg("Liquid Alert!", -5, false);
      
      display.fontColor(TS_8b_White, TS_8b_Black);
      printMsg("Controller:", 5, false);
      printMsg(CONTROLLER_HOST, 15, false);
    } else if (liquid_detected == true) {
      // Liquid Leakage Alert triggered.
      display.fontColor(TS_8b_White, TS_8b_Blue);
      printMsg("Liquid Alert!", -10, true);
      
      display.fontColor(TS_8b_White, TS_8b_Black);
      printMsg("Controller:", 0, false);
      printMsg(CONTROLLER_HOST, 10, false);
    } else if (capacity_percent >= 80) {
      // Capacity Alert triggered.
      display.fontColor(TS_8b_White, TS_8b_Red);
      printMsg("Capacity Alert!", -10, true);
      
      display.fontColor(TS_8b_White, TS_8b_Black);
      printMsg("Controller:", 0, false);
      printMsg(CONTROLLER_HOST, 10, false);
    } else {
      // All OK.
      printMsg("Controller:", -5, true);
      printMsg(CONTROLLER_HOST, 5, false);
    }
  
    // Send the new readings to the Controller.
    postController();
  }
}
