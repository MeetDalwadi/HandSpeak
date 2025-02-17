from flask import render_template
from app.practice import practice_bp

@practice_bp.route('/')
def index():
    return render_template('practice/index.html')
