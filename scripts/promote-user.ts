import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models/user.model';
import { Role } from '@/lib/db/models/role.model';
import { UserRole } from '@/lib/db/models/userRole.model';

async function promoteUser() {
    try {
        const userEmail = process.argv[2];
        if (!userEmail) {
            console.error('❌ Please provide the email of the user to promote.');
            console.error('   Usage: npm run promote -- <user@example.com>');
            process.exit(1);
        }

        console.log(`🚀 Attempting to promote user: ${userEmail}`);
        await connectDB();

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.error(`❌ User with email "${userEmail}" not found.`);
            process.exit(1);
        }
        console.log(`👤 User found: ${user.name} (ID: ${user._id})`);

        const superAdminRole = await Role.findOne({ key: 'super_admin' });
        if (!superAdminRole) {
            console.error('❌ "super_admin" role not found. Please run `npm run seed` first.');
            process.exit(1);
        }
        console.log(`👑 Role found: ${superAdminRole.title} (ID: ${superAdminRole._id})`);

        const existingAssignment = await UserRole.findOne({
            user_id: user._id,
            role_id: superAdminRole._id
        });

        if (existingAssignment) {
            console.log('✅ User already has the "super_admin" role. No action needed.');
            process.exit(0);
        }

        await UserRole.create({
            user_id: user._id,
            role_id: superAdminRole._id,
        });

        console.log('\n🎉 Success! User has been promoted to Super Admin.');
        console.log('You can now log in with their credentials to access all parts of the dashboard.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    }
}

promoteUser();