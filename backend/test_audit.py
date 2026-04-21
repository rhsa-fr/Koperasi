from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker

engine = create_engine("mysql+pymysql://root:@localhost/koperasi_sp")
Session = sessionmaker(bind=engine)
db = Session()

# 1. Check latest logs
res = db.execute(text("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 5")).fetchall()
print("Latest Logs:", res)

