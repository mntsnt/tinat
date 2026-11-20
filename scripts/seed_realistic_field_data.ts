import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getOrCreateParticipantLink } from '../lib/identity/linkService';

async function main() {
  console.log('--- Seeding Realistic Field Collector Data for Melka Nono Study ---');

  const studyId = 'cmwp2ldtt0001l4i1z0n31gdw';
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!study) {
    throw new Error(`Study not found with id: ${studyId}`);
  }

  console.log(`Target Study: "${study.title}" (${study.questions.length} questions)`);

  // 1. Create or ensure 4 Field Collectors (4th Year SPHMMC Medical Students)
  const collectorsData = [
    {
      name: 'Bethlehem Tesfaye',
      email: 'bethlehem.tesfaye@sphmmc.edu.et',
      username: 'bethlehem_sphmmc',
      phone: '+251911452301',
    },
    {
      name: 'Yonas Bekele',
      email: 'yonas.bekele@sphmmc.edu.et',
      username: 'yonas_sphmmc',
      phone: '+251922894102',
    },
    {
      name: 'Hana Girma',
      email: 'hana.girma@sphmmc.edu.et',
      username: 'hana_sphmmc',
      phone: '+251933104578',
    },
    {
      name: 'Kidus Alemayehu',
      email: 'kidus.alemayehu@sphmmc.edu.et',
      username: 'kidus_sphmmc',
      phone: '+251944567890',
    },
  ];

  const passwordHash = await bcrypt.hash('Collector@Tinat2026!', 10);
  const collectors: any[] = [];

  for (const c of collectorsData) {
    let user = await prisma.user.findUnique({ where: { email: c.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          username: c.username,
          phone: c.phone,
          passwordHash,
          role: 'DATA_COLLECTOR',
          institution: "St. Paul's Hospital Millennium Medical College (SPHMMC)",
          fieldOfStudy: 'Medicine & Public Health (4th Year)',
          isVerified: true,
          faydaVerified: true,
          faydaFanHash: crypto.createHash('sha256').update(`FAN-${c.username}`).digest('hex'),
          faydaVerifiedAt: new Date(),
          termsAcceptedVersion: '1.0',
          termsAcceptedAt: new Date(),
          codeOfConductAcceptedVersion: '1.0',
          codeOfConductAcceptedAt: new Date(),
          dpaAcceptedVersion: '1.0',
          dpaAcceptedAt: new Date(),
        },
      });
      console.log(`Created Field Collector: ${user.name} (${user.email})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'DATA_COLLECTOR',
          isVerified: true,
          faydaVerified: true,
        },
      });
      console.log(`Updated Field Collector: ${user.name}`);
    }
    collectors.push(user);

    // Assign to StudyDataCollector
    const existingAssign = await prisma.studyDataCollector.findUnique({
      where: { studyId_userId: { studyId, userId: user.id } },
    });
    if (!existingAssign) {
      await prisma.studyDataCollector.create({
        data: {
          studyId,
          userId: user.id,
        },
      });
      console.log(`Assigned ${user.name} to study.`);
    }
  }

  // 2. Create Active / Completed Collection Sessions
  const sessions: any[] = [];
  const sessionDescriptions = [
    { collector: collectors[0], location: 'Kebele 01 & Melka Guba enumeration' },
    { collector: collectors[1], location: 'Oda Haro agricultural community census' },
    { collector: collectors[2], location: 'Tullu Dimtu peri-urban households' },
    { collector: collectors[3], location: 'Bereda remote village households' },
  ];

  for (const s of sessionDescriptions) {
    let session = await prisma.collectionSession.findFirst({
      where: { studyId, collectorId: s.collector.id },
    });
    if (!session) {
      session = await prisma.collectionSession.create({
        data: {
          studyId,
          collectorId: s.collector.id,
          startTime: new Date(Date.now() - 3600 * 1000 * 48), // 2 days ago
          endTime: new Date(Date.now() - 3600 * 1000 * 4), // 4 hours ago
          status: 'COMPLETED',
        },
      });
      console.log(`Created collection session for ${s.collector.name}`);
    }
    sessions.push({ session, collector: s.collector, location: s.location });
  }

  // 3. Question Index Map for easy lookup
  const qMap = new Map<number, any>();
  for (const q of study.questions) {
    qMap.set(q.order, q);
  }

  // Helper to pick random item from array
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Helper to pick random int between min and max (inclusive)
  function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 4. Generate 36 realistic household surveys across 4 collectors (9 each)
  const kebeles = [
    { name: '01 Kebele', gotte: ['Gotte 01 (Town Central)', 'Gotte 02 (Lower Riverbank)', 'Salo Village'] },
    { name: 'Melka Guba', gotte: ['Qarsaa Gotte', 'Melka Tullu', 'Guba Biyya'] },
    { name: 'Oda Haro', gotte: ['Haro Chaffee', 'Oda Nono', 'Gotte 03'] },
    { name: 'Tullu Dimtu', gotte: ['Dimtu Market Gotte', 'Tullu Dursitu', 'Watoo'] },
    { name: 'Bereda', gotte: ['Bereda Gadaa', 'Kawa Village', 'Bereda Central'] },
  ];

  const illnesses = [
    'Acute watery diarrhea (AWD) treated at Health Post with ORS and zinc',
    'Severe upper respiratory tract infection (URTI) with high fever',
    'Clinical malaria symptoms (chills and joint pain), received Coartem',
    'Typhoid fever diagnosed at Melka Nono Health Center',
    'Chronic hypertension and arthritis managed with local clinic prescription',
    'Helminthiasis (intestinal worms) and abdominal cramping in school-age child',
    'Gastritis and peptic pain aggravated by irregular nutrition',
    'Scabies and secondary skin rash among younger siblings',
  ];

  console.log('Generating 36 realistic household census responses...');

  for (let i = 0; i < 36; i++) {
    const collectorInfo = sessions[i % sessions.length];
    const kebeleInfo = kebeles[i % kebeles.length];
    const gotteName = pick(kebeleInfo.gotte);
    const houseNumber = `MN-${String(i + 1).padStart(3, '0')}`;

    // Create anonymous household participant placeholder
    const householdUser = await prisma.user.create({
      data: {
        name: `Household Head (${houseNumber})`,
        email: `household-mn-${Date.now()}-${i}@tinat.local`,
        passwordHash: 'NONE',
        role: 'PARTICIPANT',
      },
    });

    const { respondentCode } = await getOrCreateParticipantLink({
      userId: householdUser.id,
      studyId,
    });

    // Demographics
    const isMale = Math.random() < 0.65;
    const sex = isMale ? 'Male' : 'Female';
    const age = randInt(25, 68);
    const religion = Math.random() < 0.7 ? 'Orthodox Christian' : Math.random() < 0.7 ? 'Protestant' : 'Muslim';
    const ethnicity = Math.random() < 0.8 ? 'Oromo' : Math.random() < 0.6 ? 'Amhara' : 'Gurage';
    const marital = Math.random() < 0.8 ? 'Married' : Math.random() < 0.5 ? 'Widowed' : 'Divorced';
    const education = pick([
      'Unable to read and write (Illiterate)',
      'Able only to read and write',
      'Primary school (Grades 1-8)',
      'Primary school (Grades 1-8)',
      'Secondary school (Grades 9-12)',
      'College / University graduate (12+)',
    ]);
    const occupation = pick([
      'Farmer',
      'Farmer',
      'Farmer',
      'Merchant / Trader',
      'Housewife',
      'Daily laborer',
      'Government employee',
    ]);
    const familySize = randInt(4, 9);
    const males = randInt(1, familySize - 1);
    const females = familySize - males;
    const monthlyIncome = randInt(3500, 18500);

    // Vital statistics
    const liveBirths = Math.random() < 0.4 ? 1 : Math.random() < 0.1 ? 2 : 0;
    const stillBirths = Math.random() < 0.05 ? 1 : 0;
    const infantDeaths = Math.random() < 0.08 ? 1 : 0;
    const infantCause = infantDeaths > 0 ? pick(['Severe diarrhea and dehydration', 'Pneumonia and chest indrawing', 'Neonatal infection with fever']) : '';
    const under5Deaths = Math.random() < 0.06 ? 1 : 0;
    const under5Cause = under5Deaths > 0 ? pick(['Late presentation diarrhea and severe malnutrition', 'Acute respiratory failure following measles']) : '';
    const otherDeaths = Math.random() < 0.05 ? 1 : 0;
    const morbidityText = Math.random() < 0.65 ? pick(illnesses) : 'No major severe illnesses registered during the past 12 months';

    // Maternal Health
    const womenRepro = randInt(1, Math.min(3, Math.max(1, females)));
    const ageMarriage = randInt(16, 22);
    const ageBirth = randInt(18, 24);
    const hasPregnancy = Math.random() < 0.35 ? 'Yes' : 'No';
    const unintended = hasPregnancy === 'Yes' ? (Math.random() < 0.25 ? 'Yes' : 'No') : 'Not applicable';
    const maternalDeath = 'No'; // fortunate for community
    const gaveBirth = liveBirths > 0 ? 'Yes' : 'No';
    const placeDelivery = gaveBirth === 'Yes'
      ? (Math.random() < 0.65 ? 'Health Institution (Health center / Hospital / Clinic)' : 'At home')
      : 'Not applicable';
    const homeReason = placeDelivery === 'At home' ? pick(['Labor began suddenly at night without transport', 'Heavy rain and flooded river path to Melka Nono health center', 'Preference for family assistance with traditional attendant']) : '';
    const hadAbortion = Math.random() < 0.08 ? 'Yes' : 'No';
    const abortionSite = hadAbortion === 'Yes' ? (Math.random() < 0.6 ? 'Health institution' : 'Outside health institution') : 'Not applicable';
    const usingFP = Math.random() < 0.72 ? 'Yes' : 'No';
    const fpMethod = usingFP === 'Yes'
      ? pick(['Injectable (Depo-Provera)', 'Implants (Implanon / Jadelle)', 'Oral Contraceptive Pills (OCP)', 'Intrauterine Device (IUCD)'])
      : 'None / Not applicable';
    const noFpReason = usingFP === 'No' ? pick(['Desire to conceive additional children', 'Spousal disapproval or cultural reservations', 'Concern over perceived contraceptive side effects']) : '';

    // Child Health & Feeding
    const breastInit = gaveBirth === 'Yes'
      ? (Math.random() < 0.7 ? 'Within one hour of delivery (Immediate)' : 'Within 24 hours of delivery')
      : 'No child born in household';
    const infantFeed = gaveBirth === 'Yes'
      ? (Math.random() < 0.8 ? 'Exclusive breastfeeding (no water or supplementary foods)' : 'Breastfeeding plus water or other supplementary liquids/foods')
      : 'Not applicable';
    const knowEPI = Math.random() < 0.82 ? 'Yes' : 'No';
    const hasUnderOne = liveBirths > 0 ? 'Yes' : (Math.random() < 0.2 ? 'Yes' : 'No');
    const vaccStatus = hasUnderOne === 'Yes'
      ? (Math.random() < 0.75 ? 'Up to date for age' : Math.random() < 0.6 ? 'Incomplete / Defaulted' : 'Fully completed routine schedule')
      : 'No under-one child';
    const vaccReason = vaccStatus === 'Incomplete / Defaulted' ? pick(['Temporary vaccine stockout at Kebele Health Post', 'Distance and agricultural harvest workload', 'Child fell ill on scheduled vaccination date']) : '';

    // Housing & Environment
    const ownership = Math.random() < 0.9 ? 'Private (Owner-occupied)' : 'Rented';
    const roof = Math.random() < 0.88 ? 'Corrugated iron sheet' : 'Thatched / Grass roof';
    const wall = Math.random() < 0.8 ? 'Mud and wood (Chika wall)' : Math.random() < 0.5 ? 'Stone with mud/cement' : 'Brick / Cement block';
    const floor = Math.random() < 0.75 ? 'Earth / Mud floor' : 'Concrete / Cement screed';
    const rooms = randInt(1, 4);
    const kitchen = pick([
      'Separate room detached from main house',
      'Separate room detached from main house',
      'Separate room attached to main house',
      'No dedicated kitchen (cooking inside main living space)',
    ]);
    const animalCohabit = Math.random() < 0.6 ? 'Yes, animals cohabit with humans' : 'No, separate barn / shelter';
    const ventilation = pick([
      'Presence of functional windows',
      'Dual egress (more than one doorway/exit)',
      'Smoke chimney or roof vents',
    ]);

    // Water & Sanitation
    const waterSource = pick([
      'Protected public tap / Standpipe',
      'Protected dug well / Protected spring',
      'Unprotected spring / Dug well',
      'River / Stream / Lake / Pond',
    ]);
    const waterDist = `${randInt(10, 50)} minutes roundtrip`;
    const treatWater = waterSource.includes('Unprotected') || waterSource.includes('River') ? (Math.random() < 0.5 ? 'Yes' : 'No') : 'No';
    const treatMethod = treatWater === 'Yes' ? pick(['Boiling', 'Chemical treatment (Wuha Agar / Chlorine / WaterGuard)']) : 'Not treated';
    const waterCovered = Math.random() < 0.85 ? 'Yes, always covered' : 'No, uncovered';
    const handwashTimes = pick([
      'After defecation / Latrine use',
      'Before eating food',
      'Before preparing or serving food',
    ]);
    const cleaningAgent = Math.random() < 0.7 ? 'Soap with water' : Math.random() < 0.6 ? 'Ash with water' : 'Water only (without detergent)';
    const latrineAvail = Math.random() < 0.65
      ? 'Yes, private latrine in compound'
      : Math.random() < 0.5
      ? 'Yes, communal / shared neighborhood latrine'
      : 'No latrine (Open field defecation)';
    const latrineType = latrineAvail.startsWith('Yes')
      ? pick(['Traditional pit latrine with slab', 'Traditional pit latrine without slab (open pit)', 'Ventilated Improved Pit (VIP) latrine'])
      : 'Not applicable';
    const latrineLocation = latrineAvail.startsWith('Yes') ? 'Outside the house, within compound boundary' : 'Not applicable';
    const latrineCover = latrineAvail.startsWith('Yes') ? (Math.random() < 0.65 ? 'Yes' : 'No') : 'Not applicable';
    const latrineObs = latrineAvail.startsWith('Yes')
      ? (Math.random() < 0.65 ? 'Yes, covered and clean' : 'Uncovered with flies / odor observed')
      : 'Not applicable';

    // Waste & Media
    const wasteSeg = Math.random() < 0.35 ? 'Yes, wastes are segregated' : 'No segregation';
    const solidWaste = pick([
      'Disposed in designated backyard pit',
      'Burned in open air',
      'Dumped in open field / riverbank',
    ]);
    const liquidWaste = pick([
      'Soak pit / Cesspool',
      'Poured into pit latrine',
      'Discharged into open yard / street ditch',
    ]);
    const mediaSource = pick([
      'Functional radio set',
      'Mobile phone / Smartphone in household',
      'Television set (Satellite / Terrestrial)',
    ]);
    const notes = `Interview conducted by ${collectorInfo.collector.name} (4th-year SPHMMC student). House verified with Melka Nono kebele focal officer.`;

    // Map answers by question order (0 to 67)
    const answersList = [
      // 0..3 (Admin & Consent)
      { order: 0, textValue: 'Sheger Special Zone, Melka Nono Woreda' },
      { order: 1, textValue: `${kebeleInfo.name}, ${gotteName}` },
      { order: 2, textValue: houseNumber },
      { order: 3, textValue: 'Yes, I agree to participate' },

      // 4..14 (Socio-demographics)
      { order: 4, textValue: sex },
      { order: 5, numberValue: age, textValue: String(age) },
      { order: 6, textValue: religion },
      { order: 7, textValue: ethnicity },
      { order: 8, textValue: marital },
      { order: 9, textValue: education },
      { order: 10, textValue: occupation },
      { order: 11, numberValue: familySize, textValue: String(familySize) },
      { order: 12, numberValue: males, textValue: String(males) },
      { order: 13, numberValue: females, textValue: String(females) },
      { order: 14, numberValue: monthlyIncome, textValue: String(monthlyIncome) },

      // 15..22 (Birth, Morbidity & Mortality)
      { order: 15, numberValue: liveBirths, textValue: String(liveBirths) },
      { order: 16, numberValue: stillBirths, textValue: String(stillBirths) },
      { order: 17, numberValue: infantDeaths, textValue: String(infantDeaths) },
      { order: 18, textValue: infantCause },
      { order: 19, numberValue: under5Deaths, textValue: String(under5Deaths) },
      { order: 20, textValue: under5Cause },
      { order: 21, numberValue: otherDeaths, textValue: String(otherDeaths) },
      { order: 22, textValue: morbidityText },

      // 23..36 (Maternal Health)
      { order: 23, numberValue: womenRepro, textValue: String(womenRepro) },
      { order: 24, numberValue: ageMarriage, textValue: String(ageMarriage) },
      { order: 25, numberValue: ageBirth, textValue: String(ageBirth) },
      { order: 26, textValue: hasPregnancy },
      { order: 27, textValue: unintended },
      { order: 28, textValue: maternalDeath },
      { order: 29, textValue: gaveBirth },
      { order: 30, textValue: placeDelivery },
      { order: 31, textValue: homeReason },
      { order: 32, textValue: hadAbortion },
      { order: 33, textValue: abortionSite },
      { order: 34, textValue: usingFP },
      { order: 35, textValue: fpMethod },
      { order: 36, textValue: noFpReason },

      // 37..42 (Child Health & Nutrition)
      { order: 37, textValue: breastInit },
      { order: 38, textValue: infantFeed },
      { order: 39, textValue: knowEPI },
      { order: 40, textValue: hasUnderOne },
      { order: 41, textValue: vaccStatus },
      { order: 42, textValue: vaccReason },

      // 43..50 (Housing Condition)
      { order: 43, textValue: ownership },
      { order: 44, textValue: roof },
      { order: 45, textValue: wall },
      { order: 46, textValue: floor },
      { order: 47, numberValue: rooms, textValue: String(rooms) },
      { order: 48, textValue: kitchen },
      { order: 49, textValue: animalCohabit },
      { order: 50, textValue: ventilation },

      // 51..60 (Water & Sanitation)
      { order: 51, textValue: waterSource },
      { order: 52, textValue: waterDist },
      { order: 53, textValue: treatWater },
      { order: 54, textValue: treatMethod },
      { order: 55, textValue: waterCovered },
      { order: 56, textValue: handwashTimes },
      { order: 57, textValue: cleaningAgent },
      { order: 58, textValue: latrineAvail },
      { order: 59, textValue: latrineType },
      { order: 60, textValue: latrineLocation },

      // 61..67 (Latrine observation, waste, media & notes)
      { order: 61, textValue: latrineCover },
      { order: 62, textValue: latrineObs },
      { order: 63, textValue: wasteSeg },
      { order: 64, textValue: solidWaste },
      { order: 65, textValue: liquidWaste },
      { order: 66, textValue: mediaSource },
      { order: 67, textValue: notes },
    ];

    // Build Prisma Answer Create input
    const answersData = answersList
      .map((ans) => {
        const question = qMap.get(ans.order);
        if (!question) return null;
        return {
          questionId: question.id,
          textValue: ans.textValue || null,
          numberValue: ans.numberValue !== undefined ? ans.numberValue : null,
        };
      })
      .filter((a): a is { questionId: string; textValue: string | null; numberValue: number | null } => a !== null);

    // Randomize submission date over the last 3 days
    const submissionDate = new Date(Date.now() - randInt(3600 * 1000 * 2, 3600 * 1000 * 72));

    await prisma.response.create({
      data: {
        studyId,
        respondentCode,
        collectionMethod: 'FIELD_COLLECTED',
        collectorId: collectorInfo.collector.id,
        collectionSessionId: collectorInfo.session.id,
        language: 'en',
        submittedAt: submissionDate,
        answers: {
          create: answersData,
        },
      },
    });

    if ((i + 1) % 6 === 0) {
      console.log(`Submitted ${i + 1}/36 household responses...`);
    }
  }

  // Count total responses
  const totalCount = await prisma.response.count({
    where: { studyId },
  });

  console.log(`--- Seeding complete! Study now has ${totalCount} responses. ---`);
}

main()
  .catch((e) => {
    console.error('Error generating field collector data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
