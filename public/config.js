// Apenas o Preview do Vercel usa a API local; o GitHub Pages principal continua sem alterações.
window.MESA_CONFIG = {
  apiBaseUrl: location.hostname.endsWith('.vercel.app') ? location.origin : ''
};
