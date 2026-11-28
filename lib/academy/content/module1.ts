import { AcademyModule } from "../types";

export const module1: AcademyModule = {
  slug: "introduction-to-health-research",
  number: 1,
  pathId: "beginner",
  title: "Introduction to Health Research",
  subtitle: "Epistemology, Methodological Rigor, and Contextual Health Priorities in Africa",
  duration: "3.5 Hours",
  status: "reviewed",
  summary:
    "Explore the foundations of modern biomedical and public health research. Learn how empirical inquiry differs from routine clinical service and clinical audits, understand the hierarchy of medical evidence, dissect the anatomy of the research lifecycle, and examine the unique epidemiological landscape and ethical priorities across Ethiopia and the African continent.",
  learningObjectives: [
    "Distinguish health research from routine clinical practice, administrative monitoring, and quality improvement audits.",
    "Categorize research into descriptive, analytical, experimental, and implementation science paradigms.",
    "Evaluate the medical evidence hierarchy and articulate why association does not prove causation.",
    "Analyze the dual burden of disease (infectious disease and rising non-communicable conditions) in Ethiopia and sub-Saharan Africa.",
    "Map the end-to-end research lifecycle from problem identification through ethical clearance, field data collection, analysis, and dissemination.",
  ],
  prerequisites: [
    "No prior formal research training required. Basic familiarity with secondary school biology, health terminology, or clinical practice is beneficial.",
  ],
  expectedOutcomes: [
    "Ability to critically assess whether a public health inquiry requires formal Institutional Review Board (IRB) ethical clearance.",
    "Fluency in scientific vocabulary (exposures, outcomes, confounders, target populations, sampling frames).",
    "Preparedness to formulate a rigorous, context-specific research concept note for submission to academic review committees.",
  ],
  glossary: [
    {
      term: "Empirical Evidence",
      definition:
        "Information acquired through systematic observation, experimentation, and documented measurement, rather than through pure theoretical speculation or unverified tradition.",
      ethiopianContext:
        "Essential when challenging longstanding assumptions about traditional healing practices versus clinical interventions in rural kebeles.",
    },
    {
      term: "Clinical Audit",
      definition:
        "A quality improvement process that seeks to improve patient care and outcomes through systematic review of care against explicit criteria and the implementation of change.",
      ethiopianContext:
        "Hospital bed audits at Tikur Anbessa Specialized Hospital measure compliance with protocols, whereas health research tests a novel hypothesis.",
    },
    {
      term: "Double Burden of Disease",
      definition:
        "The coexistence of undernutrition and infectious diseases alongside a rapid rise in non-communicable diseases (hypertension, diabetes, cardiovascular disease) within the same population or community.",
      ethiopianContext:
        "A defining epidemiological reality in contemporary Ethiopia, where regional hospitals manage maternal sepsis and tuberculosis alongside diabetic ketoacidosis and hypertensive strokes.",
    },
    {
      term: "Equipoise",
      definition:
        "A state of genuine scientific and medical uncertainty over whether one treatment or intervention is superior to another, providing the ethical justification for conducting a trial.",
    },
  ],
  resources: [
    {
      title: "Designing Clinical Research (5th Edition)",
      authorOrOrg: "Hulley SB, Cummings SR, Browner WS, Grady DG, Newman TB (Wolters Kluwer)",
      description: "The gold-standard reference manual for clinical and epidemiological study design.",
      url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
      type: "book",
      isVerified: true,
    },
    {
      title: "Gordis Epidemiology (7th Edition)",
      authorOrOrg: "Celentano DD, Szklo M (Elsevier)",
      description: "The definitive textbook on disease frequency, risk measures, and epidemiological methods.",
      url: "https://www.us.elsevierhealth.com/gordis-epidemiology-9780323877756.html",
      type: "book",
      isVerified: true,
    },
    {
      title: "WHO TDR Implementation Research",
      authorOrOrg: "World Health Organization (TDR)",
      description: "Practical guide to designing research that improves real-world health service delivery.",
      url: "https://tdr.who.int/",
      type: "toolkit",
      isVerified: true,
    },
    {
      title: "Principles of Epidemiology in Public Health Practice (3rd Edition)",
      authorOrOrg: "Centers for Disease Control and Prevention (CDC)",
      description: "Foundational, open-access self-study course on field epidemiology and disease surveillance.",
      url: "https://www.cdc.gov/training/self-study/principles-of-epidemiology/",
      type: "course",
      isVerified: true,
    },
  ],
  lessons: [
    {
      slug: "what-is-health-research",
      moduleSlug: "introduction-to-health-research",
      title: "What is Health Research? Foundations, Purpose, and Scientific Rigor",
      orderIndex: 1,
      readingTimeMinutes: 18,
      status: "reviewed",
      learningObjectives: [
        "Define health research and explain its role in evidence-based medicine and public health policy.",
        "Contrast scientific research with clinical practice, quality assurance audits, and disease surveillance.",
        "Articulate the criteria that distinguish rigorous empirical science from anecdotal clinical experience.",
      ],
      sections: [
        {
          id: "defining-health-research",
          title: "1. The Anatomy and Core Purpose of Health Research",
          content:
            "Health research is a **systematic, planned investigation designed to develop or contribute to generalizable knowledge** regarding human health, disease mechanisms, clinical interventions, health behaviors, and healthcare systems. Unlike informal clinical impression or routine daily practice, research is governed by an explicit scientific protocol formulated prior to data collection, utilizes standardized measurement tools, and subjects its findings to statistical scrutiny and peer evaluation.\n\nThe ultimate goal of health research is not simply to document facts, but to provide actionable evidence that improves patient longevity, reduces morbidity, eliminates preventable mortality, and ensures equitable distribution of limited healthcare resources.",
          callout: {
            type: "key-idea",
            title: "Generalizability: The Defining Hallmark",
            content:
              "The critical distinction between clinical practice and research lies in generalizability. Clinical care aims to benefit the single patient sitting in your examination room today. Health research aims to discover principles, effect sizes, and associations that apply to an entire target population tomorrow.",
          },
        },
        {
          id: "research-vs-clinical-practice",
          title: "2. The Boundary Line: Research vs. Practice vs. Audit",
          content:
            "One of the most frequent points of confusion among medical students, nurses, and hospital administrators is distinguishing between **Clinical Practice**, **Quality Improvement (QI) Audits**, and **Formal Health Research**.\n\n* **Clinical Practice:** Interventions designed solely to enhance the well-being of an individual patient or client, with a reasonable expectation of direct success. Example: Prescribing first-line Artemether-Lumefantrine to a patient presenting with confirmed Plasmodium falciparum malaria.\n* **Quality Improvement / Clinical Audit:** A systematic review of existing healthcare delivery against established local or international standards (e.g., checking whether 90% of surgical patients at St. Paul's Hospital received prophylactic antibiotics within 60 minutes prior to incision). The intent is operational optimization; the findings are rarely intended to contribute to global generalizable knowledge.\n* **Health Research:** Testing an unanswered scientific question or formal hypothesis (e.g., comparing a 3-day versus 5-day antibiotic regimen in a randomized trial to determine superior cure rates). Because of potential patient risks and experimental deviation from standard care, **research requires formal prior ethical review** by an Institutional Review Board (IRB) or National Ethics Review Committee (NERC).",
          callout: {
            type: "common-mistake",
            title: "Common Mistake: 'It's Just a Chart Review'",
            content:
              "Many novice investigators assume that retrospectively reviewing hospital paper logbooks or electronic records does not count as research because 'no drugs were administered'. This is false. Extracting patient records to answer a novel scientific hypothesis constitutes human subjects research and requires formal IRB clearance and data protection safeguards.",
          },
        },
        {
          id: "the-scientific-method",
          title: "3. The Cyclical Nature of the Scientific Method",
          content:
            "Health research does not follow a simple linear path; it operates as an iterative feedback loop:\n\n1. **Clinical / Epidemiological Observation:** Noticing an unexpected pattern in clinical practice (e.g., a cluster of young adults in Hawassa presenting with severe hypertension without traditional renal or endocrine risk factors).\n2. **Literature Synthesis:** Reviewing indexed biomedical databases (PubMed, Hinari, African Journals Online) to determine if this pattern has been documented, explained, or refuted elsewhere.\n3. **Hypothesis Formulation:** Stating a clear, falsifiable prediction (e.g., 'Chronic khat chewing combined with high-sodium dietary habits is independently associated with essential hypertension in adults aged 20–35').\n4. **Protocol Architecture:** Selecting study design, sampling frames, validated measurement instruments, and ethical guardrails.\n5. **Empirical Data Collection:** Gathering standardized measurements in the clinic or community.\n6. **Statistical Analysis & Inference:** Testing hypotheses while accounting for confounding variables and measurement error.\n7. **Dissemination & Translation:** Publishing findings in peer-reviewed journals and policy briefs to modify national clinical treatment guidelines.",
          callout: {
            type: "worked-example",
            title: "Worked Example: Transitioning a Clinical Observation into Research",
            content:
              "**Observation:** An intern at Felege Hiwot Hospital observes that postpartum mothers living more than 15 kilometers from the health center have higher rates of home birth complications.\n\n**Weak Inquiry:** 'Why do rural women not like coming to our clinic?' (Vague, biased, non-actionable).\n\n**Rigorous Research Question (PICO):** 'Among pregnant women in South Gondar Zone (Population), does distance greater than 15 km from a primary healthcare center (Exposure), compared to living within 5 km (Comparison), increase the risk of delayed presentation during obstructed labor (Outcome)?'",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m1-l1-q1",
          question: "Which of the following activities strictly constitutes health research rather than clinical audit?",
          options: [
            "Auditing hospital delivery logbooks to verify if 100% of newborns received Vitamin K prophylaxis per national guidelines.",
            "Testing whether a mobile SMS reminder intervention increases the proportion of hypertensive patients attending follow-up visits compared to standard verbal counseling.",
            "Reviewing pharmacy inventory to identify expired vials of oxytocin in a district health office.",
            "Conducting routine daily triage to identify febrile pediatric patients entering an outpatient department.",
          ],
          correctIndex: 1,
          explanation:
            "Testing an unproven intervention (SMS reminders vs. verbal counseling) to determine comparative efficacy produces generalizable scientific knowledge and represents empirical health research.",
        },
        {
          id: "m1-l1-q2",
          question: "Why does retrospective chart review of hospital records require ethical review (IRB approval)?",
          options: [
            "Because reviewing records always changes patient medical treatments retrospectively.",
            "Because patient clinical records contain confidential protected health information, and unauthorized extraction poses privacy risks.",
            "Because retrospective studies are always more statistically accurate than randomized controlled trials.",
            "Because hospitals charge administrative fees for reading medical files.",
          ],
          correctIndex: 1,
          explanation:
            "Even when no prospective clinical intervention occurs, extracting sensitive patient health data poses confidentiality and privacy risks, necessitating oversight and data protection guarantees from an ethical review board.",
        },
      ],
      keyTakeaways: [
        "Health research is a planned, systematic inquiry aimed at generating generalizable biomedical or epidemiological knowledge.",
        "Clinical care benefits the individual; quality improvement audits measure institutional compliance; health research discovers novel principles across populations.",
        "All research involving human participants or their identifiable medical records requires prior independent ethical review.",
        "Rigorous science demands explicit falsifiable hypotheses, standardized measurement, and transparent disclosure of methodological limitations.",
      ],
      references: [
        {
          id: "hulley-2013",
          citationText:
            "Hulley SB, Cummings SR, Browner WS, Grady DG, Newman TB. Designing Clinical Research. 5th ed. Philadelphia: Wolters Kluwer; 2022. Chapter 1: Getting Started: The Anatomy and Physiology of Clinical Research; p. 1-14.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        },
        {
          id: "belmont-report",
          citationText:
            "National Commission for the Protection of Human Subjects of Biomedical and Behavioral Research. The Belmont Report: Ethical Principles and Guidelines for the Protection of Human Subjects of Research. Bethesda: Department of Health, Education, and Welfare; 1979.",
          url: "https://www.hhs.gov/ohrp/regulations-and-policy/belmont-report/index.html",
          isVerified: true,
        },
      ],
    },
    {
      slug: "research-paradigms-and-types",
      moduleSlug: "introduction-to-health-research",
      title: "The Research Landscape: Descriptive, Analytic, and Implementation Science",
      orderIndex: 2,
      readingTimeMinutes: 20,
      status: "reviewed",
      learningObjectives: [
        "Categorize research inquiries into basic biomedical, clinical, epidemiological, and health systems research.",
        "Contrast descriptive studies (answering 'Who, What, Where, When?') with analytical studies (answering 'Why and How?').",
        "Explain the emerging role of Implementation Science in bridging the 'know-do gap' in low- and middle-income countries.",
      ],
      sections: [
        {
          id: "broad-disciplines",
          title: "1. The Spectrum of Health Sciences",
          content:
            "Health research spans multiple disciplines that operate along a translational continuum from the benchtop laboratory to national health policy:\n\n* **Basic Biomedical Science:** Investigates cellular, genetic, immunological, and molecular mechanisms (e.g., genomic sequencing of *Plasmodium falciparum* isolates to detect artemisinin-resistant kelch13 gene mutations).\n* **Clinical Research:** Investigates preventive, diagnostic, or therapeutic interventions directly in human patient cohorts (e.g., evaluating a new fixed-dose oral antihypertensive combination in a phase III trial).\n* **Epidemiology:** Measures the distribution and determinants of health states or events in specified populations to control disease burden (e.g., calculating the point prevalence and risk factors for podoconiosis in endemic highland woredas).\n* **Health Systems & Implementation Research:** Evaluates how health policies, financing mechanisms, supply chains, human resources, and service delivery platforms can translate proven scientific discoveries into widespread routine practice.",
          callout: {
            type: "key-idea",
            title: "The Translation Continuum: From Bench to Bedside to Kebele",
            content:
              "A drug discovered in a molecular laboratory is useless if rural health posts cannot maintain its cold chain or if patients experience severe cultural stigma that prevents adherence. Implementation science investigates real-world delivery barriers.",
          },
        },
        {
          id: "descriptive-vs-analytical",
          title: "2. Descriptive vs. Analytical Research",
          content:
            "Epidemiological studies are fundamentally divided into two major paradigms based on whether they seek to describe a situation or test a formal causal association:\n\n### Descriptive Studies\nDescriptive research characterizes the amount and distribution of health events in terms of **Person**, **Place**, and **Time**:\n* **Person:** Who is affected? (Age, sex, occupation, socioeconomic status, parity, genetic background).\n* **Place:** Where is the disease occurring? (Urban versus rural kebeles, altitude, proximity to stagnant river bodies, geographic coordinates).\n* **Time:** When does the condition peak? (Seasonal monsoon spikes in malaria, secular multi-year trends in diabetes prevalence, epidemic curves during an acute outbreak).\n\n*Key Utility:* Descriptive studies generate hypotheses; they do not test whether exposure A caused disease B.\n\n### Analytical Studies\nAnalytical research investigates hypotheses about **relationships, associations, and potential causal mechanisms** by comparing two or more groups:\n* Does an exposure increase the probability of an outcome? (e.g., comparing lung cancer rates in smokers versus non-smokers in a cohort study).\n* Does an experimental intervention produce superior outcomes compared to placebo or active control? (e.g., comparing infant mortality in communities randomized to water chlorination dispensers versus standard boreholes).",
          callout: {
            type: "worked-example",
            title: "Worked Example: Descriptive vs. Analytical Inquiries",
            content:
              "**Descriptive Inquiry:** 'What percentage of under-five children in Debre Markos woreda exhibit stunting (height-for-age z-score < -2) during the post-harvest dry season?'\n\n**Analytical Inquiry:** 'Is maternal autonomy in household expenditure independently associated with reduced odds of childhood stunting, after adjusting for family income and maternal educational attainment?'",
          },
        },
        {
          id: "implementation-science",
          title: "3. Implementation Science: Bridging the Know-Do Gap",
          content:
            "In global public health, researchers frequently lament the **'17-Year Know-Do Gap'**—the empirical observation that it takes an average of 17 years for a proven clinical or medical intervention to be routinely implemented in general healthcare delivery.\n\nImplementation science examines the implementation process itself:\n* What are the organizational, logistical, cultural, and behavioral bottlenecks that prevent scale-up?\n* How can fidelity, acceptability, feasibility, cost-effectiveness, and sustainability be maintained under real-world rural health center constraints?",
          callout: {
            type: "ethiopian-case-study",
            title: "Ethiopian Case: The Health Extension Program (HEP)",
            content:
              "Ethiopia's Health Extension Program, initiated in 2003, trained over 40,000 female Health Extension Workers (HEWs) stationed in rural kebeles. Research evaluating the HEP demonstrated that providing evidence-based packages (such as clean cord care, oral rehydration therapy, and immunization outreach) through trusted community members dramatically reduced under-five mortality across the nation.",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m1-l2-q1",
          question: "A researcher documents that 34% of diabetic patients attending an outpatient clinic in Jimma have diabetic peripheral neuropathy. What type of study is this?",
          options: [
            "Analytical experimental trial",
            "Descriptive epidemiological study",
            "Double-blind cross-over trial",
            "Health systems simulation model",
          ],
          correctIndex: 1,
          explanation:
            "Measuring and reporting the frequency and distribution of a condition in a specified population without comparing exposed versus unexposed groups is a classic descriptive study.",
        },
        {
          id: "m1-l2-q2",
          question: "What is the primary objective of implementation science in healthcare?",
          options: [
            "To discover new pharmacological molecules in laboratory tissue cultures.",
            "To investigate why proven health interventions fail to reach routine widespread delivery and test strategies to scale them up.",
            "To prove that correlation is equivalent to causation in observational surveys.",
            "To calculate mathematical formulas for sample size without collecting data.",
          ],
          correctIndex: 1,
          explanation:
            "Implementation science explicitly focuses on identifying and overcoming delivery, behavioral, and organizational barriers to integrate proven scientific interventions into routine healthcare.",
        },
      ],
      keyTakeaways: [
        "Health research spans basic laboratory sciences, clinical human trials, population epidemiology, and health systems implementation.",
        "Descriptive research maps the 'Who, What, Where, When' to generate hypotheses.",
        "Analytical research evaluates comparison groups to test 'Why and How' exposures link to outcomes.",
        "Implementation science addresses real-world delivery barriers to ensure evidence translates into clinical practice and community health gains.",
      ],
      references: [
        {
          id: "gordis-2023",
          citationText:
            "Celentano DD, Szklo M. Gordis Epidemiology. 7th ed. Philadelphia: Elsevier; 2023. Chapter 1: Introduction; p. 1-18.",
          url: "https://www.us.elsevierhealth.com/gordis-epidemiology-9780323877756.html",
          isVerified: true,
        },
        {
          id: "bauer-2015",
          citationText:
            "Bauer MS, Damschroder L, Hagedorn H, Smith J, Kilbourne AM. An introduction to implementation science for the non-specialist. BMC Psychol. 2015;3:32.",
          url: "https://bmcpsychology.biomedcentral.com/articles/10.1186/s40359-015-0089-9",
          isVerified: true,
        },
      ],
    },
    {
      slug: "evidence-causality-and-uncertainty",
      moduleSlug: "introduction-to-health-research",
      title: "Evidence, Causality, and Uncertainty in Medical Science",
      orderIndex: 3,
      readingTimeMinutes: 22,
      status: "reviewed",
      learningObjectives: [
        "Evaluate the traditional hierarchy of evidence and recognize its strengths and blind spots.",
        "Articulate the difference between statistical correlation and biological causation.",
        "Apply the Bradford Hill criteria to evaluate causal inferences in observational studies.",
        "Understand why scientific conclusions must be expressed with quantified uncertainty (confidence intervals and p-values).",
      ],
      sections: [
        {
          id: "evidence-hierarchy",
          title: "1. The Hierarchy of Medical Evidence",
          content:
            "![The Hierarchy of Medical Evidence Pyramid](/assets/academy/diagrams/diagram-evidence-pyramid.png \"Figure 1.1: The Hierarchy of Medical Evidence Pyramid\")\n\nIn Evidence-Based Medicine (EBM), study designs are structured into an evidence pyramid reflecting their susceptibility to methodological bias and confounding:\n\n1. **Systematic Reviews & Meta-Analyses:** Synthesize all eligible randomized trials using transparent, pre-specified screening and statistical pooling (highest internal validity).\n2. **Randomized Controlled Trials (RCTs):** Participants are allocated to treatment or control arms by chance, balancing both measured and unmeasured confounding variables.\n3. **Prospective Cohort Studies:** Track exposed and unexposed individuals forward in time to measure incident disease.\n4. **Case-Control Studies:** Efficiently compare past exposures between individuals with disease (cases) and without disease (controls).\n5. **Cross-Sectional Surveys:** Measure exposure and outcome simultaneously at a single point in time.\n6. **Case Reports & Case Series:** Detailed anecdotal narratives of rare clinical presentations.\n7. **Expert Opinion & Laboratory Speculation:** Lowest formal empirical validity in the absence of systematic human data.",
          callout: {
            type: "key-idea",
            title: "Internal Validity vs. External Generalizability",
            content:
              "A randomized trial conducted in a tertiary Swiss hospital with strict inclusion criteria may have immaculate internal validity (zero confounding), but very poor external validity (generalizability) if applied to a rural Ethiopian health center managing malnutrition and co-infections.",
          },
        },
        {
          id: "correlation-vs-causation",
          title: "2. The Golden Rule: Correlation is Not Causation",
          content:
            "Just because two variables rise and fall together across time or space does not mean one causes the other. Statistical associations frequently arise from three alternative phenomena:\n\n* **Chance (Random Error):** A statistical anomaly that occurred simply due to sampling variability.\n* **Bias (Systematic Error):** Flaws in participant selection (Selection Bias) or data measurement (Information Bias) that systematically push results away from the true value.\n* **Confounding:** A third variable that is independently associated with the exposure AND is an independent cause of the outcome, creating a spurious correlation.\n\n*Classic Example:* In urban settings, ice cream sales correlate strongly with hospital drowning admissions. Does eating ice cream cause drowning? No. Hot weather (a confounder) increases both ice cream consumption and swimming participation.",
          callout: {
            type: "common-mistake",
            title: "Common Mistake: Announcing 'Proven Causes'",
            content:
              "Observational cross-sectional studies can NEVER definitively prove causality on their own because they cannot establish whether the exposure preceded the outcome in time. Always report findings as 'statistically associated with' rather than 'caused by'.",
          },
        },
        {
          id: "bradford-hill-criteria",
          title: "3. The Bradford Hill Criteria for Causal Inference",
          content:
            "In 1965, British epidemiologist Sir Austin Bradford Hill formulated nine empirical guidelines to help scientists assess whether an observed statistical association is likely to be causal:\n\n1. **Strength of Association:** Large effect sizes (e.g. an Odds Ratio of 15.0) are less likely to be entirely explained by subtle unmeasured confounders than weak associations (e.g. Odds Ratio of 1.15).\n2. **Consistency:** Has the association been observed repeatedly by diverse investigators in different populations, settings, and study designs?\n3. **Temporality (Mandatory):** Does the exposure precede the outcome in chronological time? This is the only non-negotiable criterion.\n4. **Biological Gradient (Dose-Response):** Does greater exposure yield proportionally higher disease risk? (e.g., smoking 20 cigarettes/day yields higher lung cancer risk than smoking 5 cigarettes/day).\n5. **Plausibility:** Is there a credible physiological, biological, or cellular mechanism consistent with current medical knowledge?\n6. **Coherence:** Does the causal interpretation conflict with known historical disease facts or biology?\n7. **Experiment:** Does removing the exposure or introducing a randomized preventive trial reduce disease incidence?\n8. **Specificity:** Does a single exposure link to a specific outcome? (Often not applicable in chronic multi-factorial diseases like hypertension).\n9. **Analogy:** Have similar exposures been shown to cause analogous medical conditions?",
          callout: {
            type: "worked-example",
            title: "Worked Example: Applying Bradford Hill to Podoconiosis in Ethiopia",
            content:
              "**Disease:** Podoconiosis (non-filarial elephantiasis) in volcanic red-clay soil highlands.\n* *Temporality:* Longstanding barefoot exposure to irritant volcanic soil precedes lower-leg swelling.\n* *Biological Gradient:* Farmers who never wear footwear show higher prevalence and severity than those wearing shoes daily.\n* *Plausibility:* Microscopic mineral particles (silica, aluminum) penetrate barefoot skin and trigger chronic macrophage lymphatic inflammation.\n* *Experiment:* Community trials supplying protective footwear and foot hygiene halt disease progression.",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m1-l3-q1",
          question: "Which of the Bradford Hill criteria is considered completely mandatory for causal inference?",
          options: [
            "Biological Gradient (Dose-Response)",
            "Temporality (Exposure precedes outcome)",
            "Specificity of effect",
            "High Odds Ratio above 10.0",
          ],
          correctIndex: 1,
          explanation:
            "Temporality is the only indispensable criterion. If an outcome occurs before an exposure, the exposure cannot logically be the cause.",
        },
        {
          id: "m1-l3-q2",
          question: "In an observational study, why does a confounder distort the relationship between an exposure and an outcome?",
          options: [
            "Because the confounder is an intermediate step on the exact causal pathway.",
            "Because the confounder is independently associated with the exposure and independently causes the outcome.",
            "Because the confounder only exists in randomized controlled trials.",
            "Because confounders make sample sizes smaller.",
          ],
          correctIndex: 1,
          explanation:
            "A confounder is an extraneous variable that correlates with the exposure and independently influences the outcome, creating a distorted or false appearance of a causal link.",
        },
      ],
      keyTakeaways: [
        "Systematic reviews and randomized trials sit atop the internal validity hierarchy, but observational studies remain vital for etiology and real-world generalizability.",
        "Correlation does not equate to causation; chance, bias, and confounding must be systematically eliminated.",
        "The Bradford Hill criteria guide causal inference, with temporality standing as the only non-negotiable requirement.",
        "Scientific integrity requires quantifying uncertainty using confidence intervals rather than presenting estimates as absolute certainties.",
      ],
      references: [
        {
          id: "greenhalgh-2019",
          citationText:
            "Greenhalgh T. How to Read a Paper: The Basics of Evidence-Based Healthcare and Translational Medicine. 6th ed. Hoboken: Wiley-Blackwell; 2019. Chapter 3: Getting Your Bearings: What Is This Paper About?; p. 37-56.",
          url: "https://www.wiley.com/en-us/how-to-read-a-paper-the-basics-of-evidence-based-healthcare-7th-edition-p-9781394206902",
          isVerified: true,
        },
        {
          id: "hill-1965",
          citationText:
            "Hill AB. The environment and disease: association or causation? Proc R Soc Med. 1965;58(5):295-300.",
          url: "https://pubmed.ncbi.nlm.nih.gov/14283879/",
          isVerified: true,
        },
      ],
    },
    {
      slug: "ethiopian-and-african-health-context",
      moduleSlug: "introduction-to-health-research",
      title: "Health Research in Ethiopia and Africa: Priorities, Systems, and Context",
      orderIndex: 4,
      readingTimeMinutes: 20,
      status: "reviewed",
      learningObjectives: [
        "Analyze the epidemiological transition and the dual burden of disease across Ethiopia and sub-Saharan Africa.",
        "Identify national health research priority areas established by the Ethiopian Public Health Institute (EPHI) and Ministry of Health (MoH).",
        "Navigate the decentralized institutional ethics review framework in Ethiopia (NERC, university IRBs, regional health bureaus).",
        "Address real-world field logistics: linguistic diversity, community gatekeepers, road infrastructure, and mobile network constraints.",
      ],
      sections: [
        {
          id: "epidemiological-transition",
          title: "1. The Changing Health Profile: The Epidemiological Transition",
          content:
            "Historically, health research in sub-Saharan Africa was almost exclusively concentrated on acute communicable diseases: malaria, tuberculosis, HIV/AIDS, diarrheal illness, and vaccine-preventable pediatric conditions.\n\nOver the past two decades, Ethiopia has entered an **epidemiological transition**. While infectious conditions and maternal mortality remain urgent challenges, rapid urbanization, changing dietary habits, reduced physical activity, and tobacco/alcohol consumption have sparked an alarming surge in **non-communicable diseases (NCDs)**:\n* Cardiovascular diseases and ischemic heart disease\n* Essential hypertension and stroke\n* Type 2 diabetes mellitus and diabetic complications\n* Cancers (cervical, breast, colorectal, and esophageal cancer in the Rift Valley)\n* Mental health conditions (major depressive disorder, trauma, psychosis)\n* Road traffic injuries and surgical trauma.",
          callout: {
            type: "key-idea",
            title: "The Double Burden Reality",
            content:
              "Health researchers in Ethiopia cannot adopt a single-disease silo mindset. A patient presenting to a rural health post in Wolaita may simultaneously suffer from chronic lung disease (from biomass indoor smoke), active pulmonary tuberculosis, and unmanaged hypertension.",
          },
        },
        {
          id: "national-priorities-and-governance",
          title: "2. National Research Governance: EPHI and NERC",
          content:
            "In Ethiopia, health research is overseen by institutional and national bodies to ensure ethical integrity, data quality, and alignment with national development priorities:\n\n* **Ministry of Health (MoH) & Health Sector Transformation Plan (HSTP):** Formulates overarching national health targets (e.g. maternal mortality reduction, universal health coverage).\n* **Ethiopian Public Health Institute (EPHI):** The premier national scientific technical agency responsible for disease surveillance, national health surveys (such as the Ethiopian Demographic and Health Survey [EDHS] and National STEPS surveys for NCD risk factors), and national research coordination.\n* **National Ethics Review Committee (NERC):** Operating under the Ministry of Innovation and Technology (MInT) and MoH, NERC reviews international clinical trials, genetic studies, and research involving overseas biological sample transfer.\n* **Institutional Review Boards (IRBs):** Accredited ethical committees at medical universities (e.g. Addis Ababa University, Jimma University, Gondar University, Hawassa University, SPHMMC) and regional health research institutes that evaluate local research protocols.",
          callout: {
            type: "ethiopian-case-study",
            title: "Ethiopian Case: Ethical Clearance Protocol Hierarchy",
            content:
              "If an MPH student at Addis Ababa University conducts a survey in health centers across Oromia Region, they must:\n1. Obtain primary ethical approval from their university college IRB.\n2. Present this approval letter to the Oromia Regional Health Bureau to receive regional administrative endorsement.\n3. Present the regional letter to the Zonal Health Department and Woreda Health Office before approaching health centers or kebeles.",
          },
        },
        {
          id: "field-logistics-and-community",
          title: "3. Fieldwork Realities: Language, Trust, and Culture",
          content:
            "Conducting scientific fieldwork in Ethiopia requires profound cultural competence and logistical preparation:\n\n* **Linguistic Diversity:** Ethiopia is home to over 80 languages. Questionnaires drafted in English must undergo **rigorous forward and backward translation** into local working languages (e.g., Amharic, Afaan Oromoo, Tigrinya, Somali, Sidama) to preserve conceptual equivalence rather than direct literal word translation.\n* **Community Engagement:** In rural kebeles, entering a village without consulting the kebele administration, religious leaders (Orthodox priests, Imams), and community elders (*Iddir* leaders, *Abba Gadaa* councils) generates suspicion and non-response.\n* **Informed Consent Nuances:** In populations with limited literacy, formal written signatures can induce fear of government or legal entanglement. Ethically approved **verbal informed consent accompanied by an impartial literate witness signature** or thumbprint is standard protocol.",
          callout: {
            type: "try-it",
            title: "Try It: Planning a Multi-Lingual Translation Protocol",
            content:
              "Imagine you have a questionnaire assessing depressive symptoms. A standardized English question asks: 'During the past two weeks, have you felt blue?'\nA direct literal translation into Amharic would mean 'Have you felt like the color blue?'. How would you translate the emotional concept accurately into cultural idioms? This is why forward-backward translation with local healthcare providers is non-negotiable.",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m1-l4-q1",
          question: "What does the 'double burden of disease' in modern sub-Saharan Africa refer to?",
          options: [
            "Having to pay double hospital fees for inpatient versus outpatient care.",
            "The simultaneous high prevalence of communicable diseases alongside rapidly increasing non-communicable chronic conditions.",
            "Requiring two separate Institutional Review Board approvals for every paper.",
            "When a disease is transmitted by both vectors and contaminated drinking water.",
          ],
          correctIndex: 1,
          explanation:
            "The double burden refers to the convergence of endemic infectious diseases and undernutrition with a rising epidemic of chronic non-communicable conditions (hypertension, diabetes, cancers).",
        },
        {
          id: "m1-l4-q2",
          question: "When translating an English research questionnaire into Afaan Oromoo or Amharic, what is the best practice for ensuring validity?",
          options: [
            "Use an automated online translator and print immediately.",
            "Conduct forward translation by one bilingual expert, followed by independent backward translation by a blinded second translator, and review discrepancies.",
            "Only administer questionnaires in English and ask enumerators to improvise translations verbally on the spot.",
            "Translate only the questions and leave multiple-choice response options in English.",
          ],
          correctIndex: 1,
          explanation:
            "The standard scientific methodology is forward-backward translation by independent bilingual professionals to identify cultural and conceptual discrepancies before field administration.",
        },
      ],
      keyTakeaways: [
        "Ethiopia is undergoing a rapid epidemiological transition, creating a dual burden of infectious and non-communicable diseases.",
        "National research priorities are coordinated through EPHI, the Ministry of Health, and accredited university IRBs.",
        "Ethical navigation requires a layered governance approach: university IRB approval, regional health bureau endorsement, and community gatekeeper engagement.",
        "Rigorous field research demands culturally sensitive, forward-backward translated questionnaires and respectful community consultation.",
      ],
      references: [
        {
          id: "ephi-hstp",
          citationText:
            "Federal Ministry of Health (FMoH), Ethiopia. Health Sector Transformation Plan II (HSTP-II) 2020/21-2024/25. Addis Ababa: Ministry of Health; 2021.",
          url: "https://www.ephi.gov.et/",
          isVerified: true,
        },
        {
          id: "misganaw-2017",
          citationText:
            "Misganaw A, Haregu TN, Deribe K, et al. National mortality burden due to communicable, maternal, neonatal, and nutritional diseases to non-communicable diseases in Ethiopia, 1990-2015: findings from the Global Burden of Disease Study 2015. Popul Health Metr. 2017;15(1):29.",
          url: "https://pubmed.ncbi.nlm.nih.gov/28830449/",
          isVerified: true,
        },
      ],
    },
  ],
  quiz: {
    moduleSlug: "introduction-to-health-research",
    title: "Module 1 Mastery Assessment: Foundations of Health Research",
    passPercentage: 70,
    displayCount: 10,
    questionBank: [
      {
        id: "m1-q01",
        type: "single-choice",
        topicTag: "Research Foundations",
        question:
          "What is the fundamental distinguishing characteristic of formal health research compared to routine clinical practice?",
        options: [
          {
            id: "opt-a",
            text: "Health research is designed to generate generalizable knowledge beyond the individual patient.",
            isCorrect: true,
            explanation:
              "Correct. Research aims to produce knowledge applicable across target populations, whereas clinical practice focuses solely on treating the presenting patient.",
          },
          {
            id: "opt-b",
            text: "Health research can only be performed by full professors in university laboratories.",
            isCorrect: false,
            explanation:
              "Incorrect. Health research is conducted by diverse clinicians, health officers, epidemiologists, and students at all levels of the health system.",
          },
          {
            id: "opt-c",
            text: "Health research is guaranteed to cure disease without any risk of scientific uncertainty.",
            isCorrect: false,
            explanation:
              "Incorrect. Research inherently explores uncertainty and tests unproven hypotheses; it offers no guaranteed cures.",
          },
          {
            id: "opt-d",
            text: "Health research does not require patient consent because knowledge belongs to the public.",
            isCorrect: false,
            explanation:
              "Incorrect. Informed consent is a foundational ethical requirement in all human subjects research.",
          },
        ],
        explanation:
          "Generalizability—the intent to discover principles that apply broadly to populations—is the core legal and ethical definition of research.",
      },
      {
        id: "m1-q02",
        type: "single-choice",
        topicTag: "Study Types",
        question:
          "A district medical officer measures the proportion of pregnant mothers in a woreda who attended at least 4 antenatal care visits in 2025. What type of study is this?",
        options: [
          {
            id: "opt-a",
            text: "Descriptive epidemiological study",
            isCorrect: true,
            explanation:
              "Correct. Characterizing the frequency of a health event in a defined population without comparison groups is descriptive epidemiology.",
          },
          {
            id: "opt-b",
            text: "Double-blind randomized controlled trial",
            isCorrect: false,
            explanation:
              "Incorrect. No experimental intervention or random assignment occurred.",
          },
          {
            id: "opt-c",
            text: "Retrospective case-control study",
            isCorrect: false,
            explanation:
              "Incorrect. Case-control studies compare cases with controls; this is a single cross-sectional descriptive proportion.",
          },
          {
            id: "opt-d",
            text: "Molecular pharmacogenomic trial",
            isCorrect: false,
            explanation:
              "Incorrect. This is public health service measurement, not a laboratory molecular investigation.",
          },
        ],
        explanation:
          "Descriptive studies measure disease frequency and healthcare utilization across Person, Place, and Time.",
      },
      {
        id: "m1-q03",
        type: "true-false-justification",
        topicTag: "Ethics Governance",
        question:
          "True or False: If a researcher only examines anonymized retrospective patient records from a hospital logbook, ethical review (IRB approval) is legally and scientifically waived in Ethiopia.",
        options: [
          {
            id: "opt-a",
            text: "True, because physical patients are not being administered new pharmacological drugs.",
            isCorrect: false,
            explanation:
              "Incorrect. Physical safety is only one dimension of research ethics; privacy and unauthorized access to medical records represent human subjects concerns.",
          },
          {
            id: "opt-b",
            text: "False, because patient medical files contain protected health data, and an independent IRB must evaluate the data privacy safeguards and grant a formal waiver of consent.",
            isCorrect: true,
            explanation:
              "Correct. Retrospective chart reviews still require formal submission to an Institutional Review Board. Only the IRB can grant an exemption or waiver of active consent.",
          },
          {
            id: "opt-c",
            text: "True, because public hospitals in Ethiopia belong to the government and all records are public domain.",
            isCorrect: false,
            explanation:
              "Incorrect. Medical records are strictly confidential patient documents, never public domain.",
          },
          {
            id: "opt-d",
            text: "False, because only laboratory animal research requires IRB clearance.",
            isCorrect: false,
            explanation:
              "Incorrect. Human subjects research is the primary domain of Institutional Review Boards.",
          },
        ],
        explanation:
          "Researchers cannot exempt themselves. An Institutional Review Board must formally review the protocol and determine whether a waiver of individual consent is ethically permissible.",
      },
      {
        id: "m1-q04",
        type: "multiple-select",
        topicTag: "Causality",
        question:
          "Select ALL conditions that can produce a strong statistical association between an exposure and an outcome in the ABSENCE of true biological causation:",
        options: [
          {
            id: "opt-a",
            text: "Confounding by an extraneous third variable.",
            isCorrect: true,
            explanation:
              "Correct. A common cause of both exposure and outcome creates a spurious correlation.",
          },
          {
            id: "opt-b",
            text: "Selection bias in how participants were recruited into the study.",
            isCorrect: true,
            explanation:
              "Correct. Non-representative sampling can distort observed risk estimates away from the truth.",
          },
          {
            id: "opt-c",
            text: "Random error (sampling variability / chance).",
            isCorrect: true,
            explanation:
              "Correct. In small samples, extreme differences can occur purely by chance.",
          },
          {
            id: "opt-d",
            text: "Complete temporality where the cause precedes the effect.",
            isCorrect: false,
            explanation:
              "Incorrect. Temporality supports causal inference rather than creating a false non-causal association.",
          },
        ],
        explanation:
          "Chance, bias, and confounding are the three primary alternative explanations for any non-causal statistical association.",
      },
      {
        id: "m1-q05",
        type: "scenario",
        topicTag: "Epidemiological Transition",
        scenario:
          "A health researcher in Hawassa is reviewing 10-year outpatient records at a referral hospital. In 2015, 78% of admissions were infectious diseases (malaria, pneumonia, gastroenteritis). In 2025, 46% of adult admissions are related to cardiovascular disease, diabetic nephropathy, and ischemic stroke, while tuberculosis remains prevalent in 22% of beds.",
        question:
          "Which epidemiological concept best characterizes this clinical reality?",
        options: [
          {
            id: "opt-a",
            text: "The Double Burden of Disease during an Epidemiological Transition.",
            isCorrect: true,
            explanation:
              "Correct. The coexistence of lingering infectious diseases alongside rapidly rising chronic non-communicable diseases defines the double burden.",
          },
          {
            id: "opt-b",
            text: "Spontaneous demographic extinction.",
            isCorrect: false,
            explanation:
              "Incorrect. The population is transitioning in disease burden, not undergoing extinction.",
          },
          {
            id: "opt-c",
            text: "Complete eradication of tropical infectious conditions.",
            isCorrect: false,
            explanation:
              "Incorrect. The scenario states that tuberculosis remains prevalent in 22% of beds.",
          },
          {
            id: "opt-d",
            text: "Pure clinical audit artifact.",
            isCorrect: false,
            explanation:
              "Incorrect. This reflects real macroeconomic, dietary, and lifestyle shifts seen across sub-Saharan Africa.",
          },
        ],
        explanation:
          "The double burden of disease is a hallmark of developing economies undergoing urbanization, nutritional changes, and longer life expectancy.",
      },
      {
        id: "m1-q06",
        type: "single-choice",
        topicTag: "Bradford Hill",
        question:
          "Which of the following Bradford Hill criteria is non-negotiable and strictly indispensable for establishing a causal relationship?",
        options: [
          {
            id: "opt-a",
            text: "Temporality (the exposure must precede the outcome).",
            isCorrect: true,
            explanation:
              "Correct. A cause cannot occur after its effect. Temporality is the only mandatory criterion.",
          },
          {
            id: "opt-b",
            text: "Biological gradient (must always exhibit linear dose-response).",
            isCorrect: false,
            explanation:
              "Incorrect. Some causal agents have threshold or U-shaped effects without simple linear gradients.",
          },
          {
            id: "opt-c",
            text: "Specificity of outcome.",
            isCorrect: false,
            explanation:
              "Incorrect. Tobacco smoke causes over 15 different cancers and cardiovascular diseases; lack of specificity does not refute causation.",
          },
          {
            id: "opt-d",
            text: "P-value less than 0.0001.",
            isCorrect: false,
            explanation:
              "Incorrect. P-values reflect sample size and statistical power, not biological causation.",
          },
        ],
        explanation:
          "Temporality is the sole mandatory requirement among the Bradford Hill guidelines.",
      },
      {
        id: "m1-q07",
        type: "critical-appraisal",
        topicTag: "Critical Appraisal",
        excerpt:
          "'A team of investigators distributed a voluntary English-language online survey on Twitter/X to assess the prevalence of major depressive disorder across rural subsistence farmers in Gojjam. Among the 120 individuals who clicked and completed the link, 85% reported severe depressive symptoms. The authors concluded that 85% of rural Ethiopian farmers suffer from clinical depression.'",
        question:
          "What is the most fatal methodological flaw in this published study?",
        options: [
          {
            id: "opt-a",
            text: "Severe selection bias and unrepresentative sampling frame.",
            isCorrect: true,
            explanation:
              "Correct. Rural subsistence farmers in Gojjam do not routinely possess smartphones, internet access, English literacy, or Twitter accounts. The sample is completely unrepresentative of the target population.",
          },
          {
            id: "opt-b",
            text: "The authors should have used a randomized controlled trial to measure depression prevalence.",
            isCorrect: false,
            explanation:
              "Incorrect. Randomized trials test interventions; prevalence is measured through cross-sectional surveys.",
          },
          {
            id: "opt-c",
            text: "Depression is not recognized by the World Health Organization.",
            isCorrect: false,
            explanation:
              "Incorrect. Major depression is a recognized leading cause of global disability.",
          },
          {
            id: "opt-d",
            text: "The sample size of 120 is physically impossible for a computer to analyze.",
            isCorrect: false,
            explanation:
              "Incorrect. Statistical software can analyze any sample size; the issue is selection bias.",
          },
        ],
        explanation:
          "Online voluntary English surveys cannot generalize to rural rural communities due to extreme digital and linguistic exclusion.",
      },
      {
        id: "m1-q08",
        type: "single-choice",
        topicTag: "Field Logistics",
        question:
          "Why is forward-and-backward translation considered standard methodology when adapting survey instruments in multilingual countries like Ethiopia?",
        options: [
          {
            id: "opt-a",
            text: "To ensure that conceptual and cultural equivalence is preserved rather than misleading literal word-for-word translation.",
            isCorrect: true,
            explanation:
              "Correct. Idioms, emotional terms, and health symptoms require conceptual matching; literal translation frequently misleads respondents.",
          },
          {
            id: "opt-b",
            text: "To double the administrative cost of the grant budget.",
            isCorrect: false,
            explanation:
              "Incorrect. Translation is performed for scientific validity, not budgetary inflation.",
          },
          {
            id: "opt-c",
            text: "Because Institutional Review Boards refuse to read local Ethiopian languages.",
            isCorrect: false,
            explanation:
              "Incorrect. Ethiopian IRBs actively require local language consent forms.",
          },
          {
            id: "opt-d",
            text: "To ensure that only bilingual participants can take part in the study.",
            isCorrect: false,
            explanation:
              "Incorrect. The goal is to reach monolingual community members accurately.",
          },
        ],
        explanation:
          "Independent backward translation reveals whether questions retained their intended scientific meaning when expressed in local cultural contexts.",
      },
      {
        id: "m1-q09",
        type: "single-choice",
        topicTag: "Evidence Hierarchy",
        question:
          "In the traditional Evidence-Based Medicine (EBM) pyramid, which study design provides the highest internal validity for determining whether a therapeutic drug works?",
        options: [
          {
            id: "opt-a",
            text: "Systematic Review & Meta-Analysis of Randomized Controlled Trials",
            isCorrect: true,
            explanation:
              "Correct. Meta-analyses of randomized trials pool multiple unbiased experiments, providing the highest level of therapeutic evidence.",
          },
          {
            id: "opt-b",
            text: "Single Retrospective Case Report of an interesting patient",
            isCorrect: false,
            explanation:
              "Incorrect. Case reports describe single anecdotal occurrences with high vulnerability to bias.",
          },
          {
            id: "opt-c",
            text: "Opinion editorial by a senior surgeon in a local newspaper",
            isCorrect: false,
            explanation:
              "Incorrect. Expert opinion without systematic data sits at the base of the evidence pyramid.",
          },
          {
            id: "opt-d",
            text: "Ecological correlation comparing national cereal exports to diabetes rates",
            isCorrect: false,
            explanation:
              "Incorrect. Ecological studies lack individual-level data and are prone to ecological fallacy.",
          },
        ],
        explanation:
          "Well-conducted systematic reviews of randomized controlled trials synthesize pooled experimental data with minimal bias.",
      },
      {
        id: "m1-q10",
        type: "single-choice",
        topicTag: "Research Ethics",
        question:
          "What is the role of the National Ethics Review Committee (NERC) in Ethiopia?",
        options: [
          {
            id: "opt-a",
            text: "To oversee national research ethics, evaluate clinical trials, and review studies involving international biological sample exports.",
            isCorrect: true,
            explanation:
              "Correct. NERC operates at the national level overseeing clinical trials and international biological transfer protocols.",
          },
          {
            id: "opt-b",
            text: "To arrest researchers who obtain negative experimental results.",
            isCorrect: false,
            explanation:
              "Incorrect. Negative or null results are valid scientific findings; ethical review protects human rights.",
          },
          {
            id: "opt-c",
            text: "To fund 100% of university tuition for medical students.",
            isCorrect: false,
            explanation:
              "Incorrect. NERC is an ethical oversight regulatory committee, not an educational scholarship fund.",
          },
          {
            id: "opt-d",
            text: "To write journal articles on behalf of hospital doctors.",
            isCorrect: false,
            explanation:
              "Incorrect. NERC reviews ethics proposals, it does not author research on behalf of others.",
          },
        ],
        explanation:
          "NERC is the apex national ethical regulatory body in Ethiopia under the Ministry of Innovation and Technology and Ministry of Health.",
      },
    ],
  },
  assignment: {
    id: "m1-assignment",
    moduleSlug: "introduction-to-health-research",
    title: "Practical Assignment: Formulating a Local Health Research Problem Statement",
    overview:
      "Transform an informal clinical or community health observation into a structured, scientifically defensible 400-word research problem statement.",
    scenario:
      "You are a public health officer stationed in a district health department in Ethiopia. Over the last 12 months, community health workers have reported that pregnant women in rural kebeles are attending their first antenatal care (ANC) visit late in the third trimester (after 28 weeks gestation), leading to unmanaged pre-eclampsia, anemia, and obstructed labor complications. Local clinical audits confirm the issue, but no empirical study has investigated the underlying socioeconomic, geographic, and behavioral factors.",
    instructions: [
      "1. Problem Definition: State the magnitude of the problem using available Ethiopian national data (e.g., EDHS ANC coverage metrics).",
      "2. The Know-Do Gap: Explain what is already known and what specific empirical knowledge is currently missing in your district.",
      "3. Target Population & Setting: Specify who will be investigated (e.g. reproductive-age women, health extension workers, village elders) and in which geographic catchment.",
      "4. The Core Research Question: Formulate one clear descriptive or analytical research question using PICO/PECO or equivalent.",
      "5. Significance: Explain how the generated evidence will inform regional health bureau policies or clinical practice.",
    ],
    deliverables: [
      "A structured 350-500 word Concept Note submitted in plain text or drafted inside the Tinat Research Workspace.",
    ],
    rubric: [
      {
        criterion: "Problem Magnitude & Context",
        points: 25,
        description:
          "Accurately frames the public health burden with reference to Ethiopian context and realistic health system constraints.",
      },
      {
        criterion: "Clarity of the Research Question",
        points: 30,
        description:
          "The question clearly specifies population, exposure/intervention, comparison (if analytical), and observable outcome.",
      },
      {
        criterion: "Distinction Between Audit and Research",
        points: 25,
        description:
          "Demonstrates that the proposed inquiry generates generalizable knowledge rather than simply repeating an internal clinical audit.",
      },
      {
        criterion: "Ethical and Logistical Feasibility",
        points: 20,
        description:
          "Identifies necessary ethical review pathways (IRB) and logistical considerations (language, transport, community consent).",
      },
    ],
    workspaceTemplateId: "CROSS_SECTIONAL",
  },
};
