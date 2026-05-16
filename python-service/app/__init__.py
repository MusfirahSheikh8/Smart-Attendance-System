# pyrefly: ignore [missing-import]
from flask import Flask
from flask_cors import CORS
from app.utils.db import init_db_pool

def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    
    # Enable CORS for the Node.js backend to communicate with it
    CORS(app)
    
    # Initialize Oracle Database Pool
    with app.app_context():
        init_db_pool()
        
    # Register API Blueprints
    from app.routes.face_routes import face_bp
    app.register_blueprint(face_bp, url_prefix='/api/face')
    
    # Basic Health Check Route
    @app.route('/health', methods=['GET'])
    def health_check():
        return {"status": "OK", "service": "Python Face Recognition API"}, 200
        
    return app
