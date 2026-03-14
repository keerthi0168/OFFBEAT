const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'airbnb_clone',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const toBool = (value, defaultValue = false) => {
  if (typeof value === 'undefined') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const connectWithMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established successfully');

    // Safer sync strategy:
    // - default: sync without alter/force
    // - optional destructive/altering behavior only via env flags
    const shouldForceSync = toBool(process.env.MYSQL_SYNC_FORCE, false);
    const shouldAlterSync = toBool(process.env.MYSQL_SYNC_ALTER, false);

    if (shouldForceSync && shouldAlterSync) {
      console.warn('MYSQL_SYNC_FORCE and MYSQL_SYNC_ALTER are both enabled. FORCE takes precedence.');
    }

    await sequelize.sync({
      force: shouldForceSync,
      alter: !shouldForceSync && shouldAlterSync,
    });

    if (shouldForceSync) {
      console.log('MySQL models synchronized with FORCE mode');
    } else if (shouldAlterSync) {
      console.log('MySQL models synchronized with ALTER mode');
    } else {
      console.log('MySQL models synchronized (safe mode, no alter/force)');
    }
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    console.warn('⚠ MySQL connection failed - running in demo mode. User data won\'t persist.');
  }
};

module.exports = { sequelize, connectWithMySQL };