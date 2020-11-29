# Smart Bin Monitoring System
ICT1003: Computer Organisation and Architecture
<br />
Team Exploration Project
<br /><br />
A system consisting of sensors to monitor rubbish bin capacity as well as a centralised monitoring dashboard for ease of accessibility.

## Team Members
- Lim Zhao Xiang
- Gerald Peh
- Ryan Goh
- Teng Ming Hui
- Ang Jin Yuan Raymous

# Usage
The backend code can be ran by using the following command.
```bash
$ python3 run.py
```
<br />
However, the actual project uses a more advanced implementation, which executes the backend using Gunicorn and exposes it as a Unix Socket, with Nginx Web Server acting as the reverse proxy on TCP port 80 and handling all HTTP requests to the backend Unix Socket. All these will be running on a Raspberry Pi.
<br /><br />
The TinyCircuits will be connected to the Raspberry Pi via WiFi hotspot running on the Raspberry Pi itself, and can be resolved via the domain "smartbin.sitict.net".
The TinyCircuits will communicate with the backend via Nginx using the domain.

# Project Hardware
- [TinyZero Process Board](https://tinycircuits.com/collections/processors/products/tinyzero-processor)
- [TinyScreen OLED TinyShield](https://tinycircuits.com/collections/leds-displays/products/tinyscreen)
- [Wifi TinyShield](https://tinycircuits.com/collections/communication/products/wifi-tinyshield-atwinc1500)
- [Wireling Adapter TinyShield](https://tinycircuits.com/collections/wireling-processors/products/wireling-adapter-tinyshield)
- [5-Pin Wireling Cables](https://tinycircuits.com/collections/wireling-accessories/products/5-pin-extension-cable)
- [Time-Of-Flight (TOF) Distance Sensor Wireling](https://tinycircuits.com/collections/wireling-sensors/products/tof-distance-sensor-wireling-vl53l0x)
- [Soil Moisture Sensor Wireling](https://tinycircuits.com/collections/wireling-sensors/products/moisture-sensor-wireling)
- Raspberry Pi 3

All additional sensors were bought from [official local distributors](https://tinycircuits.com/pages/https-tinycircuits-com-pages-our-distributors) (Mouser, DigiKey). 

# License and Copyright Information
This project is an assignment submission for the fulfillment of the module ICT1003 Computer Organisation and Architecture.
<br /><br />
As such, copyright and any rights to this project shall belong to the project contributors as well as to [Singapore Institute of Technology (SIT)](https://www.singaporetech.edu.sg/).
<br /><br />
Plagiarism is a serious offence, and SIT's policy explicitly forbids such acts. Any submission caught with plagiarised work shall receive zero marks for their submission.
<br /><br />
Any third-party resources used for this project may be reused in accordance to their license and/ or terms and conditions.
