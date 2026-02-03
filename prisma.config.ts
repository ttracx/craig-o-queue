import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

// Load .env from project root with override
config({ path: resolve(__dirname, ".env"), override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
