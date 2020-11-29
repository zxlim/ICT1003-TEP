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

import os


class Configuration(object):
    TEMPLATES_AUTO_RELOAD = True

    REVERSEPROXY = True

    APP_ROOT = os.path.dirname(os.path.abspath(__file__))

    JSON_AS_ASCII = True

    SQLALCHEMY_DATABASE_URI = f"sqlite:///{APP_ROOT}/database.sqlite"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class Production(Configuration):
    DEBUG = False
    TESTING = False


class Development(Configuration):
    DEBUG = True
    TESTING = False
