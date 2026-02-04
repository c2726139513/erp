const { execSync } = require('child_process');

console.log('Running Prisma migrations for Vercel Postgres...');

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
