
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker

engine = create_engine('mysql+pymysql://root:@localhost/koperasi_sp')
Session = sessionmaker(bind=engine)
db = Session()

role_id = 5
data = {'permissions': [{'menu': 'dashboard', 'actions': ['read']}, {'menu': 'users', 'actions': ['read', 'create']}]}

db.execute(text('DELETE FROM master_role_menu WHERE role_id = :r'), {'r': role_id})
for p in data.get('permissions', []):
    menu_name = p.get('menu')
    for action in p.get('actions', []):
        menu_item = db.execute(text('SELECT id_permission FROM master_menu WHERE menu=:m AND action=:a'), {'m': menu_name, 'a': action}).first()
        if menu_item:
            db.execute(text('INSERT INTO master_role_menu (role_id, permission_id) VALUES (:r, :p)'), {'r': role_id, 'p': menu_item[0]})
db.commit()

res = db.execute(text('SELECT * FROM master_role_menu WHERE role_id = :r'), {'r': role_id}).fetchall()
for r in res: print(r)

