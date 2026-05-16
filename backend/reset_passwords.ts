import bcrypt from 'bcryptjs';
import { execute, initPool } from './src/config/database';

async function resetAdminPasswords() {
  try {
    const plainText = 'Admin@123';
    console.log(`Hashing password: ${plainText}`);
    
    // Generate valid hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainText, salt);
    
    console.log(`Generated valid hash: ${hash}`);
    
    // Update passwords
    await initPool();
    const sql = `UPDATE ADMIN SET Credentials = :hash`;
    const result = await execute(sql, { hash });
    
    console.log(`Successfully updated ${result.rowsAffected} admin records with the valid hash!`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetAdminPasswords();
