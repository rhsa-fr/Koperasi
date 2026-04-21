const mysql = require('mysql2/promise');
async function run() {
  const connection = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'koperasi_simpan_pinjam'});
  const [rows] = await connection.execute('SELECT * FROM master_sidebar;');
  console.log('--- Sidebar ---');
  console.log(rows);
  const [perms] = await connection.execute('SELECT mm.menu, mm.action FROM master_role_menu mrm JOIN master_role mr ON mr.id_role = mrm.role_id JOIN master_menu mm ON mm.id_permission = mrm.permission_id WHERE mr.name = \'teler\';');
  console.log('--- Teler Permissions ---');
  console.log(perms);
  connection.end();
}
run();
