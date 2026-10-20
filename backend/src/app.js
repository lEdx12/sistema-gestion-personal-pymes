const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const empleadosRoutes = require('./routes/empleados.routes');
const contratosRoutes = require('./routes/contratos.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const liquidacionesRoutes = require('./routes/liquidaciones.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const alertasRoutes = require('./routes/alertas.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Público: login/logout. Todo lo que sigue exige un JWT válido (RF-01).
app.use('/api/auth', authRoutes);
app.use(auth);

app.use('/api/empleados', empleadosRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/liquidaciones', liquidacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/alertas', alertasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
