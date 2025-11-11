import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    try {
        console.log("🚀 Starting role seeding process...");

        const { seedRoles } = await import("../src/lib/db/seed/roles.seed");

        await seedRoles();
        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to seed roles:", error);
        process.exit(1);
    }
}

main();