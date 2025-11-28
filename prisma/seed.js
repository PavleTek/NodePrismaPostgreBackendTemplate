const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if any users exist in the database
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    console.log(`ℹ️  Database already contains ${existingUserCount} user(s). Skipping user creation.`);
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Users already exist in database (${existingUserCount} user(s))`);
    return;
  }

  // Check if any roles exist in the database
  const existingRoleCount = await prisma.role.count();
  let roles;
  
  if (existingRoleCount > 0) {
    console.log(`ℹ️  Database already contains ${existingRoleCount} role(s). Skipping role creation.`);
    // Still need to fetch existing roles for user creation
    roles = await prisma.role.findMany();
    console.log(`  Using existing roles: ${roles.map(r => r.name).join(', ')}`);
  } else {
    // Create roles (only if none exist)
    console.log('📝 Creating roles...');
    const roleNames = ['admin', 'manager', 'operator', 'salesperson', 'accountant'];
    roles = [];

    for (const roleName of roleNames) {
      const newRole = await prisma.role.create({
        data: { name: roleName }
      });
      roles.push(newRole);
      console.log(`  ✅ Role "${roleName}" created`);
    }
    console.log(`✅ Created ${roles.length} new role(s): ${roleNames.join(', ')}`);
  }

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('asdf', 12);

  // Create users with individual roles
  console.log('👥 Creating users...');
  
  const userDefinitions = [
    {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Admin',
      lastName: 'User',
      roleIndex: 0, // admin role
      roleName: 'admin'
    },
    {
      email: 'manager@example.com',
      username: 'manager',
      name: 'Manager',
      lastName: 'User',
      roleIndex: 1, // manager role
      roleName: 'manager'
    },
    {
      email: 'operator@example.com',
      username: 'operator',
      name: 'Operator',
      lastName: 'User',
      roleIndex: 2, // operator role
      roleName: 'operator'
    },
    {
      email: 'salesperson@example.com',
      username: 'salesperson',
      name: 'Sales',
      lastName: 'Person',
      roleIndex: 3, // salesperson role
      roleName: 'salesperson'
    },
    {
      email: 'accountant@example.com',
      username: 'accountant',
      name: 'Accountant',
      lastName: 'User',
      roleIndex: 4, // accountant role
      roleName: 'accountant'
    },
    {
      email: 'superadmin@example.com',
      username: 'superadmin',
      name: 'Super',
      lastName: 'Admin',
      roleIndex: null, // all roles
      roleName: 'all roles'
    }
  ];

  const createdUsers = [];

  for (const userDef of userDefinitions) {
    const userData = {
      email: userDef.email,
      username: userDef.username,
      hashedPassword,
      name: userDef.name,
      lastName: userDef.lastName,
      userRoles: {
        create: userDef.roleIndex === null
          ? roles.map(role => ({ roleId: role.id }))
          : [{ roleId: roles[userDef.roleIndex].id }]
      }
    };

    const newUser = await prisma.user.create({
      data: userData
    });
    createdUsers.push(userDef.username);
    console.log(`  ✅ User "${userDef.username}" (${userDef.email}) created with ${userDef.roleName} role(s)`);
  }

  console.log(`✅ Created ${createdUsers.length} new user(s): ${createdUsers.join(', ')}`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  if (existingRoleCount === 0) {
    console.log(`  - ${roles.length} new role(s) created`);
  } else {
    console.log(`  - Used existing roles (${existingRoleCount} role(s) already existed)`);
  }
  console.log(`  - ${createdUsers.length} new user(s) created`);
  console.log('  - All new users have password: "asdf"');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });