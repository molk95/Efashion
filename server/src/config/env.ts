export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (env.nodeEnv === 'production' && env.jwtSecret === 'change-me-in-production') {
  console.warn('⚠️  JWT_SECRET non défini : utilisez une valeur forte en production.');
}
