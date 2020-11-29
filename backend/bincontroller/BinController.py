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

from flask import Flask
from flask_restful import Api
from sqlalchemy.engine.url import make_url
from sqlalchemy_utils import database_exists, create_database
from werkzeug.middleware.proxy_fix import ProxyFix

from bincontroller.models import db
from bincontroller.models.smartbin import SmartBin
from bincontroller.models.binlog import BinLog
from bincontroller.views import bp as views_bp
from bincontroller.api.v1 import API_V1


def init(config = "bincontroller.config.Production"):
    app = Flask(__name__)

    with app.app_context():
        app.config.from_object(config)

        db_url = make_url(app.config["SQLALCHEMY_DATABASE_URI"])

        if not database_exists(db_url):
            create_database(db_url)

        app.config["SQLALCHEMY_DATABASE_URI"] = str(db_url)
        db.init_app(app)
        try:
            db.create_all()
            app.db = db
        finally:
            db.session.close()

        if app.config["REVERSEPROXY"]:
            app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

        api = Api(app)

        for path, resource in API_V1.items():
            api.add_resource(resource, path)

        app.register_blueprint(views_bp)

    return app
