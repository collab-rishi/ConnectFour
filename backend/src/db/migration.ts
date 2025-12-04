
import { exec } from 'child_process';
import { promisify } from 'util';


const execPromise = promisify(exec);


async function runMigrations() {
  console.log('Starting database setup and migration...');

  try {
    
    console.log('Applying pending migrations (if any)...');
    const { stdout: migrateStdout } = await execPromise('npx prisma migrate deploy');
    console.log(migrateStdout);

   
    console.log('Generating Prisma Client...');
    const { stdout: generateStdout } = await execPromise('npx prisma generate');
    console.log(generateStdout);

    console.log('Database migration and setup complete.');
    
  } catch (error) {
    console.error('Database migration failed:', error);
    
    if (typeof error === 'object' && error !== null && 'stdout' in error) {
        console.error('Error details:', (error as any).stdout);
    }
    process.exit(1);
  }
}

runMigrations();