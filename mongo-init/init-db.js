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
  // 51003: UserAlreadyExists (newer MongoDB versions), 11000: DuplicateKey (older versions)
  if (error && (error.code === 51003 || error.code === 11000)) {
    console.log('User already exists, skipping user creation');
  } else {
    // Fail fast on unexpected errors so the container doesn't come up misconfigured
    throw error;
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

/**
 * Create the `users` collection with a JSON Schema validator and a unique sparse email index.
 *
 * The collection requires documents to include a `name` (string). Optional fields validated:
 * - `email`: string matching a basic email regex.
 * - `createdAt`: BSON Date.
 *
 * Also creates a unique, sparse index on `email` to enforce uniqueness only for documents that include an email.
 */
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

/**
 * Create the "groups" collection with a JSON Schema validator for group documents.
 *
 * The validator requires "name" and "members". Documents may include:
 * - name: string
 * - createdBy: ObjectId
 * - members: non-empty array of objects each requiring "userId" (ObjectId), and optionally "joinedAt" (date) and "isActive" (boolean)
 * - createdAt: date
 *
 * The function performs no return value and assumes `db` is a MongoDB database handle.
 */
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

/**
 * Create the "receipts" collection with a JSON Schema validator and useful indexes.
 *
 * The collection enforces that documents are objects and require: `payerId`, `total`, and `currency`.
 * Validated fields include:
 * - payerId, groupId: ObjectId references
 * - shopName: string
 * - date, createdAt: date
 * - total, tax: numbers (minimum 0)
 * - currency: string (currently restricted to `'THB'`)
 * - imageUrl: string
 * - items: array of ObjectId (references to item documents)
 *
 * After creating the collection and validator, this function creates indexes on `payerId`
 * and `groupId` to optimize common queries.
 */
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

/**
 * Create the "items" collection with a JSON Schema validator and an index on receiptId.
 *
 * The collection requires documents to include `receiptId`, `name`, `price`, and `splits`.
 * - `receiptId`: ObjectId reference to the parent receipt.
 * - `name`: string.
 * - `price`: number >= 0.
 * - `quantity` (optional): number >= 1.
 * - `splits`: non-empty array of objects each requiring `userId` (ObjectId) and `share` (number between 0 and 1); `isCustom` may be provided as a boolean.
 *
 * Side effects: creates the collection (if not present) with the validator and creates an index on `receiptId`.
 */
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
