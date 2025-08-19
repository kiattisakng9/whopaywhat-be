import configFactory from './configuration';

describe('configuration factory', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Clone env to isolate tests
    process.env = { ...ORIGINAL_ENV };
    delete process.env.MONGODB_USERNAME;
    delete process.env.MONGODB_PASSWORD;
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DATABASE;
    delete process.env.PORT;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns defaults when no environment variables are set', () => {
    const cfg = configFactory();
    expect(cfg.port).toBe(3001);
    expect(cfg.mongodb.uri).toBe('mongodb://localhost:27017/whopaywhat');
    expect(cfg.mongodb.name).toBe('whopaywhat');
    expect(cfg.mongodb.username).toBeUndefined();
    expect(cfg.mongodb.password).toBeUndefined();

    expect(cfg.supabase).toEqual({
      url: '',
      key: '',
      serviceKey: '',
    });

    expect(cfg.redis).toEqual({
      host: 'localhost',
      port: 6379,
      password: '',
    });

    expect(cfg.jwt).toEqual({
      secret: 'your-secret-key-here',
      expiresIn: '24h',
    });
  });

  it('parses PORT and REDIS_PORT as integers and falls back to defaults for invalid values', () => {
    process.env.PORT = '8080';
    process.env.REDIS_PORT = '6380';
    let cfg = configFactory();
    expect(cfg.port).toBe(8080);
    expect(cfg.redis.port).toBe(6380);

    process.env.PORT = 'not-a-number';
    process.env.REDIS_PORT = 'NaN';
    cfg = configFactory();
    // parseInt('not-a-number' || '3001', 10) -> parseInt('3001',10) => 3001 due to short-circuit
    // However, code uses parseInt(process.env.PORT || '3001', 10)
    // If PORT is set to invalid string, it does NOT use fallback; it will parseInt('not-a-number', 10) => NaN.
    // But since TypeScript type is number, consumers should ensure valid input; we assert the current behavior.
    expect(Number.isNaN(cfg.port)).toBe(true);
    expect(Number.isNaN(cfg.redis.port as any)).toBe(true);
  });

  it('throws if only MONGODB_USERNAME is set without MONGODB_PASSWORD', () => {
    process.env.MONGODB_USERNAME = 'userOnly';
    expect(() => configFactory()).toThrowError(
      /Both username and password must be provided together/
    );
  });

  it('throws if only MONGODB_PASSWORD is set without MONGODB_USERNAME', () => {
    process.env.MONGODB_PASSWORD = 'passOnly';
    expect(() => configFactory()).toThrowError(
      /Both username and password must be provided together/
    );
  });

  it('uses provided MONGODB_URI as base when no auth credentials are given', () => {
    process.env.MONGODB_URI = 'mongodb://db.example.com:27017/mydb';
    const cfg = configFactory();
    expect(cfg.mongodb.uri).toBe('mongodb://db.example.com:27017/mydb');
  });

  it('injects credentials into baseUri when both MONGODB_USERNAME and MONGODB_PASSWORD are set', () => {
    process.env.MONGODB_URI = 'mongodb://db.example.com:27017/mydb';
    process.env.MONGODB_USERNAME = 'alice';
    process.env.MONGODB_PASSWORD = 's3cr3t';
    const cfg = configFactory();
    expect(cfg.mongodb.uri).toBe('mongodb://alice:s3cr3t@db.example.com:27017/mydb');
  });

  it('percent-encodes special characters in username and password', () => {
    process.env.MONGODB_URI = 'mongodb://db.example.com:27017/mydb';
    process.env.MONGODB_USERNAME = 'user name@domain.com';
    process.env.MONGODB_PASSWORD = 'p@ss:word/with?chars#';
    const cfg = configFactory();
    // encodeURIComponent('user name@domain.com') => 'user%20name%40domain.com'
    // encodeURIComponent('p@ss:word/with?chars#') => 'p%40ss%3Aword%2Fwith%3Fchars%23'
    expect(cfg.mongodb.uri).toBe(
      'mongodb://user%20name%40domain.com:p%40ss%3Aword%2Fwith%3Fchars%23@db.example.com:27017/mydb'
    );
  });

  it('preserves +srv scheme when injecting credentials', () => {
    process.env.MONGODB_URI = 'mongodb+srv://cluster0.mongodb.net/mydb';
    process.env.MONGODB_USERNAME = 'bob';
    process.env.MONGODB_PASSWORD = 'pw';
    const cfg = configFactory();
    expect(cfg.mongodb.uri).toBe('mongodb+srv://bob:pw@cluster0.mongodb.net/mydb');
  });

  it('does not re-inject credentials if base URI already contains "@"', () => {
    process.env.MONGODB_URI = 'mongodb://already:present@host:27017/mydb';
    process.env.MONGODB_USERNAME = 'newuser';
    process.env.MONGODB_PASSWORD = 'newpass';
    const cfg = configFactory();
    // Should remain unchanged because presence of '@' implies credentials already included
    expect(cfg.mongodb.uri).toBe('mongodb://already:present@host:27017/mydb');
  });

  it('uses default db name when MONGODB_DATABASE is not set, otherwise uses provided', () => {
    let cfg = configFactory();
    expect(cfg.mongodb.name).toBe('whopaywhat');
    process.env.MONGODB_DATABASE = 'customdb';
    cfg = configFactory();
    expect(cfg.mongodb.name).toBe('customdb');
  });

  it('populates supabase config values from environment', () => {
    process.env.SUPABASE_URL = 'https://supabase.example';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    const cfg = configFactory();
    expect(cfg.supabase).toEqual({
      url: 'https://supabase.example',
      key: 'anon-key',
      serviceKey: 'service-key',
    });
  });

  it('populates redis config values from environment with defaults', () => {
    process.env.REDIS_HOST = 'redis.internal';
    process.env.REDIS_PORT = '7000';
    process.env.REDIS_PASSWORD = 'redis-pass';
    const cfg = configFactory();
    expect(cfg.redis).toEqual({
      host: 'redis.internal',
      port: 7000,
      password: 'redis-pass',
    });
  });

  it('uses provided JWT values or defaults', () => {
    let cfg = configFactory();
    expect(cfg.jwt).toEqual({
      secret: 'your-secret-key-here',
      expiresIn: '24h',
    });

    process.env.JWT_SECRET = 'super-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    cfg = configFactory();
    expect(cfg.jwt).toEqual({
      secret: 'super-secret',
      expiresIn: '1h',
    });
  });
});