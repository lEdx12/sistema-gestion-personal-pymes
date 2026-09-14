const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mockAuth = require('./middleware/mockAuth');
const empleadosRoutes = require('./routes/empleados.routes');
const contratosRoutes = require('./routes/contratos.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(mockAuth);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', user: req.user });
});

app.use('/api/empleados', empleadosRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/asistencia', asistenciaRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
