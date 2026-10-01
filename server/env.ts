// Imported first by every entry point: other modules read process.env at load time.
try {
  process.loadEnvFile(); // .env in the working directory; real env vars take precedence
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
