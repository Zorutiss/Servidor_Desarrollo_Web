import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 3000;
connectDB(process.env.MONGODB_URI);

app.listen(PORT, () => {
  console.log(`🎙️  PodcastHub API corriendo en http://localhost:${PORT}`);
  console.log(`📚 Swagger disponible en http://localhost:${PORT}/api-docs`);
});
