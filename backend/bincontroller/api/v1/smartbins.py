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

from flask import jsonify, make_response, request
from flask_restful import Resource
from operator import itemgetter

from bincontroller.models.smartbin import SmartBin, insert_bin, get_bin_name, get_bin_location, update_bin_name, update_bin_location, delete_bin
from bincontroller.models.binlog import (
    BinLog, insert_log, update_unknown_binlog_name, update_unknown_binlog_location,
    get_latest_log, get_last_cleared_timing, get_last_log_timing, get_smartbin_alert_status
)


class SmartBinAPI(Resource):
    """
    Single SmartBin request API Endpoint
    """
    def get(self, bin_id):
        """
        Retrieve the latest logs of a single SmartBin, based on the provided bin_id.
        """
        status_code = 404
        response_data = {"message": "bin_id not found."}

        bin_id = str(bin_id).upper()
        latest_log = get_latest_log(bin_id)

        if latest_log:
            status_code = 200
            response_data = {
                "message": "OK",
                "result": [{
                    "bin_id": bin_id,
                    "name": get_bin_name(bin_id),
                    "location": get_bin_location(bin_id),
                    "capacity": latest_log.capacity,
                    "liquid_detected": latest_log.liquid_detected,
                    "last_cleared": get_last_cleared_timing(bin_id),
                    "last_activity": get_last_cleared_timing(bin_id),
                    "alert": get_smartbin_alert_status(bin_id)
                }]
            }

        return make_response(jsonify(response_data), status_code)

    def post(self, bin_id):
        """
        Insert log or update SmartBin information.
        """
        status_code = 400
        response_data = {"message": "Invalid data received."}

        bin_id = str(bin_id).upper()
        payload = request.json

        smartbin = SmartBin.query.get(bin_id)

        if smartbin:
            if "action" in payload.keys():
                if payload["action"] == "update_log":
                    try:
                        capacity = int(payload["current_capacity"])
                        liquid_detected = bool(payload["liquid_detected"])
                        is_cleared = bool(payload["is_cleared"])
                    except (KeyError, TypeError, ValueError):
                        return make_response(jsonify(response_data), status_code)

                    if insert_log(bin_id, smartbin.name, smartbin.location, capacity, liquid_detected, is_cleared):
                        status_code = 200
                        response_data["message"] = "OK"
                    else:
                        status_code = 500
                        response_data["message"] = "Failed to insert record."
                elif payload["action"] == "update_name":
                    if "name" in payload.keys():
                        new_name = str(payload["name"]).strip()
                        if not update_bin_name(bin_id, new_name) or not update_unknown_binlog_name(bin_id, new_name):
                            status_code = 500
                            response_data["message"] = "Failed to update SmartBin name."
                        else:
                            status_code = 200
                            response_data["message"] = "OK"
                elif payload["action"] == "update_location":
                    if "location" in payload.keys():
                        new_location = str(payload["location"]).strip()
                        if not update_bin_location(bin_id, new_location) or not update_unknown_binlog_location(bin_id, new_location):
                            status_code = 500
                            response_data["message"] = "Failed to update SmartBin location."
                        else:
                            status_code = 200
                            response_data["message"] = "OK"
        else:
            status_code = 404
            response_data["message"] = "bin_id not found."

        return make_response(jsonify(response_data), status_code)

    def delete(self, bin_id):
        """
        Deletes a SmartBin and all its associated logs from the database.
        """
        bin_id = str(bin_id).strip().upper()
        if not SmartBin.query.get(bin_id):
            return make_response(jsonify({"message": "bin_id not found."}), 404)
        elif get_last_log_timing(bin_id) == "Recently":
            return make_response(jsonify({"message": "SmartBin is still connected. Disconnect it from the Controller before removing (You may need to wait for up to 30 seconds)."}), 400)
        elif delete_bin(bin_id):
            return make_response(jsonify({"message": "OK"}), 200)
        return make_response(jsonify({"message": "Failed to delete SmartBin."}), 500)


class SmartBinsAPI(Resource):
    """
    All SmartBin request API Endpoint
    """
    def get(self):
        response_data = {"message": "No SmartBins found.", "result": []}

        result = []
        all_bins = SmartBin.query.all()

        if all_bins:
            for b in all_bins:
                latest_log = get_latest_log(b.bin_id)
                if latest_log:
                    result.append({
                        "bin_id": b.bin_id,
                        "name": get_bin_name(b.bin_id),
                        "location": get_bin_location(b.bin_id),
                        "capacity": latest_log.capacity,
                        "liquid_detected": latest_log.liquid_detected,
                        "last_cleared": get_last_cleared_timing(b.bin_id),
                        "last_activity": get_last_log_timing(b.bin_id),
                        "alert": get_smartbin_alert_status(b.bin_id)
                    })

            response_data = {
                "message": "OK",
                "result": sorted(result, key = itemgetter("alert", "capacity"), reverse = True)
            }
            
        return make_response(jsonify(response_data), 200)


class SmartBinRegistrationAPI(Resource):
    def post(self):
        status_code = 400
        response_data = {"message": "Invalid data received."}

        payload = request.json

        if "mac" in payload.keys():
            mac_address = str(payload["mac"]).upper()

            if not SmartBin.query.get(mac_address):
                if not insert_bin(mac_address):
                    return make_response(jsonify({"message": "Failed to adopt SmartBin."}), 500)
            status_code = 200
            response_data["message"] = "OK"

        return make_response(jsonify(response_data), status_code)
