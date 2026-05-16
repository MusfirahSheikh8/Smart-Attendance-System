# pyrefly: ignore [missing-import]
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from app import create_app

# Load environment variables
load_dotenv()

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'True').lower() in ['true', '1', 't']
    
    # Clear console
    os.system('cls' if os.name == 'nt' else 'clear')
    
    print(f"=================================")
    print(f"🚀 Python Face Recognition Service starting on port {port}")
    print(f"=================================")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
