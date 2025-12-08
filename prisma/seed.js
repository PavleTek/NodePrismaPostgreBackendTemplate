const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check and seed Roles
  const existingRoleCount = await prisma.role.count();
  let roles = [];
  
  if (existingRoleCount > 0) {
    console.log(`ℹ️  Database already contains ${existingRoleCount} role(s). Skipping role creation.`);
    roles = await prisma.role.findMany();
    console.log(`  Using existing roles: ${roles.map(r => r.name).join(', ')}`);
  } else {
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

  // Check and seed Users
  const existingUserCount = await prisma.user.count();
  let createdUsers = [];

  if (existingUserCount > 0) {
    console.log(`ℹ️  Database already contains ${existingUserCount} user(s). Skipping user creation.`);
  } else {
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
  }

  // Check and seed Countries
  const existingCountryCount = await prisma.country.count();
  
  if (existingCountryCount > 0) {
    console.log(`ℹ️  Database already contains ${existingCountryCount} countr(ies). Skipping country seeding.`);
  } else {
    console.log('🌍 Seeding countries...');
    const countriesPath = path.join(__dirname, 'countries.json');
    const countriesData = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
    const importantCountryCodes = ['US', 'CL', 'CN'];
    
    let countriesCreated = 0;
    
    for (const country of countriesData) {
      const isImportant = importantCountryCodes.includes(country.code);
      await prisma.country.create({
        data: {
          name: country.name,
          code: country.code,
          important: isImportant
        }
      });
      countriesCreated++;
    }
    console.log(`  ✅ Countries: ${countriesCreated} created`);
  }

  // Check and seed Currencies
  const existingCurrencyCount = await prisma.currency.count();
  
  if (existingCurrencyCount > 0) {
    console.log(`ℹ️  Database already contains ${existingCurrencyCount} currenc(ies). Skipping currency seeding.`);
  } else {
    console.log('💱 Seeding currencies...');
    const currenciesPath = path.join(__dirname, 'Common-Currency.json');
    const currenciesData = JSON.parse(fs.readFileSync(currenciesPath, 'utf8'));
    const importantCurrencyCodes = ['CNY', 'CLP', 'USD', 'EUR'];
    
    let currenciesCreated = 0;
    
    for (const [code, currency] of Object.entries(currenciesData)) {
      const isImportant = importantCurrencyCodes.includes(code);
      await prisma.currency.create({
        data: {
          code: code,
          name: currency.name,
          symbol: currency.symbol,
          symbolNative: currency.symbol_native,
          decimalDigits: currency.decimal_digits,
          rounding: currency.rounding,
          namePlural: currency.name_plural,
          important: isImportant
        }
      });
      currenciesCreated++;
    }
    console.log(`  ✅ Currencies: ${currenciesCreated} created`);
  }

  // Check and seed Languages
  const existingLanguageCount = await prisma.language.count();
  
  if (existingLanguageCount > 0) {
    console.log(`ℹ️  Database already contains ${existingLanguageCount} language(s). Skipping language seeding.`);
  } else {
    console.log('🗣️  Seeding languages...');
    const languagesPath = path.join(__dirname, 'language.json');
    const languagesData = JSON.parse(fs.readFileSync(languagesPath, 'utf8'));
    const importantLanguageCodes = ['en', 'es'];
    
    // Transform object to array
    const languagesArray = Object.entries(languagesData).map(([code, name]) => ({
      code,
      name
    }));
    
    let languagesCreated = 0;
    
    for (const language of languagesArray) {
      const isImportant = importantLanguageCodes.includes(language.code);
      await prisma.language.create({
        data: {
          code: language.code,
          name: language.name,
          important: isImportant
        }
      });
      languagesCreated++;
    }
    console.log(`  ✅ Languages: ${languagesCreated} created`);
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  if (existingRoleCount === 0) {
    console.log(`  - ${roles.length} new role(s) created`);
  } else {
    console.log(`  - Roles already exist in database (${existingRoleCount} role(s))`);
  }
  if (existingUserCount === 0) {
    console.log(`  - ${createdUsers.length} new user(s) created`);
    console.log('  - All new users have password: "asdf"');
  } else {
    console.log(`  - Users already exist in database (${existingUserCount} user(s))`);
  }
  if (existingCountryCount === 0) {
    console.log(`  - Countries seeded`);
  } else {
    console.log(`  - Countries already exist in database (${existingCountryCount} countr(ies))`);
  }
  if (existingCurrencyCount === 0) {
    console.log(`  - Currencies seeded`);
  } else {
    console.log(`  - Currencies already exist in database (${existingCurrencyCount} currenc(ies))`);
  }
  if (existingLanguageCount === 0) {
    console.log(`  - Languages seeded`);
  } else {
    console.log(`  - Languages already exist in database (${existingLanguageCount} language(s))`);
  }
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