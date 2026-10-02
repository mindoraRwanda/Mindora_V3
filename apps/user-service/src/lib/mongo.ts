import mongoose from 'mongoose';

// Therapist application documents (license PDFs, IDs) live in GridFS here -
// same shared Mongo instance messaging-service/community-service already
// use, own database per the DB-per-service convention. See object-storage.ts
// for the GridFS read/write side.
const MONGO_URI =
  process.env.MONGO_URI ?? 'mongodb://localhost:27017/mindora_user_documents';

let isConnected = false;

export const connectMongo = async (): Promise<void> => {
  if (isConnected) return;

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    bufferCommands: false,
  });

  isConnected = true;
  console.log('✓ MongoDB connected successfully to', MONGO_URI);

  mongoose.connection.on('error', (error) => {
    console.error('✗ MongoDB connection error:', error.message);
    isConnected = false;
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠ MongoDB disconnected');
    isConnected = false;
  });
  mongoose.connection.on('reconnected', () => {
    isConnected = true;
  });
};

// GridFS bucket for therapist application documents. Lazily reads
// mongoose.connection.db, so must only be called after connectMongo()
// resolves (same lifecycle requirement every model in the sibling Mongo
// services already has).
export function getDocumentsBucket(): mongoose.mongo.GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected - call connectMongo() first');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'therapist_documents' });
}
