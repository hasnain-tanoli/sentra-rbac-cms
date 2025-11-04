import { connectDB } from '@/lib/db/connection';
import { seedPermissions } from '@/lib/db/seed/seedPermissions';
import { Role } from '@/lib/db/models/role.model';
import { assignPermissionsToRole } from '@/lib/rbac/assignPermissions';
import { Permission } from '@/lib/db/models/permission.model';

interface MongoError extends Error {
    code?: number;
}

async function seed() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined! Check your .env.local file and package.json script.");
        }

        console.log('🌱 Starting database seed...\n');

        await connectDB();

        console.log('📝 Creating permissions...');
        await seedPermissions();

        console.log('\n👥 Creating roles...');
        const roles = [
            { title: 'Super Admin', key: 'super_admin', description: 'Full system access', is_system: true },
            { title: 'Editor', key: 'editor', description: 'Manage posts and users', is_system: true },
            { title: 'Author', key: 'author', description: 'Create and edit own posts', is_system: true }
        ];

        try {
            await Role.insertMany(roles, { ordered: false });
            console.log('✅ Roles created');
        } catch (error) {
            const mongoError = error as MongoError;
            if (mongoError.code === 11000) {
                console.log('ℹ️  Roles already exist');
            } else { throw error; }
        }

        console.log('\n🔐 Assigning permissions...');

        const superAdmin = await Role.findOne({ key: 'super_admin' });
        if (superAdmin) {
            const allPermissions = await Permission.find();
            const count = await assignPermissionsToRole(superAdmin._id, allPermissions.map(p => p.key));
            console.log(`✅ Super Admin: ${count} permissions assigned`);
        }

        const editor = await Role.findOne({ key: 'editor' });
        if (editor) {
            const count = await assignPermissionsToRole(editor._id, ['posts_create', 'posts_read', 'posts_update', 'posts_delete', 'users_read', 'users_update']);
            console.log(`✅ Editor: ${count} permissions assigned`);
        }

        const author = await Role.findOne({ key: 'author' });
        if (author) {
            const count = await assignPermissionsToRole(author._id, ['posts_create', 'posts_read', 'posts_update']);
            console.log(`✅ Author: ${count} permissions assigned`);
        }

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();