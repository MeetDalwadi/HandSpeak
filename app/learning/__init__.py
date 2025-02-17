from flask import Blueprint

learning_bp = Blueprint('learning', __name__, url_prefix='/learning',
                   template_folder='templates',
                   static_folder='static')

from app.learning import routes  # Import routes after creating blueprint
