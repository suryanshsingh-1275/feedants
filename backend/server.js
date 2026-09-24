require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/competitions', competitionRoutes);
// nested under the same base path: /api/competitions/:id/register, /:id/submit, /:id/registrations
app.use('/api/competitions', registrationRoutes);

app.get('/', (req, res) => res.send('Feedants API is running'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
