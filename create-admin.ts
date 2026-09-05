import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@tinat.com';
  const password = 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      name: 'System Admin',
      email,
      passwordHash,
      role: 'ADMIN',
      wallet: {
        create: {
          balance: 0,
        }
      }
    },
  });

  console.log('Admin account ready!');
  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
