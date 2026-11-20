import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const email = 'mintesnoh@gmail.com';
  const studyId = 'cmwp2ldtt0001l4i1z0n31gdw';

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(`User not found with email: ${email}`);
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // 1. Assign to StudyDataCollector
  const assignment = await prisma.studyDataCollector.upsert({
    where: {
      studyId_userId: {
        studyId,
        userId: user.id,
      },
    },
    create: {
      studyId,
      userId: user.id,
    },
    update: {},
  });
  console.log('StudyDataCollector assignment ready:', assignment.id);

  // 2. Ensure Data Collector Verification
  const verification = await prisma.verification.upsert({
    where: {
      userId_verificationType: {
        userId: user.id,
        verificationType: 'DATA_COLLECTOR',
      },
    },
    create: {
      userId: user.id,
      verificationType: 'DATA_COLLECTOR',
      status: 'VERIFIED',
      reviewedAt: new Date(),
      verificationReference: 'SPHMMC-FIELD-ATTACHMENT',
    },
    update: {
      status: 'VERIFIED',
    },
  });
  console.log('Verification ready:', verification.status);

  // 3. Send Notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Assigned as Field Collector',
      message:
        'You have been assigned as a Field Collector for "Sheger City Melka Nono Community Health & Demographic Census (SPHMMC)". You can start collecting responses now.',
      linkUrl: `/collector/studies/${studyId}/collect`,
    },
  });
  console.log('Notification sent successfully.');

  // 4. Verify assignment
  const totalCollectors = await prisma.studyDataCollector.count({
    where: { studyId },
  });
  console.log(`Total assigned collectors for study: ${totalCollectors}`);
}

main()
  .catch((e) => {
    console.error('Error assigning collector:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
