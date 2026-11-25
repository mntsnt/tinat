import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputHtmlPath = path.resolve(__dirname, '../tinat-developer-manual.html');
const outputPdfPath = path.resolve(__dirname, '../Tinat_Platform_Developer_Architecture_Manual.pdf');
const brainPdfPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\7198fb25-ed5c-47fc-ad52-576777442792\\Tinat_Platform_Developer_Architecture_Manual.pdf';

console.log('Generating comprehensive Developer Architecture Manual...');

// HTML Content with full styling, typography, and embedded vector SVG figures
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tinat Health Network - Platform Architecture & Developer Manual</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #71717a;
      }
      @bottom-left {
        content: "Tinat Health Network · Platform Architecture Manual v2.6";
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #71717a;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #09090b;
      background: #ffffff;
      line-height: 1.55;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4, h5 {
      color: #064e3b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-weight: 700;
      margin-top: 1.4em;
      margin-bottom: 0.4em;
      page-break-after: avoid;
    }

    h1 { font-size: 20pt; line-height: 1.2; border-bottom: 2pt solid #047857; padding-bottom: 4px; }
    h2 { font-size: 13.5pt; border-bottom: 1px solid #d1fae5; padding-bottom: 3px; color: #047857; margin-top: 1.6em; }
    h3 { font-size: 11pt; color: #065f46; }
    h4 { font-size: 10pt; color: #1f2937; }

    p, li {
      color: #1f2937;
      text-align: justify;
      margin-bottom: 0.6em;
    }

    ul, ol {
      margin-top: 0.3em;
      margin-bottom: 0.6em;
      padding-left: 20px;
    }

    li {
      margin-bottom: 0.3em;
    }

    .cover-page {
      height: 96vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      border: 3px double #047857;
      padding: 36px 32px;
      box-sizing: border-box;
      background: linear-gradient(175deg, #f0fdf4 0%, #ffffff 40%, #f0fdf4 100%);
    }

    .cover-header {
      border-bottom: 2px solid #047857;
      padding-bottom: 16px;
    }

    .cover-badge {
      display: inline-block;
      background: #047857;
      color: white;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #064e3b;
      margin: 8px 0;
      line-height: 1.15;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #047857;
      font-weight: 500;
      margin-top: 4px;
    }

    .cover-meta {
      background: #ffffff;
      border: 1px solid #a7f3d0;
      padding: 16px;
      border-radius: 6px;
      font-size: 9pt;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    .figure-container {
      margin: 14px 0;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      page-break-inside: avoid;
      text-align: center;
    }

    .figure-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #064e3b;
      margin-top: 8px;
      text-align: center;
      letter-spacing: 0.02em;
    }

    .figure-caption {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 2px;
      text-align: center;
      line-height: 1.3;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }

    th {
      background: #047857;
      color: #ffffff;
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
      border: 1px solid #047857;
    }

    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .callout {
      border-left: 3.5px solid #047857;
      background: #ecfdf5;
      padding: 10px 14px;
      margin: 12px 0;
      border-radius: 0 6px 6px 0;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }

    .callout-title {
      font-weight: 700;
      color: #065f46;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .callout-warning .callout-title {
      color: #b45309;
    }

    code {
      font-family: "JetBrains Mono", Consolas, Monaco, monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f766e;
      padding: 1.5px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #09130e;
      color: #e2e8f0;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: "JetBrains Mono", Consolas, monospace;
      font-size: 7.5pt;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      border: 1px solid #064e3b;
    }

    .toc {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 18px 24px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 9pt;
      page-break-after: always;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 7px;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 2px;
    }

    .toc-title {
      font-weight: 600;
      color: #0f172a;
    }

    .toc-page {
      font-family: monospace;
      color: #047857;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-badge">Core Architecture Manual · Confidential</div>
      <div class="cover-title">TINAT HEALTH NETWORK</div>
      <div class="cover-subtitle">Complete Platform Engineering, Data Pipelines & Technical Architecture Specification</div>
      <p style="margin-top: 10px; color: #475569; font-size: 9.5pt;">
        Official comprehensive developer reference guide covering application architecture, entity models, cryptographic Fayda privacy separation, offline-first field synchronization, double-entry financial ledger invariance, and Tinat Forms engine.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <svg width="420" height="150" viewBox="0 0 420 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="400" height="130" rx="12" fill="#061b11" stroke="#059669" stroke-width="2"/>
        <circle cx="50" cy="50" r="18" fill="#047857" fill-opacity="0.4" stroke="#34d399" stroke-width="1.5"/>
        <path d="M44 50L48 54L56 46" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="80" y="46" fill="#ffffff" font-size="12" font-family="sans-serif" font-weight="bold">TRI-PORTAL RESEARCH INFRASTRUCTURE</text>
        <text x="80" y="62" fill="#a7f3d0" font-size="9" font-family="sans-serif">Admin Console · Researcher Workspace · Participant & Field Hub</text>
        
        <rect x="30" y="86" width="105" height="38" rx="6" fill="#0d2b1d" stroke="#10b981" stroke-width="1"/>
        <text x="82" y="102" fill="#34d399" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">FAYDA IDENTITY</text>
        <text x="82" y="115" fill="#e2e8f0" font-size="7.5" font-family="sans-serif" text-anchor="middle">SHA-256 FAN Hash</text>

        <rect x="155" y="86" width="110" height="38" rx="6" fill="#0d2b1d" stroke="#10b981" stroke-width="1"/>
        <text x="210" y="102" fill="#34d399" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE FIELD SYNC</text>
        <text x="210" y="115" fill="#e2e8f0" font-size="7.5" font-family="sans-serif" text-anchor="middle">Melka Nono / SPHMMC</text>

        <rect x="285" y="86" width="105" height="38" rx="6" fill="#0d2b1d" stroke="#10b981" stroke-width="1"/>
        <text x="337" y="102" fill="#34d399" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">IMMUTABLE LEDGER</text>
        <text x="337" y="115" fill="#e2e8f0" font-size="7.5" font-family="sans-serif" text-anchor="middle">Append-Only Triggers</text>
      </svg>
    </div>

    <div class="cover-meta">
      <div>
        <strong>System Version:</strong> v2.6.4 (Production Release)<br>
        <strong>Runtime Engine:</strong> Next.js 16 (App Router) + Node.js 26<br>
        <strong>Database Engine:</strong> PostgreSQL 16 + Prisma ORM 7<br>
        <strong>Target Ecosystem:</strong> Federal Democratic Republic of Ethiopia
      </div>
      <div>
        <strong>Lead Engineer:</strong> Lead Full-Stack Platform Engineer<br>
        <strong>Academic Partner:</strong> SPHMMC & AAU Health Sciences<br>
        <strong>Security Level:</strong> Protected Healthcare Informatics<br>
        <strong>Release Date:</strong> November 25, 2026
      </div>
    </div>
  </div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <div class="toc">
    <h2 style="margin-top: 0; color: #047857; border-bottom: 2px solid #047857; padding-bottom: 6px;">TABLE OF CONTENTS</h2>
    <div class="toc-item"><span class="toc-title">1. Executive Summary & Full-Stack System Architecture</span><span class="toc-page">Ch. 1</span></div>
    <div class="toc-item"><span class="toc-title">2. Identity, Authentication & Cryptographic Fayda Privacy Protocol</span><span class="toc-page">Ch. 2</span></div>
    <div class="toc-item"><span class="toc-title">3. Clinical Study Lifecycle & Dual-Admin Ethics Review (IRB)</span><span class="toc-page">Ch. 3</span></div>
    <div class="toc-item"><span class="toc-title">4. Offline-First Field Enumerator Engine & Cloud Synchronization</span><span class="toc-page">Ch. 4</span></div>
    <div class="toc-item"><span class="toc-title">5. Immutable Double-Entry Ledger & Financial Invariance</span><span class="toc-page">Ch. 5</span></div>
    <div class="toc-item"><span class="toc-title">6. Tinat Forms: Independent No-Code Survey Architecture</span><span class="toc-page">Ch. 6</span></div>
    <div class="toc-item"><span class="toc-title">7. Tinat Ask & Clinical AI Copilot Subsystems</span><span class="toc-page">Ch. 7</span></div>
    <div class="toc-item"><span class="toc-title">8. Geographic Reach & 12-Region Spatial Intelligence</span><span class="toc-page">Ch. 8</span></div>
    <div class="toc-item"><span class="toc-title">9. Complete Prisma Entity-Relationship Schema Dictionary</span><span class="toc-page">Ch. 9</span></div>
    <div class="toc-item"><span class="toc-title">10. Developer Runbook, Test Seeding & API Security Matrix</span><span class="toc-page">Ch. 10</span></div>
  </div>

  <!-- ==================== CHAPTER 1 ==================== -->
  <h1>Chapter 1: Executive Summary & Full-Stack Architecture</h1>
  
  <p>
    The <strong>Tinat Health Network</strong> is a decentralized clinical research and demographic telemetry infrastructure built specifically for the healthcare, academic, and epidemiological realities of Ethiopia. It unifies clinical investigators, medical universities (e.g. St. Paul’s Hospital Millennium Medical College [SPHMMC] and Addis Ababa University [AAU]), rural health extension workers, and verified citizens into an end-to-end data pipeline.
  </p>

  <h2>1.1 Multi-Tier Technology Topology</h2>
  <p>
    Tinat is engineered using a robust modern stack designed for high throughput, serverless execution capability, and strict database-level transactional guarantees:
  </p>
  <ul>
    <li><strong>Client Presentation Tier:</strong> Next.js 16 App Router using React Server Components (RSC) by default for zero-client bundle overhead, hydrating into responsive client components using Tailwind CSS v4, Framer Motion for scroll-reveals, and Lucide icons.</li>
    <li><strong>Application & Security Tier:</strong> Edge-compatible middleware and dynamic Node.js runtime with centralized server-side JWT session validation via <code>jose</code>, strict Deny-by-Default authorization matrices, and rate-limiting guards.</li>
    <li><strong>Data Access Tier:</strong> Prisma Client (v7) integrated with <code>@prisma/adapter-pg</code> and a high-performance <code>pg.Pool</code> connection manager handling connection timeouts, idle pool reclamation, and concurrent transaction serialization.</li>
    <li><strong>Persistence Tier:</strong> PostgreSQL 16 hosted with strict schema constraints, foreign key cascades, and low-level PL/pgSQL database triggers protecting immutable ledgers.</li>
  </ul>

  <!-- FIGURE 1: HIGH-LEVEL ARCHITECTURE -->
  <div class="figure-container">
    <svg width="100%" height="220" viewBox="0 0 680 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Clients -->
      <rect x="10" y="15" width="130" height="190" rx="8" fill="#f0fdf4" stroke="#059669" stroke-width="1.5"/>
      <text x="75" y="35" fill="#065f46" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">CLIENT TIER</text>
      <rect x="22" y="48" width="106" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="75" y="68" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Admin Dashboard (/admin)</text>
      <rect x="22" y="86" width="106" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="75" y="106" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Researcher Workspace</text>
      <rect x="22" y="124" width="106" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="75" y="144" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Participant Hub (/participant)</text>
      <rect x="22" y="162" width="106" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="75" y="182" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Tinat Forms Runner (/f/[id])</text>

      <!-- Connection Arrows -->
      <path d="M140 110 L180 110" stroke="#059669" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- App Server Tier -->
      <rect x="180" y="15" width="220" height="190" rx="8" fill="#f8fafc" stroke="#0284c7" stroke-width="1.5"/>
      <text x="290" y="35" fill="#0369a1" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">NEXT.JS 16 APPLICATION TIER</text>
      
      <rect x="195" y="48" width="190" height="28" rx="4" fill="#ffffff" stroke="#94a3b8"/>
      <text x="290" y="65" fill="#0f172a" font-size="8" font-family="sans-serif" text-anchor="middle">Auth Guard & JWT Session (jose)</text>

      <rect x="195" y="82" width="190" height="36" rx="4" fill="#ffffff" stroke="#94a3b8"/>
      <text x="290" y="98" fill="#0f172a" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">API & Server Actions</text>
      <text x="290" y="111" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">Studies · Forms · Sync · Ethics · Wallet</text>

      <rect x="195" y="124" width="190" height="28" rx="4" fill="#ffffff" stroke="#94a3b8"/>
      <text x="290" y="141" fill="#0f172a" font-size="8" font-family="sans-serif" text-anchor="middle">Tinat AI Engine (Gemini 2.5 Flash)</text>

      <rect x="195" y="158" width="190" height="32" rx="4" fill="#e0f2fe" stroke="#38bdf8"/>
      <text x="290" y="178" fill="#0369a1" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">PrismaPg Adapter + pg.Pool</text>

      <!-- Connection Arrows -->
      <path d="M400 110 L440 110" stroke="#0284c7" stroke-width="2"/>

      <!-- Database Tier -->
      <rect x="440" y="15" width="225" height="190" rx="8" fill="#fdf4ff" stroke="#a21caf" stroke-width="1.5"/>
      <text x="552" y="35" fill="#86198f" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">DATABASE & STORAGE TIER</text>

      <rect x="455" y="48" width="195" height="32" rx="4" fill="#ffffff" stroke="#d8b4fe"/>
      <text x="552" y="64" fill="#3b0764" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">PostgreSQL Relational Storage</text>
      <text x="552" y="74" fill="#701a75" font-size="7" font-family="sans-serif" text-anchor="middle">Users · Studies · Questions · Responses</text>

      <rect x="455" y="86" width="195" height="48" rx="4" fill="#fae8ff" stroke="#c084fc"/>
      <text x="552" y="103" fill="#86198f" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Append-Only Immutable Ledger</text>
      <text x="552" y="115" fill="#a21caf" font-size="7" font-family="sans-serif" text-anchor="middle">DB Trigger: Block DELETE/UPDATE</text>
      <text x="552" y="127" fill="#701a75" font-size="7" font-family="sans-serif" text-anchor="middle">Double-Entry Balanced Journals</text>

      <rect x="455" y="140" width="195" height="50" rx="4" fill="#ffffff" stroke="#d8b4fe"/>
      <text x="552" y="158" fill="#3b0764" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">External Integration Services</text>
      <text x="552" y="170" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">Fayda National ID API · Telebirr · CBE Birr</text>
      <text x="552" y="182" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">SPHMMC Ethics Verification Registry</text>
    </svg>
    <div class="figure-title">Figure 1: Full-Stack Multi-Tier Topology of the Tinat Health Network</div>
    <div class="figure-caption">Diagram illustrates client interfaces, Next.js server runtime components, PrismaPg adapter pool, and immutable PostgreSQL persistence layers.</div>
  </div>

  <!-- ==================== CHAPTER 2 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 2: Identity, Authentication & Fayda Cryptographic Privacy</h1>

  <p>
    In healthcare and clinical research, data validity must be achieved without violating patient rights or doctor-patient confidentiality. Tinat resolves the tension between <em>one-person-one-response verification</em> and <em>participant privacy</em> through a cryptographic separation architecture.
  </p>

  <h2>2.1 Session Management & Token Resolution</h2>
  <p>
    Authentication does not rely on opaque third-party sessions. Instead, Tinat issues cryptographically signed JSON Web Tokens (JWT) using HMAC-SHA256 via the <code>jose</code> library:
  </p>
  <ul>
    <li><strong>Token Issuance:</strong> Generated on <code>/api/auth/login</code> upon successful bcrypt password hash matching (cost factor 10) and verification check.</li>
    <li><strong>Dual Storage Strategy:</strong> Embedded in an <code>httpOnly</code>, <code>sameSite: "lax"</code>, 7-day cookie named <code>tinat_session</code> for browser contexts, with automatic bearer token extraction fallback for mobile and API clients.</li>
    <li><strong>Auth Guard Pipeline:</strong> Implemented in <code>lib/authGuard.ts</code>, resolving user identity and verifying active account state before any server action or protected route execution.</li>
  </ul>

  <h2>2.2 Fayda Biometric Hashing (FAN Hashing)</h2>
  <p>
    To eliminate duplicate participant entries and bot farm manipulation without storing vulnerable biometric or identification numbers in plaintext, Tinat processes Ethiopian Fayda National Identification Numbers through cryptographic hashing:
  </p>
  <pre>const fanHash = crypto.createHash('sha256').update(rawFaydaNumber.trim()).digest('hex');</pre>
  <p>
    The resulting hash is stored in <code>User.faydaFanHash</code> with a unique database constraint (<code>@unique</code>). Any attempt by the same individual to register duplicate accounts with different emails will fail at the database level.
  </p>

  <h2>2.3 Zero-Knowledge Respondent Tokenization</h2>
  <p>
    When a participant engages with a clinical study, their personal profile (Name, Email, Phone, Institution) is <strong>permanently isolated</strong> from their medical responses. The intermediary model <code>ParticipantLink</code> generates a non-reversible randomized token (e.g. <code>RESP-WGJVV7</code>):
  </p>

  <!-- FIGURE 2: FAYDA PRIVACY ARCHITECTURE -->
  <div class="figure-container">
    <svg width="100%" height="190" viewBox="0 0 680 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Citizen Card -->
      <rect x="20" y="25" width="160" height="140" rx="8" fill="#f0fdf4" stroke="#059669" stroke-width="1.5"/>
      <text x="100" y="45" fill="#065f46" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">USER IDENTITY TIER</text>
      <rect x="32" y="58" width="136" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="100" y="74" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">Name: Bethlehem Tadesse</text>
      <rect x="32" y="88" width="136" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="100" y="104" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">Phone: +251 911 987654</text>
      <rect x="32" y="118" width="136" height="34" rx="4" fill="#dcfce7" stroke="#86efac"/>
      <text x="100" y="132" fill="#15803d" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Fayda National ID</text>
      <text x="100" y="144" fill="#166534" font-size="6.5" font-family="monospace" text-anchor="middle">SHA-256 FAN Hash</text>

      <!-- Arrow to Link -->
      <path d="M180 95 L240 95" stroke="#059669" stroke-width="2"/>
      <text x="210" y="88" fill="#047857" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Links via</text>

      <!-- ParticipantLink Isolation Layer -->
      <rect x="240" y="35" width="180" height="120" rx="8" fill="#f8fafc" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="330" y="55" fill="#1d4ed8" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">ISOLATION BARRIER</text>
      <rect x="252" y="68" width="156" height="40" rx="4" fill="#eff6ff" stroke="#93c5fd"/>
      <text x="330" y="84" fill="#1e40af" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">ParticipantLink Model</text>
      <text x="330" y="98" fill="#2563eb" font-size="7" font-family="monospace" text-anchor="middle">respondentCode = "RESP-A9X2"</text>
      <text x="330" y="135" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">Strict DB Isolation Boundary</text>

      <!-- Arrow to Clinical Data -->
      <path d="M420 95 L480 95" stroke="#3b82f6" stroke-width="2"/>
      <text x="450" y="88" fill="#2563eb" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Tokens only</text>

      <!-- Clinical Data Tier -->
      <rect x="480" y="25" width="180" height="140" rx="8" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
      <text x="570" y="45" fill="#9d174d" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">CLINICAL DATA TIER</text>
      <rect x="492" y="58" width="156" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="570" y="74" fill="#0f172a" font-size="7.5" font-family="monospace" text-anchor="middle">Response.respondentCode</text>
      <rect x="492" y="88" width="156" height="64" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="570" y="103" fill="#831843" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Clinical Answers</text>
      <text x="570" y="117" fill="#475569" font-size="7" font-family="sans-serif" text-anchor="middle">• Facility: Kolfe Health Center</text>
      <text x="570" y="129" fill="#475569" font-size="7" font-family="sans-serif" text-anchor="middle">• Antenatal Care Visits: 4</text>
      <text x="570" y="141" fill="#475569" font-size="7" font-family="sans-serif" text-anchor="middle">• Iron / Folic Acid: true</text>
    </svg>
    <div class="figure-title">Figure 2: Cryptographic Fayda Hashing & Zero-Knowledge Participant De-identification</div>
    <div class="figure-caption">Researchers and export files only possess randomized respondent tokens. Identity metadata remains cryptographically decoupled.</div>
  </div>

  <!-- ==================== CHAPTER 3 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 3: Clinical Study Lifecycle & Ethics Governance</h1>

  <p>
    Tinat enforces strict institutional governance adhering to the Ethiopian National Health Research Ethics Review Guideline. Studies published on the public research feed must complete a certified review process before recruiting participants.
  </p>

  <h2>3.1 Study State Machine</h2>
  <p>
    The lifecycle of a clinical study transitions through four distinct states defined in <code>StudyStatus</code>:
  </p>
  <ul>
    <li><strong>DRAFT:</strong> Editable workspace for the Principal Investigator. Questions, target population, eligibility criteria, and consent forms are configured.</li>
    <li><strong>ACTIVE:</strong> The study has satisfied ethics verification and is open for participant recruitment and field enumerator data capture.</li>
    <li><strong>PAUSED:</strong> Submissions are temporarily halted (e.g., sample quota reached or intermediate review required).</li>
    <li><strong>COMPLETED:</strong> Data collection terminated. Dataset locked for final statistical synthesis and export.</li>
  </ul>

  <!-- FIGURE 3: STUDY LIFECYCLE -->
  <div class="figure-container">
    <svg width="100%" height="160" viewBox="0 0 680 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Draft Box -->
      <rect x="15" y="45" width="105" height="70" rx="6" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
      <text x="67" y="72" fill="#334155" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. DRAFT</text>
      <text x="67" y="88" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">Author Study</text>
      <text x="67" y="99" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">Design Questions</text>

      <path d="M120 80 L165 80" stroke="#047857" stroke-width="2"/>

      <!-- IRB Box -->
      <rect x="165" y="30" width="145" height="100" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
      <text x="237" y="52" fill="#92400e" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. ETHICS REVIEW</text>
      <text x="237" y="68" fill="#78350f" font-size="7" font-family="sans-serif" text-anchor="middle">SPHMMC / AAU IRB Check</text>
      <text x="237" y="82" fill="#b45309" font-size="7" font-family="sans-serif" text-anchor="middle">• IRB Certificate Verify</text>
      <text x="237" y="94" fill="#b45309" font-size="7" font-family="sans-serif" text-anchor="middle">• Dual-Admin Sign-Off</text>
      <text x="237" y="106" fill="#b45309" font-size="7" font-family="sans-serif" text-anchor="middle">• Consent Version 1.0</text>

      <path d="M310 80 L355 80" stroke="#047857" stroke-width="2"/>

      <!-- Active Box -->
      <rect x="355" y="45" width="115" height="70" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
      <text x="412" y="72" fill="#065f46" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. ACTIVE</text>
      <text x="412" y="88" fill="#047857" font-size="7" font-family="sans-serif" text-anchor="middle">Live Public Feed</text>
      <text x="412" y="99" fill="#047857" font-size="7" font-family="sans-serif" text-anchor="middle">Field Collection</text>

      <path d="M470 80 L515 80" stroke="#64748b" stroke-width="1.5"/>

      <!-- Paused/Completed -->
      <rect x="515" y="25" width="150" height="110" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="590" y="48" fill="#1e293b" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">4. CLOSE / EXPORT</text>
      <rect x="527" y="58" width="126" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="590" y="76" fill="#334155" font-size="7.5" font-family="sans-serif" text-anchor="middle">Status: PAUSED / COMPLETED</text>
      <rect x="527" y="92" width="126" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="590" y="106" fill="#047857" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Excel / CSV Stream</text>
      <text x="590" y="116" fill="#64748b" font-size="6.5" font-family="sans-serif" text-anchor="middle">SPSS, STATA Codebook</text>
    </svg>
    <div class="figure-title">Figure 3: Clinical Study Governance & IRB Approval Pipeline</div>
    <div class="figure-caption">Studies transition from drafting to certified ethical compliance before enrolling participants.</div>
  </div>

  <h2>3.2 Supported Question Types & Validation Architecture</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Question Type</th>
        <th style="width: 35%;">Database Storage Schema</th>
        <th style="width: 40%;">Clinical Research Application</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>SHORT_TEXT</code></td>
        <td><code>Answer.textValue (String)</code></td>
        <td>Facility names, Kebele identifier, Woreda, phone contacts.</td>
      </tr>
      <tr>
        <td><code>LONG_TEXT</code></td>
        <td><code>Answer.textValue (String)</code></td>
        <td>Qualitative patient feedback, clinical symptoms, doctor remarks.</td>
      </tr>
      <tr>
        <td><code>SINGLE_CHOICE</code></td>
        <td><code>Answer.textValue = Option.value</code></td>
        <td>Mutually exclusive primary healthcare provider, blood group.</td>
      </tr>
      <tr>
        <td><code>MULTIPLE_CHOICE</code></td>
        <td><code>Answer.textValue = JSON.stringify(values)</code></td>
        <td>Multi-symptom triage, immunization schedule checklists.</td>
      </tr>
      <tr>
        <td><code>NUMBER</code></td>
        <td><code>Answer.numberValue (Float)</code></td>
        <td>Systolic/Diastolic BP, BMI, ANC visits completed, age in months.</td>
      </tr>
      <tr>
        <td><code>LINEAR_SCALE</code></td>
        <td><code>Answer.numberValue (Int 1-5 or 1-10)</code></td>
        <td>Pain assessment (Wong-Baker), counseling satisfaction metrics.</td>
      </tr>
      <tr>
        <td><code>YES_NO</code></td>
        <td><code>Answer.textValue ("true" | "false")</code></td>
        <td>EPI vaccine adherence, free micronutrient receipt indicator.</td>
      </tr>
      <tr>
        <td><code>DATE</code></td>
        <td><code>Answer.textValue (ISO-8601 String)</code></td>
        <td>Estimated delivery date (EDD), last menstrual period (LMP).</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== CHAPTER 4 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 4: Offline-First Field Enumeration & Synchronization</h1>

  <p>
    A critical limitation of Western research platforms is the dependency on continuous, high-speed mobile internet. In rural Ethiopian kebeles (such as Melka Nono Woreda, Sheger City), cellular data is intermittent or non-existent.
  </p>

  <h2>4.1 Local Client Storage Architecture</h2>
  <p>
    When an accredited field data collector opens an active census assignment, the study questions, validation schemas, and collector session credentials are synchronized and cached locally in the browser’s <strong>IndexedDB / localStorage</strong> storage space:
  </p>
  <ul>
    <li><strong>Autonomous Execution:</strong> Medical student enumerators conduct door-to-door interviews with zero cell coverage.</li>
    <li><strong>Session Preservation:</strong> If a household interview is interrupted, the draft answers remain persisted locally with timestamps and kebele coordinates.</li>
    <li><strong>Network State Sensing:</strong> A background service monitors network state transitions using the browser's <code>navigator.onLine</code> events and proactive heartbeat pings to <code>/api/health</code>.</li>
  </ul>

  <!-- FIGURE 4: OFFLINE SYNC -->
  <div class="figure-container">
    <svg width="100%" height="200" viewBox="0 0 680 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Offline Zone -->
      <rect x="15" y="20" width="230" height="160" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="130" y="40" fill="#991b1b" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">RURAL FIELD ZONE (OFFLINE)</text>
      
      <rect x="30" y="55" width="200" height="32" rx="4" fill="#ffffff" stroke="#fca5a5"/>
      <text x="130" y="71" fill="#1e293b" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. Melka Nono Rural Kebele</text>
      <text x="130" y="81" fill="#7f1d1d" font-size="6.5" font-family="sans-serif" text-anchor="middle">Zero Internet / No Cellular Data</text>

      <rect x="30" y="95" width="200" height="36" rx="4" fill="#ffffff" stroke="#fca5a5"/>
      <text x="130" y="111" fill="#1e293b" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. Local Storage / IndexedDB</text>
      <text x="130" y="123" fill="#7f1d1d" font-size="6.5" font-family="monospace" text-anchor="middle">IndexedDB: 68 Indicators Cached</text>

      <rect x="30" y="139" width="200" height="28" rx="4" fill="#fee2e2" stroke="#f87171"/>
      <text x="130" y="157" fill="#b91c1c" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Queued Payload: Batch Responses</text>

      <!-- Sync Transition Arrow -->
      <path d="M245 100 L335 100" stroke="#059669" stroke-width="2.5" marker-end="url(#arrow)"/>
      <text x="290" y="90" fill="#047857" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Network</text>
      <text x="290" y="115" fill="#047857" font-size="7" font-family="sans-serif" text-anchor="middle">Re-established</text>

      <!-- Cloud Ingestion Zone -->
      <rect x="335" y="20" width="330" height="160" rx="8" fill="#f0fdf4" stroke="#059669" stroke-width="1.5"/>
      <text x="500" y="40" fill="#065f46" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">TINAT CLOUD RECONCILIATION API</text>

      <rect x="350" y="55" width="300" height="32" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="500" y="70" fill="#0f172a" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. POST /api/collector/sessions/sync</text>
      <text x="500" y="81" fill="#15803d" font-size="6.5" font-family="sans-serif" text-anchor="middle">Atomic Validation & Idempotency Key Verification</text>

      <rect x="350" y="95" width="300" height="34" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="500" y="110" fill="#0f172a" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">4. Conflict Resolution & Upsert</text>
      <text x="500" y="122" fill="#15803d" font-size="6.5" font-family="sans-serif" text-anchor="middle">Unique Constraint @@unique([studyId, respondentCode])</text>

      <rect x="350" y="137" width="300" height="30" rx="4" fill="#dcfce7" stroke="#22c55e"/>
      <text x="500" y="152" fill="#14532d" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">5. Instant Ledger Balance & Live Analytics Update</text>
      <text x="500" y="161" fill="#166534" font-size="6.5" font-family="sans-serif" text-anchor="middle">Charts Re-indexed · Excel Exports Updated</text>
    </svg>
    <div class="figure-title">Figure 4: Offline Field Data Capture and Cloud Ingestion Protocol</div>
    <div class="figure-caption">Data collection proceeds without active connectivity; payloads synchronize with deduplication upon connection restoration.</div>
  </div>

  <h2>4.2 Batch Upload & Conflict Resolution Protocol</h2>
  <p>
    When back in cellular range, the client issues a multi-response batch request. Each submission includes:
  </p>
  <ul>
    <li><code>respondentCode</code>: Unique generated identifier.</li>
    <li><code>collectorId</code>: User ID of the accredited medical student.</li>
    <li><code>collectionSessionId</code>: Unique field session identifier.</li>
    <li><code>collectionMethod</code>: Flagged as <code>FIELD_COLLECTED</code>.</li>
  </ul>
  <p>
    The database enforces the constraint <code>@@unique([studyId, respondentCode])</code>. Retried submissions resulting from unstable network handshakes safely deduplicate without generating duplicate answers.
  </p>

  <!-- ==================== CHAPTER 5 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 5: Immutable Double-Entry Ledger & Financial Invariance</h1>

  <p>
    Research grant funds and participant reward credits are protected by an enterprise-grade <strong>Double-Entry Append-Only Ledger</strong>. Credits are never created or destroyed arbitrarily; every credit awarded to a participant is mathematically balanced by a deduction from an issuance account.
  </p>

  <h2>5.1 Balanced Double-Entry Principles</h2>
  <p>
    Following strict financial accounting standards (ADR 0001), credit allocation operates inside a single atomic database transaction (<code>prisma.$transaction</code>):
  </p>
  <ul>
    <li><strong>System Issuance Account:</strong> Represents the platform reserve balance (<code>kind: "SYSTEM_ISSUANCE"</code>). When credits are granted, this account balance is decremented by <em>N</em>.</li>
    <li><strong>User Wallet Account:</strong> Represents the participant or researcher credit store (<code>kind: "USER_WALLET"</code>). The user account balance is incremented by <em>N</em>.</li>
    <li><strong>Net Balance Invariance:</strong> The algebraic sum of all lines across <code>LedgerEntry</code> strictly equals zero:
      <pre>Sum(Entries) = ΔSystem_Issuance (-N) + ΔUser_Wallet (+N) = 0</pre>
    </li>
  </ul>

  <!-- FIGURE 5: DOUBLE-ENTRY LEDGER -->
  <div class="figure-container">
    <svg width="100%" height="190" viewBox="0 0 680 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="640" height="150" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
      <text x="340" y="38" fill="#0f172a" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">ATOMIC DOUBLE-ENTRY TRANSACTION (PRISMA TRANSACTION RUNNER)</text>

      <!-- Ledger Journal Box -->
      <rect x="35" y="52" width="165" height="102" rx="6" fill="#ffffff" stroke="#94a3b8"/>
      <text x="117" y="70" fill="#0f172a" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. LedgerJournal Record</text>
      <text x="117" y="86" fill="#475569" font-size="7" font-family="monospace" text-anchor="middle">idempotencyKey:</text>
      <text x="117" y="98" fill="#0f766e" font-size="6.5" font-family="monospace" text-anchor="middle">"reward-{studyId}-{respId}"</text>
      <rect x="47" y="108" width="141" height="34" rx="4" fill="#f1f5f9"/>
      <text x="117" y="122" fill="#0369a1" font-size="6.5" font-family="sans-serif" text-anchor="middle">Retries return original</text>
      <text x="117" y="133" fill="#0369a1" font-size="6.5" font-family="sans-serif" text-anchor="middle">result without re-credit</text>

      <!-- Debit Line -->
      <rect x="220" y="52" width="195" height="46" rx="6" fill="#fef2f2" stroke="#f87171"/>
      <text x="317" y="70" fill="#991b1b" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">2A. Debit: System Issuance</text>
      <text x="317" y="84" fill="#b91c1c" font-size="7" font-family="monospace" text-anchor="middle">UPDATE LedgerAccount SET balance = -N</text>

      <!-- Credit Line -->
      <rect x="220" y="108" width="195" height="46" rx="6" fill="#ecfdf5" stroke="#34d399"/>
      <text x="317" y="126" fill="#065f46" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">2B. Credit: User Wallet</text>
      <text x="317" y="140" fill="#047857" font-size="7" font-family="monospace" text-anchor="middle">UPDATE Wallet SET balance = +N</text>

      <!-- Database Trigger Guard -->
      <rect x="435" y="52" width="210" height="102" rx="6" fill="#fff7ed" stroke="#f97316"/>
      <text x="540" y="72" fill="#9a3412" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. Immutable Trigger Guard</text>
      <text x="540" y="88" fill="#c2410c" font-size="7" font-family="sans-serif" text-anchor="middle">PostgreSQL Database Level Trigger</text>
      <rect x="447" y="96" width="186" height="46" rx="4" fill="#ffffff" stroke="#fdba74"/>
      <text x="540" y="112" fill="#b91c1c" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">BLOCK: DELETE</text>
      <text x="540" y="124" fill="#b91c1c" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">BLOCK: UPDATE</text>
      <text x="540" y="136" fill="#64748b" font-size="6.5" font-family="sans-serif" text-anchor="middle">"Ledger records are immutable"</text>
    </svg>
    <div class="figure-title">Figure 5: Double-Entry Immutable Ledger Architecture & Trigger Guard</div>
    <div class="figure-caption">Balanced issuance pairs and PostgreSQL triggers prevent ledger tampering, ensuring complete accounting integrity.</div>
  </div>

  <h2>5.2 PostgreSQL Append-Only Trigger Implementation</h2>
  <p>
    Tinat enforces low-level database protection preventing programmatic deletion or modification of financial ledger rows. An attempt to execute <code>DELETE FROM "TinatCreditTransaction"</code> raises exception code <code>P0001</code>:
  </p>
  <div class="callout callout-warning">
    <div class="callout-title">⚠️ Database Invariance Rule</div>
    Ledger records are append-only. No administrator, API handler, or script can delete historical credit records. Adjustments must be executed via balanced <code>ADMIN_ADJUSTMENT</code> counter-entries.
  </div>

  <!-- ==================== CHAPTER 6 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 6: Tinat Forms: Independent No-Code Survey Engine</h1>

  <p>
    In addition to clinical studies requiring full IRB approvals, Tinat provides <strong>Tinat Forms</strong> (routes <code>/forms</code> and public runner <code>/f/[id]</code>) as an independent, lightweight survey builder tailored for academic student projects, clinic evaluations, and community polls.
  </p>

  <h2>6.1 Architecture of Tinat Forms</h2>
  <p>
    Tinat Forms leverages the underlying <code>Study</code> model under the hood with <code>category = "Tinat Form"</code> and tagging <code>["Tinat Form"]</code>, while completely decoupling from clinical trial compliance rules:
  </p>
  <ul>
    <li><strong>Zero IRB Gate:</strong> Enables instant publication without administrative or dual-ethics sign-off.</li>
    <li><strong>Lean Public Runner:</strong> The <code>/f/[id]</code> route is a stripped-down public interface designed without heavy layout shells, maximizing rendering speed on 2G/3G mobile networks.</li>
    <li><strong>Direct Excel Streaming:</strong> Implemented at <code>/api/forms/[id]/export</code> using <code>exceljs</code>, streaming structured spreadsheets with automatic column width formatting and codebook headers directly to the user's browser.</li>
  </ul>

  <!-- FIGURE 6: TINAT FORMS -->
  <div class="figure-container">
    <svg width="100%" height="180" viewBox="0 0 680 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Designer Box -->
      <rect x="20" y="30" width="190" height="120" rx="8" fill="#f0fdf4" stroke="#059669" stroke-width="1.5"/>
      <text x="115" y="52" fill="#065f46" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">VISUAL FORM BUILDER (/forms/new)</text>
      <rect x="32" y="64" width="166" height="24" rx="4" fill="#ffffff" stroke="#a7f3d0"/>
      <text x="115" y="79" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">9 Question Types Drag-and-Drop</text>
      <rect x="32" y="94" width="166" height="24" rx="4" fill="#ffffff" stroke="#a7f3d0"/>
      <text x="115" y="109" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">MoveUp / MoveDown Reordering</text>
      <rect x="32" y="122" width="166" height="20" rx="4" fill="#dcfce7"/>
      <text x="115" y="135" fill="#15803d" font-size="7" font-family="sans-serif" text-anchor="middle">Direct Publish (Zero IRB Gate)</text>

      <path d="M210 90 L260 90" stroke="#059669" stroke-width="2"/>

      <!-- Public Runner Box -->
      <rect x="260" y="30" width="180" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="350" y="52" fill="#1e40af" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">LIGHTWEIGHT RUNNER (/f/[id])</text>
      <rect x="272" y="64" width="156" height="24" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
      <text x="350" y="79" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Short Shareable URL</text>
      <rect x="272" y="94" width="156" height="24" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
      <text x="350" y="109" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Mobile-Optimized Clean DOM</text>
      <rect x="272" y="122" width="156" height="20" rx="4" fill="#dbeafe"/>
      <text x="350" y="135" fill="#1d4ed8" font-size="7" font-family="sans-serif" text-anchor="middle">No Authentication Required</text>

      <path d="M440 90 L490 90" stroke="#3b82f6" stroke-width="2"/>

      <!-- Analytics & Export Box -->
      <rect x="490" y="30" width="170" height="120" rx="8" fill="#fdf4ff" stroke="#a21caf" stroke-width="1.5"/>
      <text x="575" y="52" fill="#701a75" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">STREAMING EXPORT (/forms/[id])</text>
      <rect x="502" y="64" width="146" height="24" rx="4" fill="#ffffff" stroke="#f5d0fe"/>
      <text x="575" y="79" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">Live Ingestion Counters</text>
      <rect x="502" y="94" width="146" height="24" rx="4" fill="#ffffff" stroke="#f5d0fe"/>
      <text x="575" y="109" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">One-Click .XLSX Excel Export</text>
      <rect x="502" y="122" width="146" height="20" rx="4" fill="#fae8ff"/>
      <text x="575" y="135" fill="#86198f" font-size="7" font-family="sans-serif" text-anchor="middle">Auto-Formatted Columns</text>
    </svg>
    <div class="figure-title">Figure 6: Tinat Forms No-Code Architecture & Real-Time Data Streaming</div>
    <div class="figure-caption">Bypasses clinical trial friction while leveraging the high-throughput Prisma question/response storage engine.</div>
  </div>

  <!-- ==================== CHAPTER 7 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 7: Tinat Ask & Clinical AI Copilot Subsystems</h1>

  <p>
    Tinat integrates public engagement and clinical intelligence subsystems designed to disseminate verified research insights.
  </p>

  <h2>7.1 Tinat Ask (Verified Academic Q&A)</h2>
  <p>
    Accessible via <code>/ask/[username]</code>, Tinat Ask allows accredited medical doctors and researchers to host public question-and-answer exchanges. Questions progress through an audited moderation state machine:
  </p>
  <ul>
    <li><code>AskQuestionStatus.UNANSWERED</code>: Staged in the researcher’s private queue.</li>
    <li><code>AskQuestionStatus.ANSWERED</code>: Answered and published to the public researcher AMA card.</li>
    <li><code>AskQuestionStatus.REPORTED</code>: User-flagged for moderation review.</li>
    <li><code>AskQuestionStatus.BLOCKED</code>: Removed by system administrators for community guidelines non-compliance.</li>
  </ul>

  <!-- FIGURE 7: TINAT ASK -->
  <div class="figure-container">
    <svg width="100%" height="150" viewBox="0 0 680 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="35" width="170" height="90" rx="6" fill="#f8fafc" stroke="#64748b"/>
      <text x="110" y="58" fill="#0f172a" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Community Asks Question</text>
      <text x="110" y="74" fill="#475569" font-size="7" font-family="sans-serif" text-anchor="middle">Public question submitted</text>
      <text x="110" y="86" fill="#475569" font-size="7" font-family="monospace" text-anchor="middle">status = UNANSWERED</text>
      <text x="110" y="98" fill="#475569" font-size="7" font-family="monospace" text-anchor="middle">isPublic = false</text>

      <path d="M195 80 L255 80" stroke="#047857" stroke-width="2"/>

      <rect x="255" y="35" width="170" height="90" rx="6" fill="#ecfdf5" stroke="#059669"/>
      <text x="340" y="58" fill="#065f46" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Researcher Queue</text>
      <text x="340" y="74" fill="#047857" font-size="7" font-family="sans-serif" text-anchor="middle">Dr. Dawit reviews & answers</text>
      <text x="340" y="86" fill="#047857" font-size="7" font-family="monospace" text-anchor="middle">answerText recorded</text>
      <text x="340" y="98" fill="#047857" font-size="7" font-family="monospace" text-anchor="middle">answeredAt = NOW()</text>

      <path d="M425 80 L485 80" stroke="#047857" stroke-width="2"/>

      <rect x="485" y="35" width="170" height="90" rx="6" fill="#f0fdf4" stroke="#16a34a"/>
      <text x="570" y="58" fill="#15803d" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Public AMA Feed</text>
      <text x="570" y="74" fill="#166534" font-size="7" font-family="sans-serif" text-anchor="middle">Rendered on /ask/[username]</text>
      <text x="570" y="86" fill="#166534" font-size="7" font-family="monospace" text-anchor="middle">status = ANSWERED</text>
      <text x="570" y="98" fill="#166534" font-size="7" font-family="monospace" text-anchor="middle">isPublic = true</text>
    </svg>
    <div class="figure-title">Figure 7: Tinat Ask Moderation & Publication Pipeline</div>
  </div>

  <h2>7.2 Tinat AI (Researcher Copilot)</h2>
  <p>
    Located at <code>/researcher/ai</code>, the AI copilot integrates Google's Gemini models with application domain data:
  </p>
  <ul>
    <li><strong>Sampling Bias Audit:</strong> Analyzes survey questionnaires to highlight recall bias and urban clinic oversampling risks.</li>
    <li><strong>Protocol Assistant:</strong> Drafts inclusion/exclusion criteria compliant with Ethiopian clinical standards.</li>
    <li><strong>Conversation Persistence:</strong> Conversations and assistant messages are stored in <code>AIConversation</code> and <code>AIMessage</code> models with audit usage tokens.</li>
  </ul>

  <!-- ==================== CHAPTER 8 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 8: Geographic Reach & 12-Region Spatial Intelligence</h1>

  <p>
    The Geographic Reach system (located at <code>/admin/geographic</code>) provides a synchronized spatial view of Ethiopia’s health data collection density across all 12 regional states and chartered administrations:
  </p>

  <!-- FIGURE 8: GEOGRAPHIC REACH -->
  <div class="figure-container">
    <svg width="100%" height="170" viewBox="0 0 680 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="310" height="130" rx="8" fill="#f8fafc" stroke="#059669" stroke-width="1.5"/>
      <text x="175" y="42" fill="#065f46" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">SYNCHRONIZED ZERO-SCROLL MAP</text>
      <rect x="35" y="55" width="280" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="175" y="71" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Addis Ababa · Central Oromia · Amhara · Sidama</text>
      <rect x="35" y="85" width="280" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="175" y="101" fill="#1e293b" font-size="7.5" font-family="sans-serif" text-anchor="middle">Tigray · Somali · Benishangul · Afar · Gambella</text>
      <rect x="35" y="115" width="280" height="24" rx="4" fill="#ecfdf5" stroke="#a7f3d0"/>
      <text x="175" y="131" fill="#047857" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Fixed 100dvh Split-Viewport Layout</text>

      <path d="M330 85 L370 85" stroke="#059669" stroke-width="2"/>

      <rect x="370" y="20" width="290" height="130" rx="8" fill="#f0fdf4" stroke="#047857" stroke-width="1.5"/>
      <text x="515" y="42" fill="#064e3b" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">REGIONAL DATA TELEMETRY</text>
      <rect x="385" y="55" width="260" height="24" rx="4" fill="#ffffff" stroke="#a7f3d0"/>
      <text x="515" y="71" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">Active Field Collectors Count by Woreda</text>
      <rect x="385" y="85" width="260" height="24" rx="4" fill="#ffffff" stroke="#a7f3d0"/>
      <text x="515" y="101" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">Household Health Censuses Completed</text>
      <rect x="385" y="115" width="260" height="24" rx="4" fill="#ffffff" stroke="#a7f3d0"/>
      <text x="515" y="131" fill="#0f172a" font-size="7.5" font-family="sans-serif" text-anchor="middle">Identifies Underserved Health Demographics</text>
    </svg>
    <div class="figure-title">Figure 8: Geographic Reach Spatial Intelligence Pipeline</div>
  </div>

  <!-- ==================== CHAPTER 9 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 9: Complete Prisma Entity-Relationship Schema</h1>

  <p>
    The core Prisma schema (located at <code>prisma/schema.prisma</code>) defines the complete entity-relationship model backing Tinat. Key models and their relational constraints are detailed below:
  </p>

  <h2>9.1 Primary Model Definitions</h2>
  <pre>
model User {
  id              String         @id @default(cuid())
  email           String         @unique
  name            String
  username        String?        @unique
  passwordHash    String
  role            UserRole       @default(PARTICIPANT) // ADMIN, RESEARCHER, PARTICIPANT, DATA_COLLECTOR
  phone           String?
  institution     String?
  fieldOfStudy    String?
  isVerified      Boolean        @default(false)
  faydaVerified   Boolean        @default(false)
  faydaFanHash    String?        @unique
  faydaVerifiedAt DateTime?
  wallet          Wallet?
  ledgerAccount   LedgerAccount?
  studies         Study[]
  responses       Response[]     @relation("CollectedResponses")
  participantLinks ParticipantLink[]
  askProfile      AskProfile?
}

model Study {
  id                String            @id @default(cuid())
  title             String
  description       String?
  status            StudyStatus       @default(DRAFT) // DRAFT, ACTIVE, PAUSED, COMPLETED
  fundingType       StudyFundingType  @default(FREE)  // FREE, FUNDED
  category          String?
  targetPopulation  String?
  ethicsExempt      Boolean           @default(false)
  researcherId      String
  researcher        User              @relation(fields: [researcherId], references: [id])
  questions         Question[]
  responses         Response[]
  participantLinks  ParticipantLink[]
}

model Question {
  id            String         @id @default(cuid())
  studyId       String
  text          String
  type          QuestionType   // SHORT_TEXT, LONG_TEXT, SINGLE_CHOICE, NUMBER, YES_NO, LINEAR_SCALE...
  required      Boolean        @default(true)
  order         Int
  options       QuestionOption[]
  answers       Answer[]
  study         Study          @relation(fields: [studyId], references: [id], onDelete: Cascade)
}

model Response {
  id               String            @id @default(cuid())
  studyId          String
  respondentCode   String            @unique
  submittedAt      DateTime          @default(now())
  collectionMethod CollectionMethod  @default(SELF) // SELF, FIELD_COLLECTED
  collectorId      String?
  answers          Answer[]
  study            Study             @relation(fields: [studyId], references: [id], onDelete: Cascade)
  @@unique([studyId, respondentCode])
}

model Answer {
  id          String   @id @default(cuid())
  responseId  String
  questionId  String
  textValue   String?
  numberValue Float?
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  response    Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  @@unique([responseId, questionId])
}

model Wallet {
  id             String                    @id @default(cuid())
  userId         String                    @unique
  balance        Int                       @default(0)
  totalEarned    Int                       @default(0)
  totalWithdrawn Int                       @default(0)
  transactions   TinatCreditTransaction[]
  user           User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
  </pre>

  <!-- ==================== CHAPTER 10 ==================== -->
  <div class="page-break"></div>
  <h1>Chapter 10: Developer Runbook & API Security Matrix</h1>

  <h2>10.1 Environment Variables Configuration (.env)</h2>
  <table>
    <thead>
      <tr>
        <th>Variable Key</th>
        <th>Required Format / Example</th>
        <th>Description & Security Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>DATABASE_URL</code></td>
        <td><code>postgresql://user:pass@host:54345/tinat_db?sslmode=disable</code></td>
        <td>Primary PostgreSQL connection string. Read by PrismaPg pool adapter.</td>
      </tr>
      <tr>
        <td><code>AUTH_SECRET</code></td>
        <td><code>32+ byte cryptographically secure random string</code></td>
        <td>Secret key for signing and verifying HMAC-SHA256 JWT session tokens.</td>
      </tr>
      <tr>
        <td><code>NEXT_PUBLIC_APP_URL</code></td>
        <td><code>http://localhost:3000</code> or <code>https://tinat.et</code></td>
        <td>Public hostname used for absolute link generation and redirect callbacks.</td>
      </tr>
      <tr>
        <td><code>GEMINI_API_KEY</code></td>
        <td><code>AIzaSy...</code></td>
        <td>Google Gemini API key powering Tinat AI researcher assistant.</td>
      </tr>
    </tbody>
  </table>

  <h2>10.2 Developer Seed Accounts (Ready for Verification)</h2>
  <p>
    Developers can instantly populate and test the platform using the committed seed script:
  </p>
  <pre>npx tsx scripts/seed_developer_test_users.ts</pre>

  <table>
    <thead>
      <tr>
        <th>Role</th>
        <th>Email</th>
        <th>Username</th>
        <th>Shared Password</th>
        <th>Pre-Populated Datasets</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ADMIN</strong></td>
        <td><code>admin@tinat.et</code></td>
        <td><code>tinat_admin</code></td>
        <td><code>TinatDev2026!</code></td>
        <td>Full governance, user search, regional reach, pending withdrawals review.</td>
      </tr>
      <tr>
        <td><strong>RESEARCHER</strong></td>
        <td><code>researcher@tinat.et</code></td>
        <td><code>dr_dawit</code></td>
        <td><code>TinatDev2026!</code></td>
        <td>SPHMMC affiliation, 5,000 TC grant, active maternal nutrition study, 5 responses, Tinat Ask profile.</td>
      </tr>
      <tr>
        <td><strong>PARTICIPANT</strong></td>
        <td><code>participant@tinat.et</code></td>
        <td><code>bethlehem_aau</code></td>
        <td><code>TinatDev2026!</code></td>
        <td>AAU affiliation, 250 TC wallet balance, Telebirr withdrawal record, digital pass, survey submission.</td>
      </tr>
    </tbody>
  </table>

  <h2>10.3 API Route Authorization Matrix (Deny-by-Default)</h2>
  <div class="callout">
    <div class="callout-title">🔒 Strict Enforcement Rules</div>
    Every API endpoint checks authorization explicitly on the server. If no session is detected, routes reject immediately with <code>401 Unauthorized</code>. If a participant attempts to access administrative or researcher endpoints, the system responds with <code>403 Forbidden</code>.
  </div>

  <p style="margin-top: 30px; text-align: center; font-size: 8pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    <strong>Tinat Health Network</strong> · Engineering Reference Manual · Document End
  </p>

</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, html, 'utf8');
console.log('✅ HTML Manual written to:', outputHtmlPath);

// Execute Chrome Headless to compile into PDF
try {
  console.log('Rendering PDF via Headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cmd = '"' + chromePath + '" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="' + outputPdfPath + '" "' + outputHtmlPath + '"';
  execSync(cmd, { stdio: 'inherit' });
  
  if (fs.existsSync(outputPdfPath)) {
    const stats = fs.statSync(outputPdfPath);
    console.log('✅ PDF successfully generated: ' + outputPdfPath + ' (' + Math.round(stats.size / 1024) + ' KB)');
    
    // Copy to brain artifact directory
    fs.copyFileSync(outputPdfPath, brainPdfPath);
    console.log('✅ PDF copied to artifact directory: ' + brainPdfPath);
  } else {
    console.error('❌ PDF file was not created.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error generating PDF:', err);
  process.exit(1);
}
