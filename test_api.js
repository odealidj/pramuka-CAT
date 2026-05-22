const { execSync } = require('child_process');

async function check() {
  const token = execSync('docker exec -i pramukacat_postgres psql -tA -U POSTGRES_USER -d pramukacat -c "SELECT session_id FROM sessions JOIN users ON users.id = sessions.user_id WHERE users.username = \'peserta1\' LIMIT 1;"').toString().trim();
  
  const res = execSync(`curl -s -H "Authorization: Bearer ${token}" http://localhost:8080/api/v1/exams/my-exams`);
  console.log(JSON.stringify(JSON.parse(res.toString()), null, 2));
}
check();
