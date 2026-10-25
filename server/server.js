import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`360ChildCare API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  })
  .catch((err) => {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });