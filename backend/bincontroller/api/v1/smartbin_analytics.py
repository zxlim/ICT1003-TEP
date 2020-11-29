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

from flask import jsonify, make_response
from flask_restful import Resource
from datetime import datetime, timedelta

from bincontroller.models.smartbin import SmartBin
from bincontroller.models.binlog import BinLog


class SmartBinAnalyticsAPI(Resource):
    def get(self, request_type):
        status_code = 400
        response_data = {"message": "Invalid data received."}

        date_range = []
        date_filter = datetime.today() - timedelta(days = 7)

        for i in range(6, -1, -1):
            d = datetime.today() - timedelta(days = i)
            date_range.append(d.strftime("%d %b %Y"))

        all_bins = SmartBin.query.all()

        if request_type.startswith("count_"):
            if request_type == "count_location":
                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = SmartBin.query.group_by(SmartBin.location).count()
            elif request_type == "count_smartbins":
                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = SmartBin.query.count()
            elif request_type == "count_leaking_smartbin":
                count = 0
                for b in all_bins:
                    row = BinLog.query.filter_by(bin_id = b.bin_id).order_by(BinLog.timestamp.desc()).first()
                    if row:
                        if row.liquid_detected:
                            count += 1
                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = count
            elif request_type == "count_capacity_alerts":
                count = 0
                for b in all_bins:
                    row = BinLog.query.filter_by(bin_id = b.bin_id).order_by(BinLog.timestamp.desc()).first()
                    if row:
                        if row.capacity >= 80:
                            count += 1
                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = count
        elif request_type.startswith("chart_"):
            if request_type == "chart_leakages_7_days":
                result = {}
                result["labels"] = date_range
                result["locations"] = {}

                for b in all_bins:
                    previous = False

                    for row in BinLog.query.filter_by(bin_id = b.bin_id).filter(BinLog.timestamp >= date_filter).order_by(BinLog.timestamp.asc()):
                        if row.location not in result["locations"].keys():
                            result["locations"][row.location] = [0, 0, 0, 0, 0, 0, 0]

                        if row.liquid_detected and row.liquid_detected != previous:
                            date_index = date_range.index(row.timestamp.strftime("%d %b %Y"))
                            result["locations"][row.location][date_index] += 1
                        previous = row.liquid_detected

                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = result
            elif request_type == "chart_capacity_7_days":
                result = {}
                result["labels"] = date_range
                result["locations"] = {}

                for b in all_bins:
                    previous = False

                    for row in BinLog.query.filter_by(bin_id = b.bin_id).filter(BinLog.timestamp >= date_filter).order_by(BinLog.timestamp.asc()):
                        if row.location not in result["locations"].keys():
                            result["locations"][row.location] = [0, 0, 0, 0, 0, 0, 0]

                        if row.capacity >= 80 and previous < 80:
                            date_index = date_range.index(row.timestamp.strftime("%d %b %Y"))
                            result["locations"][row.location][date_index] += 1
                        previous = row.capacity

                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = result
            elif request_type == "chart_clearcount_7_days":
                result = {}
                result["labels"] = date_range
                result["locations"] = {}

                for row in BinLog.query.filter_by(is_cleared = True).filter(BinLog.timestamp >= date_filter).order_by(BinLog.timestamp.asc()):
                    if row.location not in result["locations"].keys():
                        result["locations"][row.location] = [0, 0, 0, 0, 0, 0, 0]
                    date_index = date_range.index(row.timestamp.strftime("%d %b %Y"))
                    result["locations"][row.location][date_index] += 1

                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = result
            elif request_type == "chart_location_distribution":
                result = {}
                for row in SmartBin.query.all():
                    if row.location not in result:
                        result[row.location] = 0
                    result[row.location] += 1

                status_code = 200
                response_data["message"] = "OK"
                response_data["result"] = result
        return make_response(jsonify(response_data), status_code)
