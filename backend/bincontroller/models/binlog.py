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

from datetime import datetime

from bincontroller.models import db


DAY_IN_SECONDS = 86400
HOUR_IN_SECONDS = 3600
MINUTE_IN_SECONDS = 60


class BinLog(db.Model):
    __tablename__ = "binlog"
    log_id = db.Column(db.Integer, primary_key = True)
    timestamp = db.Column(db.DateTime, nullable = False, default = datetime.now)
    bin_id = db.Column(db.String(12), db.ForeignKey("smartbins.bin_id", ondelete = "CASCADE"), nullable = False)
    name = db.Column(db.Text, nullable = False)
    location = db.Column(db.Text, nullable = False)
    capacity = db.Column(db.Integer, nullable = False)
    liquid_detected = db.Column(db.Boolean, nullable = False)
    is_cleared = db.Column(db.Boolean, nullable = False)

    def __init__(self, bin_id, name, location, capacity, liquid_detected, is_cleared):
        self.bin_id = str(bin_id).upper()
        self.name = str(name)
        self.location = str(location)
        self.capacity = int(capacity)
        self.liquid_detected = bool(liquid_detected)
        self.is_cleared = bool(is_cleared)

    def __str__(self):
        return self.history_id


def insert_log(bin_id, name, location, capacity, liquid_detected, is_cleared):
    row = BinLog(bin_id, name, location, capacity, liquid_detected, is_cleared)

    try:
        db.session.add(row)
        db.session.commit()
    except:
        db.session.rollback()
        return False
    finally:
        db.session.close()

    return True


def update_unknown_binlog_name(bin_id, new_name):
    success = True
    for row in BinLog.query.filter_by(bin_id = str(bin_id).upper(), name = "Unknown"):
        try:
            row.name = str(new_name)
            db.session.add(row)
            db.session.commit()
        except:
            db.session.rollback()
            success = False
        finally:
            db.session.close()
    return success


def update_unknown_binlog_location(bin_id, new_location):
    success = True
    for row in BinLog.query.filter_by(bin_id = str(bin_id).upper(), location = "Unknown"):
        try:
            row.location = str(new_location)
            db.session.add(row)
            db.session.commit()
        except:
            db.session.rollback()
            success = False
        finally:
            db.session.close()
    return success


def get_latest_log(bin_id):
    return BinLog.query.filter_by(bin_id = str(bin_id).upper()).order_by(BinLog.timestamp.desc()).first()


def get_last_cleared_timing(bin_id):
    row = BinLog.query.filter_by(bin_id = str(bin_id).upper(), is_cleared = True).order_by(BinLog.timestamp.desc()).first()

    if row:
        last_cleared_date = row.timestamp
        delta = int((datetime.now() - last_cleared_date).total_seconds())

        if delta >= DAY_IN_SECONDS:
            # Days.
            result = delta // DAY_IN_SECONDS
            if result > 1:
                return f"{result} days ago"
            return f"{result} day ago"
        elif delta >= HOUR_IN_SECONDS:
            # Hours.
            result = delta // HOUR_IN_SECONDS
            if result > 1:
                return f"{result} hours ago"
            return f"{result} hour ago"
        elif delta >= MINUTE_IN_SECONDS:
            # Minutes.
            result = delta // MINUTE_IN_SECONDS
            if result > 1:
                return f"{result} minutes ago"
            return f"{result} minute ago"
        else:
            # Seconds.
            if delta > 20:
                return f"{delta} seconds ago"
            return "Recently"
    return "Never cleared"


def get_last_log_timing(bin_id):
    row = BinLog.query.filter_by(bin_id = str(bin_id).upper()).order_by(BinLog.timestamp.desc()).first()

    if row:
        last_activity_date = row.timestamp
        delta = int((datetime.now() - last_activity_date).total_seconds())

        if delta >= DAY_IN_SECONDS:
            # Days.
            result = delta // DAY_IN_SECONDS
            if result > 1:
                return f"{result} days ago"
            return f"{result} day ago"
        elif delta >= HOUR_IN_SECONDS:
            # Hours.
            result = delta // HOUR_IN_SECONDS
            if result > 1:
                return f"{result} hours ago"
            return f"{result} hour ago"
        elif delta >= MINUTE_IN_SECONDS:
            # Minutes.
            result = delta // MINUTE_IN_SECONDS
            if result > 1:
                return f"{result} minutes ago"
            return f"{result} minute ago"
        else:
            # Seconds.
            if delta > 20:
                return f"{delta} seconds ago"
            return "Recently"
    return "Unknown"


def get_smartbin_alert_status(bin_id):
    bin_id = str(bin_id).upper()
    row = BinLog.query.filter_by(bin_id = bin_id).order_by(BinLog.timestamp.desc()).first()

    if row:
        if row.capacity >= 80 or row.liquid_detected:
            return True

        last_cleared = BinLog.query.filter_by(bin_id = bin_id, is_cleared = True).order_by(BinLog.timestamp.desc()).first()
        now_timestamp = datetime.now()

        if not last_cleared:
            if int((now_timestamp - row.timestamp).total_seconds()) > 172800:
                # Bin was not cleared before and it has been more than 2 days.
                return True
        elif int((now_timestamp - last_cleared.timestamp).total_seconds()) > 172800:
            # It has been more than 2 days since last cleared.
            return True

    return False
