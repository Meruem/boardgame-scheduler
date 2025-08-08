const { PrismaClient } = require('../src/generated/prisma');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('Initializing database...');
  
  // Ensure the database file can be created
  const dbPath = process.env.DATABASE_URL?.replace('file:', '');
  if (dbPath && dbPath !== '/tmp/prisma.db') {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    }
  }
  
  const prisma = new PrismaClient();
  
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Simple test query to ensure tables exist
    const sessionCount = await prisma.gameSession.count();
    console.log(`Database is ready. Current sessions: ${sessionCount}`);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
