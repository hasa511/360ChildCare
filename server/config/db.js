  import mongoose from 'mongoose';

  export default async function connectDB(uri = process.env.MONGO_URI) {
    if (!uri) throw new Error('MONGO_URI is not defined in environment variables');
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  }