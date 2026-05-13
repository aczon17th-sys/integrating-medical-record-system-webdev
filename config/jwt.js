function getJwtSecret() {
  const secret = process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

  if (!secret) {
    throw new Error(
      [
        "JWT_SECRET environment variable is required.",
        "For local development, set JWT_SECRET in .env.",
        "For Docker, Render, or other deployments, set JWT_SECRET in the service environment variables.",
        "Generate one with: npm run generate:jwt-secret"
      ].join(" ")
    );
  }

  return secret;
}

module.exports = { getJwtSecret };
