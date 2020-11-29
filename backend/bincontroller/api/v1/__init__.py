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

from bincontroller.api.v1.smartbins import SmartBinAPI, SmartBinsAPI, SmartBinRegistrationAPI
from bincontroller.api.v1.smartbin_analytics import SmartBinAnalyticsAPI


ENDPOINT = "/trashbins"


API_V1: dict = {
    f"{ENDPOINT}/get/<string:bin_id>": SmartBinAPI,
    f"{ENDPOINT}/all": SmartBinsAPI,
    f"{ENDPOINT}/add": SmartBinRegistrationAPI,
    f"{ENDPOINT}/data/<string:request_type>": SmartBinAnalyticsAPI
}
