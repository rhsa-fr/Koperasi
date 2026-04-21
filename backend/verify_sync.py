
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker

# 1. Setup
engine = create_engine('mysql+pymysql://root:@localhost/koperasi_sp')
Session = sessionmaker(bind=engine)
db = Session()

role_id = 5 # Teler
sidebar_ids = [115, 116] # Dashboard, Anggota

# 2. Clear
db.execute(text('DELETE FROM master_role_sidebar WHERE role_id = :r'), {'r': role_id})
db.execute(text('DELETE FROM master_role_menu WHERE role_id = :r'), {'r': role_id})
db.commit()
print('Tables cleared for role 5')

# 3. Replicate update_role_sidebar logic
from app.models.sidebar import MasterSidebar, MasterRoleSidebar
from app.models.role import MasterMenu, MasterRoleMenu

for sid in sidebar_ids:
    db.add(MasterRoleSidebar(role_id=role_id, sidebar_id=sid))
    item = db.query(MasterSidebar).filter(MasterSidebar.id_sidebar == sid).first()
    if item:
        perm = db.query(MasterMenu).filter(MasterMenu.menu == item.resource, MasterMenu.action == 'read').first()
        if perm:
            db.add(MasterRoleMenu(role_id=role_id, permission_id=perm.id_permission))
db.commit()
print('Synchronization replicated')

# 4. Verify
mappings = db.execute(text('SELECT mm.menu, mm.action FROM master_role_menu mrm JOIN master_menu mm ON mm.id_permission = mrm.permission_id WHERE mrm.role_id = :r'), {'r': role_id}).fetchall()
print('Teler Permissions in DB:', mappings)

if len(mappings) >= 2:
    print('SUCCESS: Synchronization worked!')
else:
    print('FAILED: Permissions not synced properly')

