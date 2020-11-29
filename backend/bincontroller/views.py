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

from flask import Blueprint, redirect, render_template, session


bp: Blueprint = Blueprint("views", __name__)


@bp.route("/", methods=["GET"])
def index():
	return render_template("index.html")


@bp.route("/favicon.ico", methods=["GET"])
def favicon():
    return redirect("/static/img/favicon.png")
