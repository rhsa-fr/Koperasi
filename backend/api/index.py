from app.main import app
import os
from app.database import init_db

# Ensure uploads folder exists in serverless env
# Note: Vercel serverless has a read-only filesystem except for /tmp
# Persistent uploads need to be migrated to Vercel Blob later
if not os.path.exists('/tmp/uploads'):
    os.makedirs('/tmp/uploads', exist_ok=True)

# In serverless, we only want to init DB if explicitly requested via env var
# to prevent overhead on every cold start. 
# Tables should ideally be created via migrations or a one-time script.
if os.getenv("INIT_DB") == "true":
    try:
        init_db()
    except Exception as e:
        print(f"Database initialization failed: {e}")

# This is the expected variable name for Vercel
handler = app
