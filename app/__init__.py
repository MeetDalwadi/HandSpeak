from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from app.config import Config
from datetime import datetime

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static', template_folder='templates')

    # Load configuration
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from app.routes.main import main_bp
    app.register_blueprint(main_bp)

    from app.sign_to_text import sign_to_text_bp
    app.register_blueprint(sign_to_text_bp)

    from app.text_to_sign import text_to_sign_bp
    app.register_blueprint(text_to_sign_bp)

    from app.learning import learning_bp
    app.register_blueprint(learning_bp)

    from app.practice import practice_bp
    app.register_blueprint(practice_bp)

    # Add template context processor
    @app.context_processor
    def inject_now():
        return {'now': datetime.utcnow()}

    return app