from flask import Blueprint

practice_bp = Blueprint('practice', __name__, url_prefix='/practice',
                   template_folder='templates',
                   static_folder='static')

from app.practice import routes  # Import routes after creating blueprint
