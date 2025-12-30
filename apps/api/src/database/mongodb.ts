import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from '../config/env';

const connectToDatabase = async () => {
  if (!DB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.<development/production>.local'
    );
  }
  try {
    await mongoose.connect(DB_URI);
    console.log(`Connected to database in ${NODE_ENV} mode`);
  } catch (error) {
    console.error('Error connecting to database: ', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
};

export { connectToDatabase, disconnectDB };
