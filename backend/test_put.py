
from sqlalchemy import create_engine
from sqlalchemy.sql import text

engine = create_engine('mysql+pymysql://root:@localhost/koperasi_sp')
try:
    with engine.connect() as con:
        # Check MasterMenu
        res = con.execute(text('SELECT id_permission, menu, action FROM master_menu WHERE menu=\'dashboard\' AND action=\'read\'')).first()
        print('Dashboard permission:', res)
        # Check master_role_menu
        teler_role = con.execute(text('SELECT id_role FROM master_role WHERE name=\'teler\'')).first()
        print('Teler Role:', teler_role)
except Exception as e: print(e)

