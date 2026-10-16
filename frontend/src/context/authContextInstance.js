import { createContext } from 'react';

// Objeto del contexto en su propio archivo (sin JSX) para que tanto AuthContext.jsx
// (el componente AuthProvider) como useAuth.js (el hook) sean "solo componente" /
// "solo hook" cada uno — requisito de React Fast Refresh para no romper el HMR.
export const AuthContext = createContext(null);
