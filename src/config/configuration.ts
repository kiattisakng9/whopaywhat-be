export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whopaywhat',
    name: process.env.MONGODB_DATABASE || 'whopaywhat',
    username: process.env.MONGODB_USERNAME || 'admin',
    password: process.env.MONGODB_PASSWORD || 'mongo-admin@123',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});
