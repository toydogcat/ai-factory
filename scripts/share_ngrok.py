import os
import sys
import subprocess
import time
from dotenv import load_dotenv

# Path to the .env file in the ai-factory root
ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(ENV_FILE, override=True)

def start_ngrok(port):
    try:
        from pyngrok import ngrok, conf
    except ImportError:
        print("🔍 pyngrok not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyngrok"])
        from pyngrok import ngrok, conf
        
    auth_token = os.getenv("NGROK_AUTHTOKEN")
    if auth_token:
        ngrok.set_auth_token(auth_token)
    else:
        print("⚠️  NGROK_AUTHTOKEN not set in .env!")
        return

    print(f"🚀 Starting ngrok tunnel for port {port}...")
    domain = os.getenv("NGROK_DOMAIN")
    
    try:
        # Use custom domain if provided in .env
        if domain:
            print(f"🌐 Using custom domain: {domain}")
            public_url = ngrok.connect(port, domain=domain).public_url
        else:
            public_url = ngrok.connect(port).public_url
            
        print(f"------------------------------------")
        print(f"🎉 STAGING URL ACTIVE:")
        print(f"👉 {public_url}")
        print(f"------------------------------------")
        
        # Write the URL to a temporary file for run.sh to pick up
        with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "stg_url.txt"), "w") as f:
            f.write(public_url)
            
        # Keep process alive
        ngrok_process = ngrok.get_ngrok_process()
        ngrok_process.proc.wait()
    except Exception as e:
        print(f"❌ ngrok failed: {e}")
    except KeyboardInterrupt:
        print("\n👋 Stopping ngrok...")
        ngrok.kill()

if __name__ == "__main__":
    # In AI-Factory, we tunnel Traefik (Port 80)
    start_ngrok(80)
