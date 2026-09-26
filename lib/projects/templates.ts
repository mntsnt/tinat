import { ProjectPhase, ProjectTaskPriority, ProjectFileFolder } from "@/generated/prisma/enums";

export interface TemplateTask {
  title: string;
  description?: string;
  priority: ProjectTaskPriority;
  phase: ProjectPhase;
  labels: string[];
}

export interface TemplateMilestone {
  title: string;
  description?: string;
  phase: ProjectPhase;
  order: number;
  tasks: TemplateTask[];
}

export interface TemplateNote {
  category: string;
  title: string;
  content: string;
}

export interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  studyDesign: string;
  badge: string;
  suggestedPhases: ProjectPhase[];
  milestones: TemplateMilestone[];
  notes: TemplateNote[];
  folders: ProjectFileFolder[];
}

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: "CROSS_SECTIONAL",
    name: "Cross-Sectional Health Study",
    description:
      "Ideal for epidemiological surveys, prevalence assessments, KAP (Knowledge, Attitude, Practice) studies, and health behavior research following STROBE guidelines.",
    studyDesign: "Cross-Sectional Observational Study",
    badge: "Epidemiology & Public Health",
    suggestedPhases: [
      ProjectPhase.PLANNING,
      ProjectPhase.LITERATURE_REVIEW,
      ProjectPhase.PROTOCOL,
      ProjectPhase.ETHICS_APPROVAL,
      ProjectPhase.DATA_COLLECTION,
      ProjectPhase.DATA_CLEANING,
      ProjectPhase.ANALYSIS,
      ProjectPhase.MANUSCRIPT,
      ProjectPhase.SUBMISSION,
    ],
    folders: [
      ProjectFileFolder.PROTOCOL,
      ProjectFileFolder.LITERATURE,
      ProjectFileFolder.ETHICS,
      ProjectFileFolder.DATA,
      ProjectFileFolder.ANALYSIS,
      ProjectFileFolder.MANUSCRIPT,
      ProjectFileFolder.FIGURES,
    ],
    notes: [
      {
        category: "Research Question",
        title: "Primary Research Question & Hypothesis",
        content:
          "### Primary Question\nWhat is the prevalence of [Outcome] among [Target Population], and what are the key associated demographic and clinical factors?\n\n### Hypotheses\n- Null Hypothesis (H0): There is no significant association between [Exposure] and [Outcome].\n- Alternative Hypothesis (H1): [Exposure] is independently associated with higher odds of [Outcome].",
      },
      {
        category: "Inclusion & Exclusion",
        title: "Eligibility Criteria (STROBE Item 6)",
        content:
          "### Inclusion Criteria\n- Individuals aged ≥ 18 years residing in the study catchment area.\n- Able to provide informed voluntary consent.\n- Registered in the target health facility or university registry.\n\n### Exclusion Criteria\n- Severe acute cognitive impairment preventing voluntary consent.\n- Incomplete questionnaires (<80% completion).",
      },
      {
        category: "Methodology",
        title: "Sampling Strategy & Sample Size Calculation",
        content:
          "### Sample Size Estimation\nCalculated using Single Population Proportion formula (Cochran): n = (Z² * p * (1-p)) / d²\n- Z = 1.96 (95% CI)\n- p = Expected prevalence (assumed 50% for maximum sample size)\n- d = Margin of error (5%)\n- Adjusted for 10% non-response rate.",
      },
    ],
    milestones: [
      {
        title: "Study Protocol & Questionnaire Validation",
        description: "Drafting formal protocol and validating data collection instruments.",
        phase: ProjectPhase.PROTOCOL,
        order: 1,
        tasks: [
          {
            title: "Draft background, rationale, and specific objectives",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Protocol", "Writing"],
          },
          {
            title: "Design and pilot-test structured survey tool",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Questionnaire", "Piloting"],
          },
          {
            title: "Calculate statistical power and final sample size",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Biostatistics"],
          },
        ],
      },
      {
        title: "Institutional Review Board (IRB) Clearance",
        description: "Ethics committee submission, consent forms, and formal institutional approval.",
        phase: ProjectPhase.ETHICS_APPROVAL,
        order: 2,
        tasks: [
          {
            title: "Prepare participant information sheet and informed consent documents",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ETHICS_APPROVAL,
            labels: ["Ethics", "Consent"],
          },
          {
            title: "Submit IRB package to Institutional Ethics Committee",
            priority: ProjectTaskPriority.URGENT,
            phase: ProjectPhase.ETHICS_APPROVAL,
            labels: ["Ethics", "IRB"],
          },
          {
            title: "Address ethics reviewer comments and secure formal approval letter",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ETHICS_APPROVAL,
            labels: ["Ethics"],
          },
        ],
      },
      {
        title: "Primary Data Collection & Field Quality Control",
        description: "Deploy questionnaire on Tinat and coordinate responses.",
        phase: ProjectPhase.DATA_COLLECTION,
        order: 3,
        tasks: [
          {
            title: "Connect Tinat data-collection questionnaire study",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Tinat Study", "Integration"],
          },
          {
            title: "Monitor daily response accrual and participant demographics",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Data Collection", "Monitoring"],
          },
          {
            title: "Perform cross-validation and logic checks on incoming datasets",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.DATA_CLEANING,
            labels: ["Data Cleaning"],
          },
        ],
      },
      {
        title: "Statistical Analysis & Manuscript Submission",
        description: "Bivariate, multivariable logistic regression, and STROBE report.",
        phase: ProjectPhase.ANALYSIS,
        order: 4,
        tasks: [
          {
            title: "Compute descriptive statistics, prevalence rates, and 95% CIs",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["Analysis", "Statistics"],
          },
          {
            title: "Execute multivariable regression to identify independent risk factors",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["Analysis", "Regression"],
          },
          {
            title: "Draft full STROBE-compliant manuscript and select target journal",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.MANUSCRIPT,
            labels: ["Manuscript", "Publishing"],
          },
        ],
      },
    ],
  },
  {
    id: "CLINICAL_TRIAL",
    name: "Clinical Trial / Intervention Study",
    description:
      "Structured for prospective randomized or non-randomized interventional trials following ICH-GCP and CONSORT guidelines.",
    studyDesign: "Randomized Controlled Trial (RCT)",
    badge: "Clinical Investigation",
    suggestedPhases: [
      ProjectPhase.PLANNING,
      ProjectPhase.PROTOCOL,
      ProjectPhase.ETHICS_APPROVAL,
      ProjectPhase.DATA_COLLECTION,
      ProjectPhase.DATA_CLEANING,
      ProjectPhase.ANALYSIS,
      ProjectPhase.MANUSCRIPT,
      ProjectPhase.SUBMISSION,
      ProjectPhase.PUBLICATION,
    ],
    folders: [
      ProjectFileFolder.PROTOCOL,
      ProjectFileFolder.ETHICS,
      ProjectFileFolder.DATA,
      ProjectFileFolder.ANALYSIS,
      ProjectFileFolder.MANUSCRIPT,
      ProjectFileFolder.FIGURES,
      ProjectFileFolder.PRESENTATIONS,
    ],
    notes: [
      {
        category: "Methodology",
        title: "Clinical Trial Protocol & Interventions",
        content:
          "### Trial Design\nParallel-group, randomized, double-blind clinical evaluation.\n\n### Primary Endpoint\nMean change in biomarker or outcome score from baseline to Week 12.\n\n### Secondary Endpoints\n- Adverse event incidence (ICH-GCP reporting)\n- Patient adherence rate (%)",
      },
    ],
    milestones: [
      {
        title: "Regulatory & Ethics Clearance",
        description: "National regulatory body approvals, trial registry (ClinicalTrials.gov), and IRB.",
        phase: ProjectPhase.ETHICS_APPROVAL,
        order: 1,
        tasks: [
          {
            title: "Register study on Pan-African / ClinicalTrials.gov registry",
            priority: ProjectTaskPriority.URGENT,
            phase: ProjectPhase.ETHICS_APPROVAL,
            labels: ["Trial Registry"],
          },
          {
            title: "Establish Data and Safety Monitoring Board (DSMB) charter",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ETHICS_APPROVAL,
            labels: ["Safety", "DSMB"],
          },
        ],
      },
      {
        title: "Patient Recruitment & Protocol Adherence",
        description: "Screening, randomization, and clinical data collection.",
        phase: ProjectPhase.DATA_COLLECTION,
        order: 2,
        tasks: [
          {
            title: "Track participant recruitment milestones and dropout rates",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Recruitment"],
          },
          {
            title: "Log adverse events and protocol deviations",
            priority: ProjectTaskPriority.URGENT,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Safety Monitoring"],
          },
        ],
      },
      {
        title: "CONSORT Report & Final Analysis",
        description: "Intention-to-treat analysis and CONSORT flow diagram.",
        phase: ProjectPhase.ANALYSIS,
        order: 3,
        tasks: [
          {
            title: "Generate CONSORT patient flow diagram",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["CONSORT", "Figures"],
          },
          {
            title: "Perform Intention-To-Treat (ITT) primary outcome evaluation",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["Statistics", "ITT"],
          },
        ],
      },
    ],
  },
  {
    id: "SYSTEMATIC_REVIEW",
    name: "Systematic Review & Meta-Analysis",
    description:
      "Standardized synthesis of medical evidence following PRISMA guidelines and PROSPERO protocol registration.",
    studyDesign: "Systematic Review & Meta-Analysis",
    badge: "Evidence Synthesis",
    suggestedPhases: [
      ProjectPhase.PLANNING,
      ProjectPhase.PROTOCOL,
      ProjectPhase.LITERATURE_REVIEW,
      ProjectPhase.DATA_CLEANING,
      ProjectPhase.ANALYSIS,
      ProjectPhase.MANUSCRIPT,
      ProjectPhase.SUBMISSION,
    ],
    folders: [
      ProjectFileFolder.PROTOCOL,
      ProjectFileFolder.LITERATURE,
      ProjectFileFolder.DATA,
      ProjectFileFolder.ANALYSIS,
      ProjectFileFolder.MANUSCRIPT,
      ProjectFileFolder.FIGURES,
    ],
    notes: [
      {
        category: "Methodology",
        title: "PICO Criteria & Search Strings",
        content:
          "### PICO Framework\n- **Population:** [Specific target population]\n- **Intervention:** [Clinical or behavioral intervention]\n- **Comparator:** [Standard care or placebo]\n- **Outcome:** [Primary clinical metric]\n\n### Database Search String\n`(\"hypertension\"[MeSH Terms] OR \"high blood pressure\") AND (\"university students\" OR \"young adults\")`",
      },
    ],
    milestones: [
      {
        title: "PROSPERO Protocol Registration",
        description: "Formulate search strategy, register protocol publicly, and establish screening criteria.",
        phase: ProjectPhase.PROTOCOL,
        order: 1,
        tasks: [
          {
            title: "Define PICO questions and PRISMA-P protocol",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Protocol", "PRISMA"],
          },
          {
            title: "Submit protocol to PROSPERO international registry",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Registration", "PROSPERO"],
          },
        ],
      },
      {
        title: "Database Searches & Dual-Independent Screening",
        description: "Execute searches across PubMed, Scopus, Web of Science, and Cochrane.",
        phase: ProjectPhase.LITERATURE_REVIEW,
        order: 2,
        tasks: [
          {
            title: "Execute comprehensive search queries and export BibTeX/RIS records",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.LITERATURE_REVIEW,
            labels: ["Search", "Literature"],
          },
          {
            title: "Perform dual-independent title and abstract screening",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.LITERATURE_REVIEW,
            labels: ["Screening"],
          },
          {
            title: "Resolve screening conflicts by third senior reviewer consensus",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.LITERATURE_REVIEW,
            labels: ["Consensus"],
          },
        ],
      },
      {
        title: "Risk of Bias Assessment & Forest Plot Meta-Analysis",
        description: "Assess study quality (RoB 2 / ROBINS-I) and pool effect estimates.",
        phase: ProjectPhase.ANALYSIS,
        order: 3,
        tasks: [
          {
            title: "Extract effect sizes and study characteristics into standardized matrix",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.DATA_CLEANING,
            labels: ["Data Extraction"],
          },
          {
            title: "Conduct Risk of Bias evaluation using Cochrane RoB 2 / Newcastle-Ottawa scale",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["Risk of Bias"],
          },
          {
            title: "Generate Forest Plots and evaluate heterogeneity (I² statistic)",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["Meta-Analysis", "Forest Plot"],
          },
        ],
      },
    ],
  },
  {
    id: "THESIS_DISSERTATION",
    name: "Medical Student / Resident Thesis",
    description:
      "Tailored for medical undergraduate, postgraduate, and resident research with committee reviews, defense milestones, and hospital approval.",
    studyDesign: "Academic Thesis / Dissertation",
    badge: "Medical Education & Training",
    suggestedPhases: [
      ProjectPhase.IDEA,
      ProjectPhase.PLANNING,
      ProjectPhase.PROTOCOL,
      ProjectPhase.ETHICS_APPROVAL,
      ProjectPhase.DATA_COLLECTION,
      ProjectPhase.ANALYSIS,
      ProjectPhase.MANUSCRIPT,
      ProjectPhase.COMPLETED,
    ],
    folders: [
      ProjectFileFolder.PROTOCOL,
      ProjectFileFolder.ETHICS,
      ProjectFileFolder.LITERATURE,
      ProjectFileFolder.DATA,
      ProjectFileFolder.ANALYSIS,
      ProjectFileFolder.MANUSCRIPT,
      ProjectFileFolder.PRESENTATIONS,
    ],
    notes: [
      {
        category: "Meeting Notes",
        title: "Advisor / Committee Recommendations",
        content:
          "### Advisory Committee Feedback\n- Primary Advisor: [Advisor Name]\n- Department: [Department Name]\n- Key Guidance: Focus primary objective on clinically actionable parameters.",
      },
    ],
    milestones: [
      {
        title: "Proposal Defense & Departmental Approval",
        description: "Finalize research proposal and defend before departmental academic board.",
        phase: ProjectPhase.PROTOCOL,
        order: 1,
        tasks: [
          {
            title: "Draft research proposal document (Chapters 1-3)",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Proposal", "Writing"],
          },
          {
            title: "Conduct departmental proposal defense presentation",
            priority: ProjectTaskPriority.URGENT,
            phase: ProjectPhase.PROTOCOL,
            labels: ["Defense", "Presentation"],
          },
        ],
      },
      {
        title: "Hospital Data Collection & Analysis",
        description: "Field work, chart reviews, or patient questionnaires.",
        phase: ProjectPhase.DATA_COLLECTION,
        order: 2,
        tasks: [
          {
            title: "Secure hospital medical director site permission letter",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ETHICS_APPROVAL,
            labels: ["Hospital Access"],
          },
          {
            title: "Complete patient interviews / medical record extraction",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Data Collection"],
          },
        ],
      },
      {
        title: "Final Thesis Book & Public Defense",
        description: "Write discussion, bind thesis, and defend for degree qualification.",
        phase: ProjectPhase.MANUSCRIPT,
        order: 3,
        tasks: [
          {
            title: "Draft Results and Discussion (Chapters 4-5)",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.MANUSCRIPT,
            labels: ["Thesis Draft"],
          },
          {
            title: "Prepare defense slide deck and rehearse with advisors",
            priority: ProjectTaskPriority.URGENT,
            phase: ProjectPhase.MANUSCRIPT,
            labels: ["Final Defense"],
          },
        ],
      },
    ],
  },
  {
    id: "PUBLIC_HEALTH",
    name: "Community Health & NGO Assessment",
    description:
      "Built for community health assessments, NGO pilot interventions, WASH surveys, and health equity fieldwork.",
    studyDesign: "Community Health Assessment",
    badge: "Community & NGOs",
    suggestedPhases: [
      ProjectPhase.PLANNING,
      ProjectPhase.PROTOCOL,
      ProjectPhase.DATA_COLLECTION,
      ProjectPhase.DATA_CLEANING,
      ProjectPhase.ANALYSIS,
      ProjectPhase.MANUSCRIPT,
      ProjectPhase.COMPLETED,
    ],
    folders: [
      ProjectFileFolder.PROTOCOL,
      ProjectFileFolder.DATA,
      ProjectFileFolder.ANALYSIS,
      ProjectFileFolder.FIGURES,
      ProjectFileFolder.PRESENTATIONS,
      ProjectFileFolder.OTHER,
    ],
    notes: [
      {
        category: "Objectives",
        title: "Community Impact Goals & Key Indicators",
        content:
          "### Strategic Goals\n- Determine household access to primary care and essential medications.\n- Evaluate immunization coverage among under-5 children.\n- Provide actionable data for local health bureau and donor stakeholders.",
      },
    ],
    milestones: [
      {
        title: "Community Stakeholder Engagement",
        description: "Align with local health leaders, kebele/district administrators, and clinics.",
        phase: ProjectPhase.PLANNING,
        order: 1,
        tasks: [
          {
            title: "Conduct community leader sensitization meetings",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PLANNING,
            labels: ["Community", "Stakeholders"],
          },
          {
            title: "Recruit and train field health enumerators",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PLANNING,
            labels: ["Training"],
          },
        ],
      },
      {
        title: "Household Survey & Data Aggregation",
        description: "Collect mobile survey data and verify cluster representation.",
        phase: ProjectPhase.DATA_COLLECTION,
        order: 2,
        tasks: [
          {
            title: "Launch Tinat mobile survey across target clusters",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Tinat Mobile", "Survey"],
          },
          {
            title: "Aggregate household indicators and spatial coverage",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.DATA_CLEANING,
            labels: ["Data Verification"],
          },
        ],
      },
      {
        title: "Stakeholder Policy Brief & Dissemination",
        description: "Translate findings into actionable health policy recommendations.",
        phase: ProjectPhase.MANUSCRIPT,
        order: 3,
        tasks: [
          {
            title: "Produce visual executive summary & infographics",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.MANUSCRIPT,
            labels: ["Infographics", "Policy Brief"],
          },
          {
            title: "Host community feedback dissemination workshop",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.COMPLETED,
            labels: ["Workshop", "Dissemination"],
          },
        ],
      },
    ],
  },
  {
    id: "GENERAL",
    name: "General Health Research Project",
    description:
      "A flexible, fully customizable workspace suited for any laboratory, clinical, or epidemiological research endeavor.",
    studyDesign: "General Scientific Investigation",
    badge: "Flexible Template",
    suggestedPhases: [
      ProjectPhase.PLANNING,
      ProjectPhase.PROTOCOL,
      ProjectPhase.DATA_COLLECTION,
      ProjectPhase.ANALYSIS,
      ProjectPhase.MANUSCRIPT,
      ProjectPhase.PUBLICATION,
    ],
    folders: [
      ProjectFileFolder.PROTOCOL,
      ProjectFileFolder.LITERATURE,
      ProjectFileFolder.ETHICS,
      ProjectFileFolder.DATA,
      ProjectFileFolder.ANALYSIS,
      ProjectFileFolder.MANUSCRIPT,
      ProjectFileFolder.FIGURES,
      ProjectFileFolder.OTHER,
    ],
    notes: [
      {
        category: "General",
        title: "Project Overview & Key Objectives",
        content:
          "### Project Overview\nDocument the core clinical problem, project team charter, and target milestones here.",
      },
    ],
    milestones: [
      {
        title: "Project Inception & Protocol",
        description: "Define study aims, protocol, and team responsibilities.",
        phase: ProjectPhase.PLANNING,
        order: 1,
        tasks: [
          {
            title: "Draft project proposal and timeline",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.PLANNING,
            labels: ["Planning"],
          },
          {
            title: "Assign initial role responsibilities across team",
            priority: ProjectTaskPriority.MEDIUM,
            phase: ProjectPhase.PLANNING,
            labels: ["Team"],
          },
        ],
      },
      {
        title: "Data Collection & Analysis",
        description: "Gather primary or secondary data and perform statistical evaluation.",
        phase: ProjectPhase.DATA_COLLECTION,
        order: 2,
        tasks: [
          {
            title: "Execute data collection protocol",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.DATA_COLLECTION,
            labels: ["Data Collection"],
          },
          {
            title: "Synthesize preliminary statistical findings",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.ANALYSIS,
            labels: ["Analysis"],
          },
        ],
      },
      {
        title: "Dissemination & Publication",
        description: "Draft manuscript and prepare conference presentations.",
        phase: ProjectPhase.MANUSCRIPT,
        order: 3,
        tasks: [
          {
            title: "Draft manuscript and internal review",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.MANUSCRIPT,
            labels: ["Manuscript"],
          },
          {
            title: "Submit to peer-reviewed scientific journal",
            priority: ProjectTaskPriority.HIGH,
            phase: ProjectPhase.SUBMISSION,
            labels: ["Submission"],
          },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): ResearchTemplate {
  return RESEARCH_TEMPLATES.find((t) => t.id === id) || RESEARCH_TEMPLATES[0];
}
