export default () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  // Fail-fast check: throw error if exactly one of username or password is set
  if ((username && !password) || (!username && password)) {
    throw new Error(
      'Database configuration error: Both username and password must be provided together, or neither should be set',
    );
  }

  // Build URI with authentication if both credentials are provided
  let mongoUri: string;
  const baseUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/whopaywhat';
  if (username && password) {
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    mongoUri = baseUri.includes('@')
      ? baseUri
      : baseUri.replace(
          /^mongodb(\+srv)?:\/\//,
          (_m, srv) =>
            `mongodb${srv ? '+srv' : ''}://${encodedUsername}:${encodedPassword}@`,
        );
  } else {
    mongoUri = baseUri;
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    mongodb: {
      uri: mongoUri,
      name: process.env.MONGODB_DATABASE || 'whopaywhat',
      username,
      password,
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
  };
};
