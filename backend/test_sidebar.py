
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.sql import text

engine = create_engine('mysql+pymysql://root:@localhost/koperasi_sp')
with engine.connect() as con:
    sidebars = con.execute(text('SELECT * FROM master_sidebar')).fetchall()
    print('--- Sidebars ---')
    for s in sidebars: print(s)

    print('\n--- Teler Perms ---')
    perms = con.execute(text('SELECT mm.menu, mm.action FROM master_role_menu mrm JOIN master_role mr ON mr.id_role = mrm.role_id JOIN master_menu mm ON mm.id_permission = mrm.permission_id WHERE mr.name = \'teler\'')).fetchall()
    for p in perms: print(p)

    print('\n--- Users ---')
    users = con.execute(text('SELECT id_user, username, role FROM user')).fetchall()
    for u in users: print(u)

