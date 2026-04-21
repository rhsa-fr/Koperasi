
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.sidebar import MasterSidebar

engine = create_engine('mysql+pymysql://root:@localhost/koperasi_sp')
Session = sessionmaker(bind=engine)
db = Session()

query = db.query(MasterSidebar).filter(MasterSidebar.is_active == True)
results = query.order_by(MasterSidebar.order_weight.asc()).all()
print('Total sidebar elements:', len(results))

