from flask import render_template
from app.learning import learning_bp

@learning_bp.route('/')
def index():
    return render_template('learning/index.html')
