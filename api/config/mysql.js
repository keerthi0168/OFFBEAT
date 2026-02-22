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

const connectWithMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established successfully');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('All models synchronized successfully');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectWithMySQL };