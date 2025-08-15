const DB_NAME = process.env.MONGODB_DATABASE || 'whopaywhat';
const DB_USER = process.env.MONGODB_USERNAME || 'admin';
const DB_PASSWORD = process.env.MONGODB_PASSWORD || 'mongo-admin@123';

// Create the database and user
console.log('Creating database: ', DB_NAME);
console.log('Creating user: ', DB_USER);
db = db.getSiblingDB(DB_NAME);

// Only create user if it doesn't already exist
try {
  db.createUser({
    user: DB_USER,
    pwd: DB_PASSWORD,
    roles: [
      { role: 'readWrite', db: DB_NAME },
      { role: 'dbAdmin', db: DB_NAME },
    ],
  });
  console.log('User created successfully');
} catch (error) {
  if (error.code === 51003) {
    console.log('User already exists, skipping user creation');
  } else {
    console.log('Error creating user:', error.message);
  }
}

// Create collections with validations
try {
  console.log('Creating users collection...');
  createUsersCollection(db);
  console.log('Users collection created successfully');
} catch (error) {
  console.log('Error creating users collection:', error.message);
}

try {
  console.log('Creating groups collection...');
  createGroupsCollection(db);
  console.log('Groups collection created successfully');
} catch (error) {
  console.log('Error creating groups collection:', error.message);
}

try {
  console.log('Creating receipts collection...');
  createReceiptsCollection(db);
  console.log('Receipts collection created successfully');
} catch (error) {
  console.log('Error creating receipts collection:', error.message);
}

try {
  console.log('Creating items collection...');
  createItemsCollection(db);
  console.log('Items collection created successfully');
} catch (error) {
  console.log('Error creating items collection:', error.message);
}

console.log('Database initialization completed!');
console.log('Collections in database:', db.getCollectionNames());

// Collection creation functions
function createUsersCollection(db) {
  db.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name'],
        properties: {
          name: { bsonType: 'string' },
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          },
          createdAt: { bsonType: 'date' },
        },
      },
    },
  });

  db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
}

function createGroupsCollection(db) {
  db.createCollection('groups', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'members'],
        properties: {
          name: { bsonType: 'string' },
          createdBy: { bsonType: 'objectId' },
          members: {
            bsonType: 'array',
            minItems: 1,
            items: {
              bsonType: 'object',
              required: ['userId'],
              properties: {
                userId: { bsonType: 'objectId' },
                joinedAt: { bsonType: 'date' },
                isActive: { bsonType: 'bool' },
              },
            },
          },
          createdAt: { bsonType: 'date' },
        },
      },
    },
  });
}

function createReceiptsCollection(db) {
  db.createCollection('receipts', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['payerId', 'total', 'currency'],
        properties: {
          payerId: { bsonType: 'objectId' },
          groupId: { bsonType: 'objectId' },
          shopName: { bsonType: 'string' },
          date: { bsonType: 'date' },
          total: { bsonType: 'number', minimum: 0 },
          tax: { bsonType: 'number', minimum: 0 },
          currency: {
            bsonType: 'string',
            enum: ['THB'], // Add more as needed
          },
          imageUrl: { bsonType: 'string' },
          items: {
            bsonType: 'array',
            items: { bsonType: 'objectId' },
          },
          createdAt: { bsonType: 'date' },
        },
      },
    },
  });

  db.receipts.createIndex({ payerId: 1 });
  db.receipts.createIndex({ groupId: 1 });
}

function createItemsCollection(db) {
  db.createCollection('items', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['receiptId', 'name', 'price', 'splits'],
        properties: {
          receiptId: { bsonType: 'objectId' },
          name: { bsonType: 'string' },
          price: { bsonType: 'number', minimum: 0 },
          quantity: {
            bsonType: 'number',
            minimum: 1,
          },
          splits: {
            bsonType: 'array',
            minItems: 1,
            items: {
              bsonType: 'object',
              required: ['userId', 'share'],
              properties: {
                userId: { bsonType: 'objectId' },
                share: {
                  bsonType: 'number',
                  minimum: 0,
                  maximum: 1, // Represents percentage (0-1)
                },
                isCustom: { bsonType: 'bool' },
              },
            },
          },
        },
      },
    },
  });

  db.items.createIndex({ receiptId: 1 });
}
