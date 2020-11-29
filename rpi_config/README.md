# Smart Bin Monitoring System
ICT1003: Computer Organisation and Architecture
<br />
Team Exploration Project
<br /><br />
A system consisting of sensors to monitor rubbish bin capacity as well as a centralised monitoring dashboard for ease of accessibility.

## Raspberry Pi configuration
This directory contains the key configuration found in the project's Raspberry Pi setup.

## Directory layout
    /
    ├── etc
    │   ├── hostapd
    │   │   └── hostapd.conf                      # Host Access Point Daemon (hostapd) configuration file.
    │   │
    │   ├── nginx
    │   │   ├── sites-enabled
    │   │   │   └── ict1003                       # SmartBin Controller reverse proxy configuration.
    │   │   └── nginx.conf                        # Nginx Web Server configuration file.
    │   │
    │   ├── dnsmasq.conf                          # dnsmasq configuration file.
    │   ├── hosts                                 # Hosts file for DNS resolution.
    │   └── sysctl.conf                           # Linux Kernel parameters.
    │
    ├── lib
    │   └── systemd
    │       └── system
    │           └── ict1003.service               # Systemd Service file to autostart the SmartBin Controller on boot.
    │
    ├── opt
    │   └── ICT1003
    │       └── SmartBinController                # SmartBin Controller (backend) directory.
    │           ├── bincontroller                 # Python backend package directory. Owned by "www-data:www-data".
    │           ├── venv                          # Python Virtual Environment directory, with Pip packages installed.
    │           ├── requirements.txt
    │           ├── requirements-production.txt   # Additional packages for project advanced setup.
    │           ├── run.py
    │           └── wsgi.py                       # Used as the entry point by Gunicorn. Owned by "www-data:www-data".
    │
    ├── var
    │   └── lib
    │       └── dnsmasq                           # Directory for dnsmasq file storage. Must be created manually.
    │           └── dnsmasq.leases                # File containing DHCP lease records. Created by dnsmasq automatically.
    │
    └── tmp
        └── ict1003.sock                          # Created by Gunicorn automatically when executed. Serves the backend via Nginx.

## hostapd SSID and Password
SSID: ict1003-SmartBinNet
<br />
Password: SIT1003Sm4rtB1nN3tw0rk
