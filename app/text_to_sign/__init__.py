from flask import Blueprint

text_to_sign_bp = Blueprint('text_to_sign', __name__, url_prefix='/text_to_sign',
                   template_folder='templates',
                   static_folder='static')

from app.text_to_sign import routes  # Import routes after creating blueprint

