#!/usr/bin/env python3

################################################################################
# ICT1003 Computer Organisation and Architecture
# Team Exploration Project.
#
# SmartBin Controller Server-Side Code.
#
# Unless otherwise stated, all code or content in this file is created
# by and belongs to the Project Team.
#
# [ Group P3A ]
# - Lim Zhao Xiang
# - Gerald Peh
# - Ryan Goh
# - Teng Ming Hui
# - Ang Jin Yuan Raymous
################################################################################

from bincontroller import BinController


def main(host="0.0.0.0", port="8080"):
    """
    Tested using Python 3.8.6 and with Python Pip Packages stated in the file "requirements.txt".
    Change the host and port binding to suit your needs.

    For best performance, run the backend behind a dedicated reverse proxy like Nginx.

    Ensure packages stated in "requirements.txt" are installed (python3 -m pip install -r requirements.txt).
    Usage: Run the following command from the command-line.

    sudo python3 run.py
    """
    app = BinController.init(config="bincontroller.config.Production")
    app.run(host=host, port=port)


if __name__ == "__main__":
    main()
