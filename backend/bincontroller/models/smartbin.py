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

from bincontroller.models import db


class SmartBin(db.Model):
    __tablename__ = "smartbins"
    bin_id = db.Column(db.String(12), primary_key = True)
    name = db.Column(db.Text, nullable = False)
    location = db.Column(db.Text, nullable = False)
    binlogs = db.relationship("BinLog", backref = "smartbin", cascade = "all,delete")

    def __init__(self, bin_id, name = "Unknown", location = "Unknown"):
        self.bin_id = str(bin_id).upper()
        self.name = str(name)
        self.location = str(location)

    def __str__(self):
        return self.bin_id


def insert_bin(bin_id):
    row = SmartBin(bin_id)

    try:
        db.session.add(row)
        db.session.commit()
    except:
        db.session.rollback()
        return False
    finally:
        db.session.close()

    return True


def get_bin_name(bin_id):
    row = SmartBin.query.get(bin_id.upper())

    if row:
        return row.name
    return None


def get_bin_location(bin_id):
    row = SmartBin.query.get(bin_id.upper())

    if row:
        return row.location
    return None


def update_bin_name(bin_id, name):
    row = SmartBin.query.get(bin_id.upper())

    if row:
        try:
            row.name = str(name)
            db.session.add(row)
            db.session.commit()
            return True
        except:
            db.session.rollback()
        finally:
            db.session.close()
    return False


def update_bin_location(bin_id, location):
    row = SmartBin.query.get(bin_id.upper())

    if row:
        try:
            row.location = str(location)
            db.session.add(row)
            db.session.commit()
            return True
        except:
            db.session.rollback()
        finally:
            db.session.close()
    return False


def delete_bin(bin_id):
    row = SmartBin.query.get(bin_id.upper())

    if row:
        try:
            db.session.delete(row)
            db.session.commit()
            return True
        except:
            db.session.rollback()
        finally:
            db.session.close()
    return False
