import { Config, defineConfig } from "drizzle-kit"
import "dotenv/config";

export default defineConfig({
    schema: "./src/server/db/schema.ts",
    out: "./drizzle", // output directory for generated files
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "",
    }
}) satisfies Config