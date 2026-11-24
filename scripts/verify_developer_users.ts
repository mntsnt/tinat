import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function verify() {
  console.log('--- Verifying Generated Developer Users ---');
  const emails = ['admin@tinat.et', 'researcher@tinat.et', 'participant@tinat.et'];
  const testPassword = 'TinatDev2026!';

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallet: { include: { transactions: true } },
        withdrawals: true,
        studies: { include: { questions: true, responses: true } },
        askProfile: { include: { questions: true } },
        notifications: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      continue;
    }

    const passwordMatches = await bcrypt.compare(testPassword, user.passwordHash);

    console.log(`\n========================================`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email Verified: ${user.isVerified}`);
    console.log(`Fayda Verified: ${user.faydaVerified}`);
    console.log(`Password Matches (${testPassword}): ${passwordMatches}`);
    console.log(`Wallet Balance: ${user.wallet?.balance} TC`);
    console.log(`Notifications: ${user.notifications.length}`);

    if (user.role === 'RESEARCHER') {
      console.log(`Studies Owned: ${user.studies.length}`);
      for (const s of user.studies) {
        console.log(`  - "${s.title}": ${s.questions.length} questions, ${s.responses.length} responses`);
      }
      console.log(`Ask Profile: @${user.askProfile?.username} (${user.askProfile?.questions.length} Q&As)`);
    }

    if (user.role === 'PARTICIPANT') {
      console.log(`Transactions: ${user.wallet?.transactions.length}`);
      console.log(`Withdrawals: ${user.withdrawals.length}`);
      const link = await prisma.participantLink.findFirst({
        where: { userId: user.id },
      });
      console.log(`Participant Link: ${link?.respondentCode} for study ${link?.studyId}`);
    }
  }
}

verify()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
