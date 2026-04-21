from sqlalchemy import create_engine
engine = create_engine('mysql+pymysql://root:@localhost/koperasi_simpan_pinjam')
with engine.connect() as con:
    sidebars = con.execute('SELECT * FROM master_sidebar').fetchall()
    print('--- Sidebars ---')
    for s in sidebars: print(s)

    perms = con.execute('SELECT mm.menu, mm.action FROM master_role_menu mrm JOIN master_role mr ON mr.id_role = mrm.role_id JOIN master_menu mm ON mm.id_permission = mrm.permission_id WHERE mr.name = \'teler\'').fetchall()
    print('--- Teler Perms ---')
    for p in perms: print(p)

