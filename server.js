const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const exampleRoutes = require('./src/routes/exampleRoutes');
app.use('/api', exampleRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Alex Med Services API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
