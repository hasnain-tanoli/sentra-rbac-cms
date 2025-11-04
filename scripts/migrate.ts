import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '@/lib/db/connection';
import { User, IUser } from '@/lib/db/models/user.model';
import { Role, IRole } from '@/lib/db/models/role.model';
import { UserRole } from '@/lib/db/models/userRole.model';

type OldUserDocument = IUser & {
    roles?: string[];
};

async function migrateRoles() {
    try {
        console.log('🚀 Starting role migration script...');
        await connectDB();

        const allRoles = await Role.find({});
        if (allRoles.length === 0) {
            console.error('❌ No roles found in the database. Please run the `npm run seed` script first.');
            process.exit(1);
        }
        const roleMap = new Map<string, IRole['_id']>();
        allRoles.forEach(role => {
            roleMap.set(role.key, role._id);
        });
        console.log(`ℹ️  Found ${allRoles.length} roles in the database.`);

        const usersToMigrate = await User.find({ 
            roles: { $exists: true, $ne: [] } 
        }).lean<OldUserDocument[]>();

        if (usersToMigrate.length === 0) {
            console.log('✅ No users found with old role data. Migration is not needed.');
            process.exit(0);
        }

        console.log(`\nFound ${usersToMigrate.length} user(s) to migrate...`);

        let migratedCount = 0;

        for (const user of usersToMigrate) {
            console.log(`\n👤 Migrating user: ${user.email}`);

            if (!user.roles || user.roles.length === 0) {
                console.log('   - No roles to migrate for this user.');
                continue;
            }

            let rolesAssigned = 0;
            for (const roleKey of user.roles) {
                const roleId = roleMap.get(roleKey);

                if (!roleId) {
                    console.warn(`   - ⚠️ Warning: Role with key "${roleKey}" not found. Skipping.`);
                    continue;
                }

                const existingLink = await UserRole.findOne({
                    user_id: user._id,
                    role_id: roleId,
                });

                if (existingLink) {
                    console.log(`   - ℹ️ Link for role "${roleKey}" already exists. Skipping.`);
                    continue;
                }

                await UserRole.create({
                    user_id: user._id,
                    role_id: roleId,
                });
                console.log(`   - ✅ Assigned role "${roleKey}"`);
                rolesAssigned++;
            }

            if (rolesAssigned > 0) {
                await User.updateOne({ _id: user._id }, { $unset: { roles: "" } });
                console.log(`   - ✔️ Successfully migrated ${rolesAssigned} role(s) and cleaned up user document.`);
                migratedCount++;
            } else {
                 console.log(`   - No new roles were assigned for this user.`);
            }
        }

        console.log(`\n🎉 Migration complete! ${migratedCount} user(s) successfully migrated.`);
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateRoles();