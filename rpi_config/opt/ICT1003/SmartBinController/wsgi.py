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
# To be used by Gunicorn as the program entry point.
################################################################################

from bincontroller import BinController


app = BinController.init(config="bincontroller.config.Production")


if __name__ == "__main__":
    app.run()
