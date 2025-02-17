from flask import Blueprint

sign_to_text_bp = Blueprint('sign_to_text', __name__, url_prefix='/sign_to_text',
                   template_folder='templates',
                   static_folder='static')

from app.sign_to_text import routes  # Import routes after creating blueprint   