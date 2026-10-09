const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://admin_tinat_db:64K3A4_lP%3Alkbb77v%3Atb1jDDaPhbX5CH@196.190.212.135:54345/tinat_db?sslmode=disable'
});

async function run() {
  try {
    await pool.query('ALTER TABLE "User" ADD COLUMN "faydaVerified" BOOLEAN NOT NULL DEFAULT false;');
    console.log('Added faydaVerified');
  } catch (e) { console.log(e.message); }
  
  try {
    await pool.query('ALTER TABLE "User" ADD COLUMN "faydaFanHash" TEXT;');
    console.log('Added faydaFanHash');
  } catch (e) { console.log(e.message); }
  
  try {
    await pool.query('ALTER TABLE "User" ADD COLUMN "faydaVerifiedAt" TIMESTAMP(3);');
    console.log('Added faydaVerifiedAt');
  } catch (e) { console.log(e.message); }
  
  try {
    await pool.query('CREATE UNIQUE INDEX "User_faydaFanHash_key" ON "User"("faydaFanHash");');
    console.log('Added index');
  } catch (e) { console.log(e.message); }
}

run().finally(() => pool.end());
