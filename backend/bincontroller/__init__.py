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


def init_app():
    return BinController.init()
