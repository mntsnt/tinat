import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { QuestionType } from '../generated/prisma/client';

async function main() {
  console.log('--- Initializing SPHMMC Researcher & Melka Nono Census Study ---');

  // 1. Create or update Researcher
  const email = 'dawit.tadesse@sphmmc.edu.et';
  const fanHash = crypto.createHash('sha256').update('ET-FAYDA-9842-1920-5501').digest('hex');
  const passwordHash = await bcrypt.hash('Sphmmc@Tinat2026!', 10);

  let researcher = await prisma.user.findUnique({
    where: { email },
  });

  if (!researcher) {
    researcher = await prisma.user.create({
      data: {
        email,
        name: 'Dr. Dawit Tadesse (SPHMMC)',
        username: 'dr_dawit_sphmmc',
        passwordHash,
        role: 'RESEARCHER',
        institution: "St. Paul's Hospital Millennium Medical College (SPHMMC)",
        fieldOfStudy: 'Public Health & Community Medicine',
        isVerified: true,
        faydaVerified: true,
        faydaFanHash: fanHash,
        faydaVerifiedAt: new Date(),
        termsAcceptedVersion: '1.0',
        termsAcceptedAt: new Date(),
        charterAcceptedVersion: '1.0',
        charterAcceptedAt: new Date(),
        codeOfConductAcceptedVersion: '1.0',
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedVersion: '1.0',
        dpaAcceptedAt: new Date(),
        bio: 'Associate Professor & Public Health Lead at St. Paul’s Hospital Millennium Medical College (SPHMMC). Principal Investigator for Community Health Rural Attachment programs in Sheger City.',
      },
    });
    console.log('Created researcher account:', researcher.email, researcher.id);
  } else {
    researcher = await prisma.user.update({
      where: { id: researcher.id },
      data: {
        role: 'RESEARCHER',
        isVerified: true,
        faydaVerified: true,
        faydaFanHash: fanHash,
        faydaVerifiedAt: new Date(),
        institution: "St. Paul's Hospital Millennium Medical College (SPHMMC)",
        fieldOfStudy: 'Public Health & Community Medicine',
        termsAcceptedVersion: '1.0',
        termsAcceptedAt: new Date(),
        codeOfConductAcceptedVersion: '1.0',
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedVersion: '1.0',
        dpaAcceptedAt: new Date(),
      },
    });
    console.log('Updated researcher account:', researcher.email, researcher.id);
  }

  // 2. Questions array faithfully representing the 7-page physical questionnaire
  const surveyQuestions = [
    // --- Page 1: Administrative & Consent ---
    {
      text: '1. Zone & Woreda',
      type: QuestionType.SHORT_TEXT,
      required: true,
    },
    {
      text: '2. Kebele & Village / Gotte',
      type: QuestionType.SHORT_TEXT,
      required: true,
    },
    {
      text: '3. House Number / Household Code',
      type: QuestionType.SHORT_TEXT,
      required: true,
    },
    {
      text: '4. Household Head / Representative Informed Consent: "We are 4th year Medical Students from St. Paul’s Hospital Millennium Medical College (SPHMMC). We are conducting an assessment on major community health problems... Do you agree to participate?"',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes, I agree to participate', 'No, I decline'],
    },

    // --- Page 2: Part I - Socio-Demographic Characteristics ---
    {
      text: '5. Sex of Respondent',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Male', 'Female'],
    },
    {
      text: '6. Age of Respondent (in completed years)',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '7. Religion of Respondent',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Orthodox Christian', 'Muslim', 'Protestant', 'Catholic', 'Other'],
    },
    {
      text: '8. Ethnicity',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Oromo', 'Amhara', 'Gurage', 'Tigre', 'Other'],
    },
    {
      text: '9. Marital Status',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Married', 'Single (Never Married)', 'Divorced', 'Widowed'],
    },
    {
      text: '10. Educational Status of Household Head',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Unable to read and write (Illiterate)',
        'Able only to read and write',
        'Primary school (Grades 1-8)',
        'Secondary school (Grades 9-12)',
        'College / University graduate (12+)',
      ],
    },
    {
      text: '11. Primary Occupation of Household Head',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Farmer',
        'Merchant / Trader',
        'Housewife',
        'Daily laborer',
        'Government employee',
        'Student',
        'NGO employee',
        'Unemployed',
        'Other',
      ],
    },
    {
      text: '12. Total Family Size (Number of permanent household members)',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '13. Number of Male Family Members',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '14. Number of Female Family Members',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '15. Average Monthly Family Income (in Ethiopian Birr / ETB)',
      type: QuestionType.NUMBER,
      required: true,
    },

    // --- Page 3: Part II - Birth, Morbidity & Mortality Registration ---
    {
      text: '16. Number of children born alive in the household in the last 12 months',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '17. Number of stillbirths in the household in the last 12 months',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '18. Number of infant deaths (under 1 year of age) in the last 12 months',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '19. Perceived cause(s) of under-one infant death (if any occurred)',
      type: QuestionType.SHORT_TEXT,
      required: false,
    },
    {
      text: '20. Number of child deaths (under 5 years of age) in the last 12 months',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '21. Perceived cause(s) of under-five death (if any occurred)',
      type: QuestionType.SHORT_TEXT,
      required: false,
    },
    {
      text: '22. Number of other family members who died in the last 12 months (excluding under-five)',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '23. Family members who suffered serious illness in the last 12 months (specify sex, illness/morbidity, and perceived cause)',
      type: QuestionType.LONG_TEXT,
      required: false,
    },

    // --- Page 4: Part III-A - Maternal Health ---
    {
      text: '24. Number of women of reproductive age (15-49 years) residing in the household',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '25. Age at first marriage among reproductive-age women in the household (years)',
      type: QuestionType.NUMBER,
      required: false,
    },
    {
      text: '26. Age at first childbirth among women in the household (years)',
      type: QuestionType.NUMBER,
      required: false,
    },
    {
      text: '27. Is there any currently pregnant woman in the household, or any pregnancy in the past year?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '28. If yes to pregnancy, was the pregnancy unintended / unplanned?',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: ['Yes', 'No', 'Not applicable'],
    },
    {
      text: '29. Were there any maternal deaths related to pregnancy or childbirth in the last 12 months?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '30. Were there any mothers who gave birth during the last 12 months?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '31. If birth occurred in last 12 months, where was the place of delivery?',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: [
        'Health Institution (Health center / Hospital / Clinic)',
        'At home',
        'Other',
        'Not applicable',
      ],
    },
    {
      text: '32. If delivery took place at home, what was the primary reason?',
      type: QuestionType.SHORT_TEXT,
      required: false,
    },
    {
      text: '33. Was there any abortion (induced or spontaneous) among women in the last 12 months?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '34. If abortion occurred, where was post-abortion or abortion care received?',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: ['Health institution', 'Outside health institution', 'Not applicable'],
    },
    {
      text: '35. Is any woman in the household currently utilizing modern family planning methods?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '36. Which family planning method(s) are currently used in the household?',
      type: QuestionType.MULTIPLE_CHOICE,
      required: false,
      options: [
        'Injectable (Depo-Provera)',
        'Implants (Implanon / Jadelle)',
        'Oral Contraceptive Pills (OCP)',
        'Intrauterine Device (IUCD)',
        'Male / Female Condom',
        'Traditional / Natural methods',
        'None / Not applicable',
      ],
    },
    {
      text: '37. If family planning is NOT used, what is the primary reason?',
      type: QuestionType.SHORT_TEXT,
      required: false,
    },

    // --- Page 5: Part III-B - Child Health & Feeding Practices ---
    {
      text: '38. When was breastfeeding initiated for the last child after delivery?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Within one hour of delivery (Immediate)',
        'Within 24 hours of delivery',
        'After 24 hours (Delayed)',
        'No child born in household',
      ],
    },
    {
      text: '39. Infant feeding practice during the first 6 months of life:',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Exclusive breastfeeding (no water or supplementary foods)',
        'Breastfeeding plus water or other supplementary liquids/foods',
        'Formula feeding / Animal milk only',
        'Not applicable',
      ],
    },
    {
      text: '40. Does the caregiver know the routine EPI immunization schedule for children?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '41. Do you currently have an under-one year child residing in the household?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '42. Current vaccination status of under-one children:',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: [
        'Up to date for age',
        'Fully completed routine schedule',
        'Incomplete / Defaulted',
        'Not vaccinated at all',
        'No under-one child',
      ],
    },
    {
      text: '43. If vaccination is incomplete or not vaccinated, what is the reason?',
      type: QuestionType.SHORT_TEXT,
      required: false,
    },

    // --- Page 5: Part IV-A - Household & Environmental Health (Housing Condition) ---
    {
      text: '44. Housing Ownership Status',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Private (Owner-occupied)', 'Rented', 'Other'],
    },
    {
      text: '45. Main Roof Construction Material',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Corrugated iron sheet', 'Thatched / Grass roof', 'Other'],
    },
    {
      text: '46. Main Wall Construction Material',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Mud and wood (Chika wall)',
        'Brick / Cement block',
        'Stone with mud/cement',
        'Wood only',
        'Concrete',
      ],
    },
    {
      text: '47. Main Floor Material',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Earth / Mud floor', 'Concrete / Cement screed', 'Wood floor', 'Tile / Other'],
    },
    {
      text: '48. Number of rooms designated for human habitation',
      type: QuestionType.NUMBER,
      required: true,
    },
    {
      text: '49. Type of kitchen facility available for the household:',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Separate room detached from main house',
        'Separate room attached to main house',
        'No dedicated kitchen (cooking inside main living space)',
      ],
    },
    {
      text: '50. Do domestic animals (cattle, sheep, poultry) share the same living space with humans at night?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes, animals cohabit with humans', 'No, separate barn / shelter'],
    },
    {
      text: '51. Ventilation & Lighting in Main Rooms:',
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      options: [
        'Presence of functional windows',
        'Dual egress (more than one doorway/exit)',
        'Smoke chimney or roof vents',
        'No windows / Poor ventilation',
      ],
    },

    // --- Page 6: Part IV-B, C, D - Water, Hygiene & Latrine Facilities ---
    {
      text: '52. Primary source of drinking water for the household:',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Protected public tap / Standpipe',
        'Protected dug well / Protected spring',
        'Unprotected spring / Dug well',
        'River / Stream / Lake / Pond',
      ],
    },
    {
      text: '53. Estimated one-way distance to drinking water source (in Kilometers or Minutes walking):',
      type: QuestionType.SHORT_TEXT,
      required: true,
    },
    {
      text: '54. Do you treat drinking water before consumption when sourced from non-potable points?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes', 'No'],
    },
    {
      text: '55. Method(s) used for household water treatment (if treated):',
      type: QuestionType.MULTIPLE_CHOICE,
      required: false,
      options: [
        'Boiling',
        'Chemical treatment (Wuha Agar / Chlorine / WaterGuard)',
        'Filtration (Cloth / Ceramic filter)',
        'Sedimentation / Solar disinfection',
        'Not treated',
      ],
    },
    {
      text: '56. Is the domestic water storage container safely covered with a lid?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes, always covered', 'No, uncovered'],
    },
    {
      text: '57. Critical times when handwashing is practiced in the household:',
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      options: [
        'After defecation / Latrine use',
        'Before eating food',
        'Before preparing or serving food',
        'After cleaning a child’s bottom / handling feces',
        'After handling domestic animals',
      ],
    },
    {
      text: '58. Cleansing agent used for handwashing:',
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      options: ['Soap with water', 'Ash with water', 'Water only (without detergent)', 'Other'],
    },
    {
      text: '59. Is there a functional latrine facility in the compound or shared nearby?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Yes, private latrine in compound',
        'Yes, communal / shared neighborhood latrine',
        'No latrine (Open field defecation)',
      ],
    },
    {
      text: '60. If latrine is present, what type of facility is it?',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: [
        'Traditional pit latrine with slab',
        'Traditional pit latrine without slab (open pit)',
        'Ventilated Improved Pit (VIP) latrine',
        'Pour-flush / Flush toilet',
        'Not applicable',
      ],
    },
    {
      text: '61. Location of latrine facility relative to house:',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: [
        'Outside the house, within compound boundary',
        'Inside the residential house',
        'Outside compound boundary',
        'Not applicable',
      ],
    },

    // --- Page 7: Latrine Observation, Waste Disposal & Media Sources ---
    {
      text: '62. Does the latrine squat hole have a functional cover or lid?',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: ['Yes', 'No', 'Not applicable'],
    },
    {
      text: '63. Enumerator Observation: Is the latrine covered and clean during the visit?',
      type: QuestionType.SINGLE_CHOICE,
      required: false,
      options: [
        'Yes, covered and clean',
        'Uncovered with flies / odor observed',
        'Handwashing facility present with water/soap',
        'Not applicable',
      ],
    },
    {
      text: '64. Solid waste segregation practice in household:',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: ['Yes, wastes are segregated', 'No segregation'],
    },
    {
      text: '65. How does the household dispose of solid wastes?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Disposed in designated backyard pit',
        'Burned in open air',
        'Municipality / Community garbage collection',
        'Dumped in open field / riverbank',
        'Other',
      ],
    },
    {
      text: '66. How does the household dispose of liquid wastes (kitchen / bathing wastewater)?',
      type: QuestionType.SINGLE_CHOICE,
      required: true,
      options: [
        'Soak pit / Cesspool',
        'Poured into pit latrine',
        'Discharged into open yard / street ditch',
        'Other',
      ],
    },
    {
      text: '67. Household access to communication and information channels:',
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      options: [
        'Functional radio set',
        'Television set (Satellite / Terrestrial)',
        'Mobile phone / Smartphone in household',
        'Access to community public telephone',
        'Access to regular print newspapers / health leaflets',
        'Postal service access',
        'None of the above',
      ],
    },
    {
      text: '68. Field Enumerator & Medical Student Group Verification Notes (Student Names, Group ID, Supervisor Sign-off):',
      type: QuestionType.LONG_TEXT,
      required: false,
    },
  ];

  // 3. Create Study
  const studyTitle = 'Sheger City Melka Nono Community Health & Demographic Census (SPHMMC)';
  
  // Check if study already exists
  const existingStudy = await prisma.study.findFirst({
    where: {
      researcherId: researcher.id,
      title: studyTitle,
    },
  });

  if (existingStudy) {
    console.log('Study already exists with id:', existingStudy.id);
    return;
  }

  const study = await prisma.study.create({
    data: {
      title: studyTitle,
      description:
        'Official Community Health Rural Attachment Tool developed by St. Paul’s Hospital Millennium Medical College (SPHMMC), Department of Public Health. ' +
        'Conducted by 4th-year Medical Students to evaluate socio-demographic indicators, vital birth/death registration, maternal and child healthcare, ' +
        'infant nutrition, routine EPI immunization, and environmental WASH conditions across rural kebeles of Sheger City, Melka Nono Woreda.',
      bannerTheme: 'canopy',
      status: 'ACTIVE',
      fundingType: 'FREE',
      studyType: 'SURVEY',
      category: 'Public Health & Epidemiology',
      objective:
        'Assess community health indicators, disease morbidity, maternal-child healthcare access, and water-sanitation conditions in Melka Nono to formulate evidence-based public health interventions.',
      targetPopulation: 'Household heads and representatives in Melka Nono Woreda, Sheger City.',
      populationDescription: 'Rural household heads, caregivers, and reproductive-age women.',
      recruitmentMethod: 'Door-to-door community census by SPHMMC medical students and field enumerators.',
      estimatedMinutes: 20,
      participantTarget: 500,
      collectorsNeeded: 30,
      budgetCredits: 0,
      creditsPaid: 0,
      creditBudget: 0,
      creditPerResponse: 0,
      rewardCredits: 0,
      isPrivate: false,
      researcherId: researcher.id,
      ethicsExempt: true,
      ethicsExemptionReason:
        'Academic rural community attachment tool approved under SPHMMC Department of Public Health curriculum and Sheger City Melka Nono Woreda Health Office clearance.',
      ethicsExemptedAt: new Date(),
      tags: [
        'Public Health',
        'Rural Health',
        'SPHMMC',
        'Maternal Health',
        'Child Nutrition',
        'WASH',
        'Epidemiology',
        'Melka Nono',
      ],
      questions: {
        create: surveyQuestions.map((q, index) => ({
          text: q.text,
          type: q.type,
          required: q.required,
          order: index,
          options: q.options
            ? {
                create: q.options.map((opt, optIndex) => ({
                  text: opt,
                  value: opt,
                  order: optIndex,
                })),
              }
            : undefined,
        })),
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  console.log(`Study successfully created!`);
  console.log(`ID: ${study.id}`);
  console.log(`Title: ${study.title}`);
  console.log(`Questions Count: ${study.questions.length}`);
  console.log(`Researcher: ${researcher.name} (${researcher.email})`);
}

main()
  .catch((e) => {
    console.error('Error running seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
