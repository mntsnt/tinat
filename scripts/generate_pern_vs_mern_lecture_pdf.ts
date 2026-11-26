import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputHtmlPath = path.resolve(__dirname, '../pern-vs-mern-lecture.html');
const outputPdfPath = path.resolve(__dirname, '../PERN_vs_MERN_Master_Lecture_Guide.pdf');
const brainPdfPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\7198fb25-ed5c-47fc-ad52-576777442792\\PERN_vs_MERN_Master_Lecture_Guide.pdf';
const brainHtmlPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\7198fb25-ed5c-47fc-ad52-576777442792\\PERN_vs_MERN_Master_Lecture_Guide.html';

console.log('Generating Publication-Grade PERN vs MERN Master Lecture Guide...');

const generateHtml = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>From MERN to PERN: The Full-Stack Engineer's Master Lecture Guide</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 13mm 14mm 13mm;
      @top-right {
        content: "From MERN to PERN: Master Lecture Guide — Tinat Architecture";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 7.5pt;
        color: #94a3b8;
      }
      @bottom-center {
        content: "Lecture Page " counter(page) " of " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 7.5pt;
        color: #94a3b8;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.48;
      font-size: 8.5pt;
      margin: 0;
      padding: 0;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-container {
      height: 98vh;
      border-radius: 16px;
      background: linear-gradient(165deg, #0b192c 0%, #061e24 45%, #021114 100%);
      color: #ffffff;
      padding: 44px 38px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(14, 165, 233, 0.35);
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
    }

    .cover-badge {
      display: inline-block;
      background: rgba(14, 165, 233, 0.15);
      border: 1px solid rgba(14, 165, 233, 0.5);
      color: #38bdf8;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 5px 16px;
      border-radius: 9999px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 36pt;
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1.05;
      margin: 0 0 16px 0;
    }

    .cover-title span.blue {
      color: #38bdf8;
    }

    .cover-title span.emerald {
      color: #10b981;
    }

    .cover-description {
      font-size: 11pt;
      color: #cbd5e1;
      max-width: 620px;
      line-height: 1.55;
      margin-bottom: 26px;
    }

    .cover-stack-compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 24px;
    }

    .stack-box {
      background: rgba(30, 41, 59, 0.5);
      border-radius: 8px;
      padding: 12px 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stack-box h4 {
      margin: 0 0 6px 0;
      font-size: 9.5pt;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .stack-box p {
      margin: 0;
      font-size: 7pt;
      color: #94a3b8;
      line-height: 1.4;
    }

    .cover-footer-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      border-top: 1px solid rgba(51, 65, 85, 0.7);
      padding-top: 18px;
    }

    .meta-col span {
      display: block;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #38bdf8;
      margin-bottom: 4px;
    }

    .meta-col strong {
      font-size: 9.5pt;
      color: #f8fafc;
    }

    /* Headings */
    h1 {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 2.5px solid #0284c7;
      letter-spacing: -0.01em;
    }

    h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #0369a1;
      margin: 14px 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 10px 0 4px 0;
    }

    h4 {
      font-size: 8.5pt;
      font-weight: 700;
      margin: 6px 0 3px 0;
    }

    /* Callouts */
    .info-box {
      background: #f0f9ff;
      border-left: 3.5px solid #0284c7;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 12px;
      font-size: 8pt;
    }

    .info-box h4 {
      margin: 0 0 3px 0;
      font-size: 8.5pt;
      font-weight: 700;
      color: #0369a1;
    }

    .info-box p {
      margin: 0;
      color: #0c4a6e;
      line-height: 1.45;
    }

    .case-study-box {
      background: #ecfdf5;
      border-left: 3.5px solid #059669;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 12px;
      font-size: 8pt;
    }

    .case-study-box h4 {
      margin: 0 0 3px 0;
      font-size: 8.5pt;
      font-weight: 700;
      color: #065f46;
    }

    .case-study-box p {
      margin: 0;
      color: #064e3b;
      line-height: 1.45;
    }

    .warning-box {
      background: #fffbeb;
      border-left: 3.5px solid #d97706;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 12px;
      font-size: 8pt;
    }

    .warning-box h4 {
      margin: 0 0 3px 0;
      font-size: 8.5pt;
      font-weight: 700;
      color: #92400e;
    }

    .warning-box p {
      margin: 0;
      color: #78350f;
      line-height: 1.45;
    }

    /* Side-by-side Code comparison */
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 8px 0 12px 0;
      page-break-inside: avoid;
    }

    .code-card {
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      overflow: hidden;
      background: #ffffff;
    }

    .code-card-header {
      padding: 5px 10px;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-mern {
      background: #f1f5f9;
      color: #0f766e;
      border-bottom: 1px solid #cbd5e1;
    }

    .header-pern {
      background: #eff6ff;
      color: #1d4ed8;
      border-bottom: 1px solid #bfdbfe;
    }

    pre {
      background: #09131a;
      color: #e2e8f0;
      padding: 8px 10px;
      border-radius: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 6.8pt;
      line-height: 1.38;
      margin: 0;
      overflow-x: auto;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7pt;
      background: #f1f5f9;
      color: #0369a1;
      padding: 1px 3px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 7.2pt;
      page-break-inside: avoid;
    }

    th {
      background: #0284c7;
      color: #ffffff;
      text-align: left;
      padding: 5px 6px;
      font-weight: 700;
      border: 1px solid #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
      line-height: 1.35;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Diagram Containers */
    .diagram-container {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .diagram-title {
      font-size: 8pt;
      font-weight: 800;
      color: #0369a1;
      margin-bottom: 8px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER ==================== -->
  <div class="cover-container">
    <div>
      <div class="cover-badge">Specialized Engineering Lecture Series • Advanced Full-Stack Guide</div>
      <div class="cover-title">FROM <span class="blue">MERN</span> TO <span class="emerald">PERN</span></div>
      <div class="cover-description">
        The Certified Developer's Transition Manual: Paradigm Shifts from Document Stores (MongoDB/Mongoose) to Relational Engines (PostgreSQL/Prisma), ACID Multi-Table Transactions, Schema Normalization, Joins vs. Embedding, and Why Enterprise Systems Like Tinat Choose PERN.
      </div>

      <div class="cover-stack-compare">
        <div class="stack-box" style="border-left: 3px solid #10b981;">
          <h4 style="color: #34d399;">MERN (MongoDB, Express, React, Node.js)</h4>
          <p>
            <strong>Storage Paradigm:</strong> Document Store (BSON JSON Collections)<br>
            <strong>Schema Strategy:</strong> Schemaless database; Schema in Application (Mongoose)<br>
            <strong>Transactions:</strong> Single-document atomicity; Eventual Consistency<br>
            <strong>Relationships:</strong> Embedding subdocuments or Manual <code>.populate()</code><br>
            <strong>Ideal For:</strong> Unstructured blogs, dynamic catalogs, early MVPs
          </p>
        </div>
        <div class="stack-box" style="border-left: 3px solid #38bdf8;">
          <h4 style="color: #38bdf8;">PERN (PostgreSQL, Express/Next, React, Node.js)</h4>
          <p>
            <strong>Storage Paradigm:</strong> Relational Database Management System (RDBMS)<br>
            <strong>Schema Strategy:</strong> Strict DDL Normalization (1NF–3NF); Prisma Schema<br>
            <strong>Transactions:</strong> Strict ACID Atomicity across multi-table operations<br>
            <strong>Relationships:</strong> Foreign Key Cascades & Engine-Level SQL <code>JOIN</code>s<br>
            <strong>Ideal For:</strong> Financial ledgers, medical trials, enterprise ERPs (Tinat)
          </p>
        </div>
      </div>
    </div>

    <div class="cover-footer-meta">
      <div class="meta-col">
        <span>Target Developer</span>
        <strong>Certified MERN Engineers</strong>
      </div>
      <div class="meta-col">
        <span>Architectural Case Study</span>
        <strong>Tinat Research Ecosystem</strong>
      </div>
      <div class="meta-col">
        <span>Core Focus</span>
        <strong>Prisma ORM, PostgreSQL & ACID</strong>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2: TABLE OF CONTENTS & SYLLABUS ==================== -->
  <div class="page-break"></div>
  <h1>Course Syllabus: From MERN to PERN</h1>
  
  <div class="info-box">
    <h4>Welcome, Certified MERN Developer</h4>
    <p>
      If you already know MERN, you have mastered 75% of the full-stack landscape: your React components, Node.js event loop understanding, async/await patterns, Express route handling, and REST API semantics translate directly to PERN. What changes fundamentally is the <strong>mental model of data</strong>: moving from hierarchical, denormalized BSON trees to strongly-typed, normalized 2D relational tables with foreign keys and ACID transactional guarantees.
    </p>
  </div>

  <div style="margin: 14px 0; font-size: 8.5pt;">
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 1: The Anatomy of MERN vs. PERN — What Changes & What Stays the Same</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 3</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 2: The Core Paradigm Shift: Documents (BSON) vs. Relational Tables (RDBMS)</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 5</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 3: Object Modeling & Schema Definition: Mongoose ODM vs. Prisma ORM</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 7</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 4: Querying & Relationships: <code>.populate()</code> & Aggregations vs. SQL <code>JOIN</code> & <code>include</code></strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 9</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 5: Transactions & Consistency: ACID vs. BASE (Tinat Financial Ledger Case Study)</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 11</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 6: Referential Integrity, Constraints & Fraud Protection (Fayda KYC Case Study)</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 13</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 7: The Hybrid Superpower: PostgreSQL JSONB as an Embedded Document Store</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 15</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Lecture 8: The MERN-to-PERN Developer Migration Playbook, Cheat Sheet & Pitfalls</strong>
      <span style="font-family:monospace; color:#0284c7; font-weight:bold;">p. 17</span>
    </div>
  </div>

  <h2>Index of Architectural Lecture Diagrams</h2>
  <div style="margin: 8px 0 16px 0; font-size: 7.8pt; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#0284c7;">Figure L1.1:</strong> Multi-Tier Stack Architecture: MERN vs. PERN (p. 4)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#0284c7;">Figure L2.1:</strong> Hierarchical BSON Nesting vs. Relational Normalization (p. 6)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#0284c7;">Figure L4.1:</strong> Query Execution Path: <code>.populate()</code> vs. SQL <code>JOIN</code> (p. 10)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#0284c7;">Figure L5.1:</strong> Multi-Table ACID Transaction vs. MongoDB Eventual Race (p. 12)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#0284c7;">Figure L7.1:</strong> Hybrid Architecture: PostgreSQL Tables + Native JSONB Columns (p. 16)
    </div>
  </div>

  <!-- ==================== PAGE 3: LECTURE 1 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 1: The Anatomy of MERN vs. PERN</h1>

  <h2>1.1 Deconstructing the Acronyms</h2>
  <p>
    In web development, technology stacks are designated by their four core architectural layers: the Database, the Backend Routing Gateway, the Frontend Presentation Engine, and the JavaScript Execution Runtime.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Layer</th>
        <th style="width: 42%;">MERN Stack (MongoDB)</th>
        <th style="width: 43%;">PERN Stack (PostgreSQL — Tinat)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Database (M vs. P)</strong></td>
        <td><strong>MongoDB</strong>: A NoSQL document store saving data as binary JSON (BSON) objects grouped into collections. Schemaless at the database engine level.</td>
        <td><strong>PostgreSQL 16</strong>: An advanced Object-Relational Database Management System (RDBMS) saving data into strongly-typed 2D tables with columns, rows, foreign keys, and ACID transaction logs.</td>
      </tr>
      <tr>
        <td><strong>Backend API (E)</strong></td>
        <td><strong>Express.js</strong>: Fast, unopinionated, minimalist web framework for Node.js handling routing, middleware chains, and HTTP request/response lifecycles.</td>
        <td><strong>Express / Next.js Server Handlers</strong>: Next.js 16 App Router route handlers (<code>route.ts</code>) built on standard Web <code>Request</code>/<code>Response</code> APIs, functioning identically to Express with automatic edge optimization.</td>
      </tr>
      <tr>
        <td><strong>Frontend (R)</strong></td>
        <td><strong>React</strong>: Component-based user interface library rendering virtual DOM trees with client-side state management (Hooks, Redux, Context).</td>
        <td><strong>React 19 / Next.js 16</strong>: Modern React leveraging React Server Components (RSC) rendered on the server with zero client bundle overhead, combined with dynamic Client Components.</td>
      </tr>
      <tr>
        <td><strong>Runtime (N)</strong></td>
        <td><strong>Node.js</strong>: Google Chrome V8 engine executing JavaScript asynchronously via the single-threaded event loop and libuv thread pool.</td>
        <td><strong>Node.js 26</strong>: The identical high-performance JavaScript runtime, powering server actions, Prisma query engine binary communication, and cryptography.</td>
      </tr>
    </tbody>
  </table>

  <h2>1.2 What Stays Exactly the Same for You?</h2>
  <p>
    As a certified MERN engineer, you do not need to discard your expertise. The following foundational full-stack concepts remain 100% identical:
  </p>
  <ul>
    <li><strong>Client-Side State & UI:</strong> Your React state machines (<code>useState</code>, <code>useEffect</code>, <code>useMemo</code>), custom hooks, component composition, and Tailwind CSS layouts function identically. A button click in Tinat still triggers a <code>fetch()</code> or TanStack Query hook.</li>
    <li><strong>RESTful API Conventions:</strong> Standard HTTP verbs (<code>GET</code>, <code>POST</code>, <code>PATCH</code>, <code>DELETE</code>), status codes (<code>200 OK</code>, <code>201 Created</code>, <code>401 Unauthorized</code>, <code>404 Not Found</code>, <code>500 Internal Error</code>), and JSON payload formatting remain identical.</li>
    <li><strong>Authentication Mechanics:</strong> JSON Web Tokens (JWT), HTTP-only cookies, password hashing with <code>bcrypt</code>, and route middleware checks operate using the exact same Node.js libraries.</li>
    <li><strong>Asynchronous JavaScript:</strong> Promises, <code>async/await</code>, error handling with <code>try/catch</code>, and the non-blocking Node.js event loop remain the backbone of server-side logic.</li>
  </ul>

  <!-- ==================== PAGE 4: LECTURE 1 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>1.3 What Fundamentally Changes: The Mental Model Shift</h2>
  <p>
    While the code you write in React and Node.js looks familiar, the <strong>mental model of persistence</strong> undergoes a complete inversion. In MERN, developers think in terms of <em>hierarchical trees</em> (documents inside collections). In PERN, developers think in terms of <em>interconnected mathematical sets</em> (normalized relational tables joined by keys).
  </p>

  <!-- FIGURE L1.1: STACK TOPOLOGY -->
  <div class="diagram-container">
    <div class="diagram-title">Figure L1.1 — Multi-Tier Stack Architecture Comparison: MERN vs. PERN</div>
    <svg width="100%" height="150" viewBox="0 0 660 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- MERN TOPOLOGY -->
      <rect x="10" y="8" width="310" height="134" rx="8" fill="#f8fafc" stroke="#10b981" stroke-width="1.5"/>
      <rect x="20" y="16" width="290" height="18" rx="4" fill="#10b981"/>
      <text x="165" y="29" fill="#ffffff" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">THE MERN ARCHITECTURE (MONGODB)</text>

      <rect x="25" y="42" width="80" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="65" y="58" fill="#0f172a" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">React SPA</text>
      <text x="65" y="72" fill="#64748b" font-size="5.5" font-family="sans-serif" text-anchor="middle">Vite / CRA Bundle</text>

      <path d="M105 63 L125 63" stroke="#10b981" stroke-width="1.5"/>

      <rect x="125" y="42" width="80" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="165" y="58" fill="#0f172a" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Express API</text>
      <text x="165" y="72" fill="#64748b" font-size="5.5" font-family="sans-serif" text-anchor="middle">app.use(cors())</text>

      <path d="M205 63 L225 63" stroke="#10b981" stroke-width="1.5"/>

      <rect x="225" y="42" width="85" height="42" rx="4" fill="#ffffff" stroke="#10b981"/>
      <text x="267" y="58" fill="#065f46" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">MongoDB</text>
      <text x="267" y="72" fill="#047857" font-size="5.5" font-family="sans-serif" text-anchor="middle">BSON Collections</text>

      <rect x="25" y="94" width="280" height="38" rx="4" fill="#f0fdf4" stroke="#86efac"/>
      <text x="165" y="108" fill="#15803d" font-size="6.2" font-family="sans-serif" font-weight="bold" text-anchor="middle">Key Characteristics of MERN:</text>
      <text x="165" y="122" fill="#166534" font-size="5.8" font-family="sans-serif" text-anchor="middle">• Schemaless engine • Mongoose ODM • Embedded subdocs • Eventual consistency</text>

      <!-- PERN TOPOLOGY -->
      <rect x="340" y="8" width="310" height="134" rx="8" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="350" y="16" width="290" height="18" rx="4" fill="#0284c7"/>
      <text x="495" y="29" fill="#ffffff" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">THE PERN ARCHITECTURE (POSTGRESQL — TINAT)</text>

      <rect x="355" y="42" width="80" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="395" y="58" fill="#0f172a" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">React 19 / RSC</text>
      <text x="395" y="72" fill="#64748b" font-size="5.5" font-family="sans-serif" text-anchor="middle">Next.js 16 App</text>

      <path d="M435 63 L455 63" stroke="#0284c7" stroke-width="1.5"/>

      <rect x="455" y="42" width="80" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="495" y="58" fill="#0f172a" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Next API Routes</text>
      <text x="495" y="72" fill="#64748b" font-size="5.5" font-family="sans-serif" text-anchor="middle">85 REST Handlers</text>

      <path d="M535 63 L555 63" stroke="#0284c7" stroke-width="1.5"/>

      <rect x="555" y="42" width="85" height="42" rx="4" fill="#ffffff" stroke="#0284c7"/>
      <text x="597" y="58" fill="#0369a1" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">PostgreSQL 16</text>
      <text x="597" y="72" fill="#0284c7" font-size="5.5" font-family="sans-serif" text-anchor="middle">45 Relational Models</text>

      <rect x="355" y="94" width="285" height="38" rx="4" fill="#f0f9ff" stroke="#7dd3fc"/>
      <text x="497" y="108" fill="#0369a1" font-size="6.2" font-family="sans-serif" font-weight="bold" text-anchor="middle">Key Characteristics of PERN (Tinat):</text>
      <text x="497" y="122" fill="#0c4a6e" font-size="5.8" font-family="sans-serif" text-anchor="middle">• Strict schema DDL • Prisma ORM v7 • Foreign Key Cascades • ACID transactions</text>
    </svg>
  </div>

  <div class="case-study-box">
    <h4>Why Tinat Chose PERN over MERN</h4>
    <p>
      In a simple social blog or e-commerce catalog, MongoDB's flexible schema is convenient. However, <strong>Tinat is a clinical research and financial disbursement platform</strong>. Conducting national health surveys in Ethiopia requires double-entry ledger accounting (moving ETB via Chapa to Telebirr/CBE wallets), preventing duplicate respondents with Fayda National ID hashing, and maintaining strict question-response integrity. If a wallet update succeeds but the transaction record fails, real money is lost. PostgreSQL guarantees that either <em>both</em> operations succeed or <em>neither</em> does (ACID Atomicity).
    </p>
  </div>

  <!-- ==================== PAGE 5: LECTURE 2 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 2: The Core Paradigm Shift — Documents vs. Relational Tables</h1>

  <h2>2.1 How Data is Stored: BSON Trees vs. 2D Tables</h2>
  <p>
    The most striking difference between MongoDB and PostgreSQL is how individual records are structured on the storage disk.
  </p>

  <div class="compare-grid">
    <div class="code-card">
      <div class="code-card-header header-mern">
        <span>MongoDB: Hierarchical Document</span>
        <span>BSON / JSON</span>
      </div>
      <pre>
// In MongoDB: Everything embedded in one document
{
  "_id": ObjectId("64f8a12b..."),
  "title": "Malaria Prevalence in Hawassa",
  "status": "ACTIVE",
  "researcher": {
    "name": "Dr. Abebe Kebede",
    "email": "dr.abebe@aau.edu.et"
  },
  "questions": [
    {
      "questionText": "Have you had a fever this week?",
      "type": "SINGLE_SELECT",
      "options": ["Yes", "No"]
    }
  ],
  "responses": [
    {
      "participantId": ObjectId("64f8a99c..."),
      "answers": ["Yes"],
      "submittedAt": ISODate("2026-11-20T10:00:00Z")
    }
  ]
}
      </pre>
    </div>

    <div class="code-card">
      <div class="code-card-header header-pern">
        <span>PostgreSQL (Tinat): Normalized Relational Tables</span>
        <span>SQL Relations</span>
      </div>
      <pre>
-- In PostgreSQL: Data separated into strict tables
-- Table: User (Primary Key: id)
| id (UUID) | name         | email              |
| usr_01    | Dr. Abebe    | dr.abebe@aau.edu   |

-- Table: Study (Foreign Key: researcherId -> User.id)
| id (UUID) | title              | status | researcherId |
| std_99    | Malaria Prevalence | ACTIVE | usr_01       |

-- Table: SurveyQuestion (Foreign Key: studyId -> Study.id)
| id (UUID) | studyId | questionText             | type          |
| qst_42    | std_99  | Have you had a fever?... | SINGLE_SELECT |

-- Table: SurveyResponse (FKs -> Study.id, User.id)
| id (UUID) | studyId | participantId | status    | submittedAt |
| rsp_88    | std_99  | usr_55        | SUBMITTED | 2026-11-20  |
      </pre>
    </div>
  </div>

  <h2>2.2 Normalization vs. Denormalization</h2>
  <p>
    In MERN, developers are taught to <strong>denormalize</strong>: duplicate data across documents or embed arrays inside documents so that a single <code>findOne()</code> query can fetch everything in one disk read.
  </p>
  <p>
    In PERN, developers <strong>normalize</strong> data into <em>Third Normal Form (3NF)</em>: every fact is recorded in exactly one place. If Dr. Abebe changes his email address, in PostgreSQL you update <strong>one single row</strong> in the <code>User</code> table. In a denormalized MongoDB database, you would have to search and update thousands of embedded study documents where Dr. Abebe's email was duplicated!
  </p>

  <!-- ==================== PAGE 6: LECTURE 2 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>2.3 The Hidden Traps of MongoDB in Large-Scale Systems</h2>
  <p>
    MERN tutorials often show survey apps embedding responses inside a study document: <code>questions: [...]</code> and <code>responses: [...]</code>. In real enterprise applications, this leads to three catastrophic failure modes:
  </p>

  <div class="warning-box">
    <h4>Trap 1: The 16 Megabyte Hard Document Limit in MongoDB</h4>
    <p>
      MongoDB strictly forbids any single BSON document from exceeding <strong>16 MB</strong>. If a clinical trial in Tinat collects 20,000 participant responses containing question answers, timestamps, and demographic payloads, embedding responses inside the Study document causes the document to hit 16 MB. MongoDB will abruptly crash with <code>BSONObjectTooLarge</code>, irreversibly locking the study!
    </p>
  </div>

  <div class="warning-box">
    <h4>Trap 2: The Document Relocation & Memory Fragmentation Penalty</h4>
    <p>
      In MongoDB, when you push new items into an embedded array (<code>$push: { responses: newResponse }</code>), the document grows in size. When it exceeds its pre-allocated disk space, MongoDB's WiredTiger storage engine must pause, allocate a new chunk of disk space, copy the entire document over, and update all B-tree index pointers. Under heavy concurrent writes (500 participants answering surveys at once), this causes severe latency spikes and write locks.
    </p>
  </div>

  <div class="warning-box">
    <h4>Trap 3: Silent Schema Drift Across Software Releases</h4>
    <p>
      Because MongoDB is schemaless, nothing prevents a junior developer or buggy script from inserting a response with <code>answrs: "Yes"</code> (typo) instead of <code>answers: ["Yes"]</code>. MongoDB will happily write the corrupted document. Over months of software updates, collections accumulate "schema drift", causing runtime crashes when the frontend tries to render undefined fields.
    </p>
  </div>

  <!-- FIGURE L2.1: PARADIGM COMPARISON -->
  <div class="diagram-container">
    <div class="diagram-title">Figure L2.1 — Hierarchical BSON Nesting vs. Relational Table Normalization</div>
    <svg width="100%" height="110" viewBox="0 0 660 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- MongoDB Tree -->
      <rect x="20" y="10" width="290" height="90" rx="6" fill="#f8fafc" stroke="#10b981" stroke-width="1.2"/>
      <text x="165" y="26" fill="#065f46" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">MongoDB: Monolithic BSON Document</text>
      <rect x="35" y="34" width="260" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="165" y="46" fill="#0f172a" font-size="6.5" font-family="sans-serif" text-anchor="middle">Study Metadata (Title, Protocol, IRB Status)</text>
      <rect x="45" y="56" width="115" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="102" y="68" fill="#64748b" font-size="6" font-family="sans-serif" text-anchor="middle">Embedded Questions []</text>
      <rect x="170" y="56" width="115" height="18" rx="3" fill="#ffffff" stroke="#ef4444"/>
      <text x="227" y="68" fill="#991b1b" font-size="6" font-family="sans-serif" text-anchor="middle">Embedded Responses [] (16MB Cap)</text>
      <text x="165" y="92" fill="#991b1b" font-size="6" font-family="sans-serif" text-anchor="middle">⚠️ Danger: Document expands until memory fragmentation / crash</text>

      <!-- PostgreSQL Normalized Tables -->
      <rect x="340" y="10" width="300" height="90" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>
      <text x="490" y="26" fill="#0369a1" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">PostgreSQL: 1NF–3NF Relational Tables</text>
      <rect x="355" y="34" width="85" height="24" rx="3" fill="#ffffff" stroke="#0284c7"/>
      <text x="397" y="49" fill="#0369a1" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Study Table</text>
      <path d="M440 46 L465 46" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="465" y="34" width="85" height="24" rx="3" fill="#ffffff" stroke="#0284c7"/>
      <text x="507" y="49" fill="#0369a1" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Questions Table</text>
      <path d="M550 46 L575 46" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="575" y="34" width="55" height="24" rx="3" fill="#ffffff" stroke="#0284c7"/>
      <text x="602" y="49" fill="#0369a1" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">Responses</text>
      <text x="490" y="80" fill="#0c4a6e" font-size="6" font-family="sans-serif" text-anchor="middle">Foreign Key cascades: <code>studyId &rarr; Study.id</code></text>
      <text x="490" y="92" fill="#059669" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">✅ Scalability: Unlimited rows, constant memory footprint</text>
    </svg>
  </div>

  <!-- ==================== PAGE 7: LECTURE 3 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 3: Object Modeling & Schema Definition — Mongoose vs. Prisma</h1>

  <h2>3.1 The ODM (Mongoose) vs. The ORM (Prisma)</h2>
  <p>
    In MERN, you use <strong>Mongoose</strong> (an Object Data Modeling library). In modern PERN (and in Tinat), you use <strong>Prisma ORM</strong> (an Object-Relational Mapping library). While both allow you to define schemas and query data using JavaScript/TypeScript, their architecture is diametrically opposed.
  </p>

  <div class="compare-grid">
    <div class="code-card">
      <div class="code-card-header header-mern">
        <span>Mongoose Schema (MERN)</span>
        <span>user.model.js</span>
      </div>
      <pre>
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['RESEARCHER', 'PARTICIPANT', 'ADMIN'],
    default: 'PARTICIPANT'
  },
  walletBalance: {
    type: Number,
    default: 0.0,
    min: 0.0
  },
  faydaFanHash: {
    type: String,
    unique: true,
    sparse: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
      </pre>
    </div>

    <div class="code-card">
      <div class="code-card-header header-pern">
        <span>Prisma Schema (PERN — Tinat)</span>
        <span>prisma/schema.prisma</span>
      </div>
      <pre>
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  role          UserRole  @default(PARTICIPANT)
  faydaFanHash  String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 1-to-1 Relation with Wallet
  wallet        Wallet?

  // 1-to-Many Relations
  studies       Study[]
  responses     SurveyResponse[]
  activityLogs  ActivityLog[]

  @@index([email])
  @@index([faydaFanHash])
}

enum UserRole {
  RESEARCHER
  PARTICIPANT
  ADMIN
  DATA_COLLECTOR
}
      </pre>
    </div>
  </div>

  <h2>3.2 Where Does the Schema Actually Live?</h2>
  <p>
    Notice the critical difference between the two approaches:
  </p>
  <ul>
    <li>
      <strong>In Mongoose:</strong> The schema lives <em>only in your Node.js application code</em>. MongoDB itself has no idea what fields a User has. If someone connects to MongoDB using MongoDB Compass or a raw bash script, they can insert arbitrary documents that violate your Mongoose schema!
    </li>
    <li>
      <strong>In Prisma / PostgreSQL:</strong> The <code>schema.prisma</code> file is compiled into strict <strong>SQL Data Definition Language (DDL)</strong> commands executed directly on the PostgreSQL engine. PostgreSQL itself enforces data types, nullability, enums, unique indexes, and foreign keys. Even if a rogue script bypasses your Node.js server, PostgreSQL will physically reject invalid data at the storage layer!
    </li>
  </ul>

  <!-- ==================== PAGE 8: LECTURE 3 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>3.3 Database Migrations: The End of "Schemaless Chaos"</h2>
  <p>
    In MERN, when you add a new field to your model (for example, adding <code>isFaydaVerified: Boolean</code> to User), existing documents in MongoDB <strong>do not have this field</strong>. When your frontend reads old documents, <code>user.isFaydaVerified</code> evaluates to <code>undefined</code>. Developers are forced to write brittle migration scripts or default fallback checks: <code>user.isFaydaVerified ?? false</code>.
  </p>
  <p>
    In PERN, database schema evolution is handled through <strong>declarative SQL migrations</strong>:
  </p>
  <pre>
# Step 1: Add the field to prisma/schema.prisma
model User {
  ...
  isFaydaVerified Boolean @default(false)
}

# Step 2: Run Prisma Migrate
npx prisma migrate dev --name add_fayda_verification_flag

# What Prisma does under the hood:
# Generates an immutable SQL migration file:
-- AlterTable
ALTER TABLE "User" ADD COLUMN "isFaydaVerified" BOOLEAN NOT NULL DEFAULT false;
  </pre>
  <p>
    PostgreSQL instantly executes the <code>ALTER TABLE</code> statement across all existing rows. Every user record in your database now has <code>isFaydaVerified = false</code>. You never deal with missing fields or undefined values again!
  </p>

  <h2>3.4 Full End-to-End TypeScript Type Safety</h2>
  <p>
    In MERN, keeping your TypeScript types in sync with Mongoose schemas is notorious for causing duplicate work. You define a TypeScript interface <code>interface IUser</code>, and then you define a Mongoose schema <code>new Schema({ ... })</code>. If you change one and forget the other, TypeScript will not warn you.
  </p>
  <p>
    In PERN with Prisma, <strong>Prisma automatically generates 100% accurate TypeScript types directly from your database schema</strong>. When you query a user with their wallet in Tinat:
  </p>
  <pre>
// The return type is automatically inferred with full autocomplete:
const user = await prisma.user.findUnique({
  where: { email: "dr.abebe@aau.edu.et" },
  include: { wallet: true, studies: true }
});

// TypeScript instantly knows that:
// user.wallet.balance is number
// user.studies is an array of Study objects
// user.faydaFanHash is string | null
// Typos like user.walet or user.studiez are caught at COMPILE TIME!
  </pre>

  <!-- ==================== PAGE 9: LECTURE 4 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 4: Querying, Joins & Relationships — Mongoose vs. Prisma</h1>

  <h2>4.1 How Relationships Are Fetched</h2>
  <p>
    In MERN, when you store references between documents, you store the <code>ObjectId</code> of another document. To retrieve related data, Mongoose provides the <code>.populate()</code> helper. In PERN, relationships are joined directly by the PostgreSQL relational engine using SQL <code>JOIN</code>s.
  </p>

  <div class="compare-grid">
    <div class="code-card">
      <div class="code-card-header header-mern">
        <span>Mongoose Query with .populate()</span>
        <span>study.controller.js</span>
      </div>
      <pre>
// Fetch study with researcher & questions
const study = await Study.findById(studyId)
  .populate('researcher', 'name email institution')
  .populate({
    path: 'questions',
    select: 'questionText type options'
  })
  .exec();

// HOW MONGOOSE EXECUTES THIS:
// 1. SELECT * FROM studies WHERE _id = studyId (Query 1)
// 2. Extracts researcher ObjectId
// 3. SELECT * FROM users WHERE _id IN (...) (Query 2)
// 4. Extracts question ObjectIds array
// 5. SELECT * FROM questions WHERE _id IN (...) (Query 3)
// 6. Mongoose stitches objects in Node.js memory!
      </pre>
    </div>

    <div class="code-card">
      <div class="code-card-header header-pern">
        <span>Prisma Query with include (Tinat)</span>
        <span>app/api/studies/[id]/route.ts</span>
      </div>
      <pre>
// Fetch study with researcher & questions
const study = await prisma.study.findUnique({
  where: { id: studyId },
  include: {
    researcher: {
      select: { name: true, email: true, institution: true }
    },
    questions: {
      select: { id: true, questionText: true, type: true, options: true },
      orderBy: { orderIndex: 'asc' }
    }
  }
});

// HOW PRISMA EXECUTES THIS:
// Generates an optimized SQL statement with LEFT JOINs
// or parallel batch queries executed in C-speed inside
// PostgreSQL's query optimizer with connection pooling!
      </pre>
    </div>
  </div>

  <h2>4.2 The "N+1 Query" Performance Disaster in MongoDB</h2>
  <p>
    In MERN development, calling <code>.populate()</code> inside a loop is one of the most common causes of server freezes:
  </p>
  <pre>
// ⚠️ THE MERN N+1 TRAP:
const studies = await Study.find({ status: "ACTIVE" }); // 1 query returning 100 studies
for (let study of studies) {
  await study.populate('questions'); // 100 separate round-trip queries over the network!
}
// Total network round-trips: 101 queries! Under load, this crashes Node.js event loop.
  </pre>
  <p>
    In PERN, Prisma automatically batches queries using <code>WHERE id IN (...)</code> or combines them into a single SQL statement. Fetching 100 studies with all their questions requires <strong>at most two queries or one single join</strong>, completed in single-digit milliseconds.
  </p>

  <!-- ==================== PAGE 10: LECTURE 4 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>4.3 Understanding SQL Joins vs. Application-Level Joins</h2>
  <p>
    When Mongoose executes <code>.populate()</code>, the "join" happens in <strong>Node.js V8 memory</strong>. Node.js must allocate heap objects for thousands of documents, loop through arrays, match strings, and build nested JavaScript objects.
  </p>
  <p>
    In PostgreSQL, joins happen inside the <strong>PostgreSQL C++ Engine</strong> using optimized algorithms (Hash Join, Merge Join, Nested Loop Join) optimized over 35 years of database research. PostgreSQL utilizes hardware-level vector instructions, shared memory buffers, and indexed foreign key pointers.
  </p>

  <!-- FIGURE L4.1: QUERY EXECUTION -->
  <div class="diagram-container">
    <div class="diagram-title">Figure L4.1 — Query Execution Path: Application-Side .populate() vs. Database-Engine SQL JOIN</div>
    <svg width="100%" height="130" viewBox="0 0 660 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Mongoose Path -->
      <rect x="20" y="8" width="290" height="114" rx="6" fill="#f8fafc" stroke="#10b981" stroke-width="1.2"/>
      <text x="165" y="24" fill="#065f46" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Mongoose .populate() Execution Flow</text>

      <rect x="35" y="34" width="75" height="30" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="72" y="48" fill="#0f172a" font-size="6.2" font-family="sans-serif" text-anchor="middle">1. Study Query</text>
      <text x="72" y="58" fill="#64748b" font-size="5.2" font-family="sans-serif" text-anchor="middle">Network Trip 1</text>

      <path d="M110 49 L130 49" stroke="#10b981" stroke-width="1.5"/>

      <rect x="130" y="34" width="80" height="30" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="170" y="48" fill="#0f172a" font-size="6.2" font-family="sans-serif" text-anchor="middle">2. User Query</text>
      <text x="170" y="58" fill="#64748b" font-size="5.2" font-family="sans-serif" text-anchor="middle">Network Trip 2</text>

      <path d="M210 49 L230 49" stroke="#10b981" stroke-width="1.5"/>

      <rect x="230" y="34" width="70" height="30" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="265" y="48" fill="#0f172a" font-size="6.2" font-family="sans-serif" text-anchor="middle">3. Questions</text>
      <text x="265" y="58" fill="#64748b" font-size="5.2" font-family="sans-serif" text-anchor="middle">Network Trip 3</text>

      <rect x="35" y="74" width="265" height="38" rx="3" fill="#fff1f2" stroke="#fecdd3"/>
      <text x="167" y="88" fill="#9f1239" font-size="6.2" font-family="sans-serif" font-weight="bold" text-anchor="middle">Stitched in Node.js Event Loop Memory</text>
      <text x="167" y="102" fill="#be123c" font-size="5.5" font-family="sans-serif" text-anchor="middle">3 separate network socket trips + Node V8 heap serialization overhead</text>

      <!-- PostgreSQL Path -->
      <rect x="340" y="8" width="300" height="114" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>
      <text x="490" y="24" fill="#0369a1" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">PostgreSQL Relational JOIN Execution Flow</text>

      <rect x="355" y="34" width="115" height="30" rx="3" fill="#ffffff" stroke="#0284c7"/>
      <text x="412" y="48" fill="#0369a1" font-size="6.2" font-family="sans-serif" font-weight="bold" text-anchor="middle">1 Single SQL Request</text>
      <text x="412" y="58" fill="#0c4a6e" font-size="5.2" font-family="sans-serif" text-anchor="middle">One Network Roundtrip</text>

      <path d="M470 49 L495 49" stroke="#0284c7" stroke-width="2"/>

      <rect x="495" y="34" width="135" height="30" rx="3" fill="#ffffff" stroke="#059669"/>
      <text x="562" y="48" fill="#065f46" font-size="6.2" font-family="sans-serif" font-weight="bold" text-anchor="middle">PostgreSQL C-Engine Join</text>
      <text x="562" y="58" fill="#047857" font-size="5.2" font-family="sans-serif" text-anchor="middle">Hash & Merge Joins on Indexes</text>

      <rect x="355" y="74" width="275" height="38" rx="3" fill="#f0fdf4" stroke="#86efac"/>
      <text x="492" y="88" fill="#15803d" font-size="6.2" font-family="sans-serif" font-weight="bold" text-anchor="middle">Fully Formed Result Returned Directly</text>
      <text x="492" y="102" fill="#166534" font-size="5.5" font-family="sans-serif" text-anchor="middle">Zero Node.js stitching; memory-efficient streaming across pooled sockets</text>
    </svg>
  </div>

  <h2>4.4 Cascading Deletes: Keeping the Database Clean</h2>
  <p>
    What happens when a researcher deletes a draft study?
  </p>
  <ul>
    <li>
      <strong>In MERN:</strong> If you delete a study with <code>Study.findByIdAndDelete(id)</code>, all the questions and responses stored in separate collections remain stranded in MongoDB as <strong>orphaned zombie documents</strong>. You must write manual pre-delete hooks (<code>StudySchema.pre('remove', ...)</code>) to delete them manually. If your server crashes mid-hook, orphans remain forever.
    </li>
    <li>
      <strong>In PERN:</strong> Foreign keys feature native <code>onDelete: Cascade</code>. When you call <code>prisma.study.delete({ where: { id } })</code>, PostgreSQL's relational engine automatically and instantaneously purges all corresponding questions, sections, options, and draft responses in one atomic operation!
    </li>
  </ul>

  <!-- ==================== PAGE 11: LECTURE 5 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 5: Transactions & Consistency — ACID vs. BASE</h1>

  <h2>5.1 The Theoretical Divide: ACID vs. BASE</h2>
  <p>
    This is the single most critical reason enterprise financial platforms like Tinat are built on PostgreSQL rather than MongoDB.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Property</th>
        <th style="width: 40%;">PostgreSQL (PERN — ACID)</th>
        <th style="width: 40%;">MongoDB (MERN — BASE)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Atomicity (A)</strong></td>
        <td><strong>All or Nothing:</strong> In a multi-step financial transaction, if any single step fails, the entire transaction is rolled back. No partial writes can ever exist.</td>
        <td>Historically single-document only. Multi-document transactions were added in v4.0 but incur severe performance penalties and replica set constraints.</td>
      </tr>
      <tr>
        <td><strong>Consistency (C)</strong></td>
        <td><strong>Strict Consistency:</strong> The database transitions from one valid state to another. Constraints, foreign keys, and unique indexes are checked immediately.</td>
        <td><strong>Eventual Consistency (BASE):</strong> Data is "Basically Available, Soft-state, Eventually consistent". Shards may report out-of-date balances during replication lag.</td>
      </tr>
      <tr>
        <td><strong>Isolation (I)</strong></td>
        <td><strong>Serializable & Read Committed:</strong> Concurrent transactions cannot interfere with each other or read dirty uncommitted data. Race conditions are prevented.</td>
        <td>Document-level locking. Concurrent writes to different collections can produce interleaving anomalies and race conditions.</td>
      </tr>
      <tr>
        <td><strong>Durability (D)</strong></td>
        <td><strong>Write-Ahead Logging (WAL):</strong> Once committed, data is written to append-only disk logs. Even if the server loses power 1 microsecond later, data is safe.</td>
        <td>WiredTiger journaling. In default configurations, writes may reside in memory journals for up to 100ms before syncing to disk.</td>
      </tr>
    </tbody>
  </table>

  <h2>5.2 The Tinat Financial Ledger Case Study</h2>
  <p>
    Consider what happens when a research participant completes Study #TIN-492 and earns <strong>25 ETB</strong>. In Tinat, three actions must happen simultaneously:
  </p>
  <ol>
    <li>The Participant's <code>Wallet.balance</code> must increase by 25.0 ETB.</li>
    <li>The Study's Escrow <code>Study.budgetRemaining</code> must decrease by 25.0 ETB.</li>
    <li>A new permanent, immutable row must be written to <code>TinatCreditTransaction</code>.</li>
  </ol>

  <div class="compare-grid">
    <div class="code-card">
      <div class="code-card-header header-mern">
        <span>The MERN Vulnerability (Race Condition)</span>
        <span>wallet.service.js</span>
      </div>
      <pre>
// ⚠️ MERN without multi-doc transaction
await Wallet.updateOne(
  { userId: participantId },
  { $inc: { balance: 25.0 } }
);

// If server crashes or Chapa network fails here:
// Participant got free 25 ETB, but Study escrow
// was never debited, and transaction was never logged!
await Study.updateOne(
  { _id: studyId },
  { $inc: { budgetRemaining: -25.0 } }
);

await Transaction.create({ ... });
      </pre>
    </div>

    <div class="code-card">
      <div class="code-card-header header-pern">
        <span>The PERN Guarantee (Prisma $transaction)</span>
        <span>app/api/surveys/[id]/submit/route.ts</span>
      </div>
      <pre>
// ✅ PERN: Guaranteed Atomic Transaction
await prisma.$transaction([
  // 1. Credit participant wallet
  prisma.wallet.update({
    where: { userId: participantId },
    data: { balance: { increment: 25.0 } }
  }),
  // 2. Debit study escrow pool
  prisma.study.update({
    where: { id: studyId },
    data: { budgetRemaining: { decrement: 25.0 } }
  }),
  // 3. Write immutable audit ledger
  prisma.tinatCreditTransaction.create({
    data: {
      walletId: participantWallet.id,
      amount: 25.0,
      type: "STUDY_REWARD",
      balanceAfter: participantWallet.balance + 25.0
    }
  })
]);
// If ANY statement fails, PostgreSQL rolls back all 3!
      </pre>
    </div>
  </div>

  <!-- ==================== PAGE 12: LECTURE 5 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>5.3 Database-Level Immutability: PostgreSQL Append-Only Triggers</h2>
  <p>
    In financial accounting, you can never "edit" or "delete" a past transaction. If a participant was credited 25 ETB by mistake, you do not update the transaction to 0; you issue a <strong>reversal entry</strong> of -25 ETB.
  </p>
  <p>
    In MongoDB, immutability must be enforced in your application code. If a disgruntled developer or malicious actor gains access to MongoDB Compass, they can run <code>db.transactions.deleteMany({})</code> and wipe the financial history.
  </p>
  <p>
    In Tinat, PostgreSQL enforces immutability <strong>inside the database engine itself</strong> using a PL/pgSQL trigger:
  </p>
  <pre>
-- Production Trigger on Tinat's PostgreSQL Financial Ledger:
CREATE OR REPLACE FUNCTION enforce_financial_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL AUDIT VIOLATION: Financial transactions are append-only. UPDATE and DELETE operations are permanently prohibited on table FinancialTransaction.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_financial_ledger
BEFORE UPDATE OR DELETE ON "FinancialTransaction"
FOR EACH ROW EXECUTE FUNCTION enforce_financial_immutability();
  </pre>
  <p>
    Even if the superuser executes <code>DELETE FROM "FinancialTransaction"</code>, PostgreSQL intercepts the command, raises an exception, and halts the operation. This provides banking-grade audit compliance that NoSQL databases cannot natively achieve.
  </p>

  <!-- FIGURE L5.1: TRANSACTION PIPELINE -->
  <div class="diagram-container">
    <div class="diagram-title">Figure L5.1 — Multi-Table ACID Transaction vs. MongoDB Eventual Race Condition</div>
    <svg width="100%" height="95" viewBox="0 0 660 95" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="130" height="42" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="75" y="27" fill="#1e40af" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Step 1: Wallet Balance</text>
      <text x="75" y="40" fill="#3b82f6" font-size="6" font-family="sans-serif" text-anchor="middle">+25.0 ETB (Locked)</text>

      <path d="M140 31 L165 31" stroke="#0284c7" stroke-width="2"/>

      <rect x="165" y="10" width="130" height="42" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="230" y="27" fill="#1e40af" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Step 2: Study Escrow</text>
      <text x="230" y="40" fill="#3b82f6" font-size="6" font-family="sans-serif" text-anchor="middle">-25.0 ETB (Locked)</text>

      <path d="M295 31 L320 31" stroke="#0284c7" stroke-width="2"/>

      <rect x="320" y="10" width="140" height="42" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="390" y="27" fill="#1e40af" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">Step 3: Ledger Insert</text>
      <text x="390" y="40" fill="#3b82f6" font-size="6" font-family="sans-serif" text-anchor="middle">TinatCreditTransaction</text>

      <path d="M460 31 L485 31" stroke="#059669" stroke-width="2"/>

      <rect x="485" y="10" width="165" height="42" rx="5" fill="#ecfdf5" stroke="#059669" stroke-width="1.5"/>
      <text x="567" y="27" fill="#065f46" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">POSTGRESQL COMMIT</text>
      <text x="567" y="40" fill="#047857" font-size="6" font-family="sans-serif" text-anchor="middle">All 3 Commit Simultaneously</text>

      <path d="M390 52 L390 70 L75 70 L75 75" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="235" y="66" fill="#b91c1c" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">If Error at Step 3 &rarr; AUTOMATIC FULL ROLLBACK (Zero Balance Discrepancy)</text>
    </svg>
  </div>

  <!-- ==================== PAGE 13: LECTURE 6 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 6: Referential Integrity, Constraints & Fraud Protection</h1>

  <h2>6.1 The Anti-Sybil Defense: Fayda Hashing</h2>
  <p>
    In online survey platforms, the biggest threat to scientific validity is <strong>Sybil attacks</strong>: one individual creating 50 accounts with different email addresses to submit fake survey answers and hoard ETB payouts.
  </p>
  <p>
    Tinat integrates with Ethiopia's <strong>Fayda National Digital ID</strong>. When a citizen verifies their Fayda ID, the system computes an irreversible cryptographic hash:
  </p>
  <p style="text-align: center; font-family: monospace; font-size: 8pt; background: #f8fafc; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;">
    faydaFanHash = SHA-256( NationalFIN + PlatformSecretSalt )
  </p>

  <div class="compare-grid">
    <div class="code-card">
      <div class="code-card-header header-mern">
        <span>MongoDB Unique Index Vulnerability</span>
        <span>user.model.js</span>
      </div>
      <pre>
// MongoDB Unique Index:
UserSchema.index({ faydaFanHash: 1 }, { unique: true, sparse: true });

// THE DISTRIBUTED MONGODB VULNERABILITY:
// In a sharded or replica set cluster, if two requests
// arrive simultaneously at different mongos routers,
// MongoDB unique indexes can experience race conditions
// during write bursts, permitting duplicate records
// before the index synchronization catches up!
      </pre>
    </div>

    <div class="code-card">
      <div class="code-card-header header-pern">
        <span>PostgreSQL B-Tree Unique Constraint</span>
        <span>prisma/schema.prisma</span>
      </div>
      <pre>
model User {
  id           String  @id @default(cuid())
  email        String  @unique
  faydaFanHash String? @unique // Enforced by B-Tree Index
}

// THE POSTGRESQL ATOMIC GUARANTEE:
// PostgreSQL checks the B-Tree index at the storage engine
// level under exclusive row locks. If two identical
// faydaFanHash inserts arrive at the exact same microsecond,
// one succeeds and the other triggers error 23505:
// "duplicate key value violates unique constraint"
      </pre>
    </div>
  </div>

  <h2>6.2 Check Constraints & Database Enums</h2>
  <p>
    In MERN, if you want to ensure a participant's wallet balance never drops below zero, you write validation in your Mongoose schema: <code>min: [0, 'Balance cannot be negative']</code>. However, Mongoose validation only runs when you call <code>user.save()</code>. If you execute a direct update like <code>Wallet.updateOne({ ... }, { $inc: { balance: -50 } })</code>, <strong>Mongoose validations are bypassed entirely!</strong> Your user's balance is now negative.
  </p>
  <p>
    In PostgreSQL, you define <strong>SQL CHECK Constraints</strong>:
  </p>
  <pre>
ALTER TABLE "Wallet" ADD CONSTRAINT "wallet_balance_non_negative" CHECK ("balance" >= 0.0);
  </pre>
  <p>
    No matter what query, server action, or raw SQL script runs, if a debit causes the balance to drop below zero, PostgreSQL immediately aborts the transaction with error <code>23514 check_violation</code>. The application is mathematically protected against overdrafts.
  </p>

  <!-- ==================== PAGE 14: LECTURE 6 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>6.3 Enums: Type Safety in the Database Engine</h2>
  <p>
    Tinat defines 26 standardized system enums (such as <code>StudyStatus</code>, <code>QuestionType</code>, <code>TransactionType</code>). In MERN, enums are simply strings in MongoDB. If a bug inserts <code>status = "ACTIVE "</code> (with an accidental trailing space), MongoDB saves it without complaint. Queries looking for <code>status === "ACTIVE"</code> will never find the study!
  </p>
  <p>
    In PostgreSQL, an enum is an internal 4-byte scalar type registered in the database catalog:
  </p>
  <pre>
CREATE TYPE "StudyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
  </pre>
  <p>
    Attempting to insert any string outside these exact five values is rejected instantly with <code>invalid input value for enum</code>. Furthermore, comparing enums in PostgreSQL is as fast as comparing integers, whereas in MongoDB, comparing strings requires byte-by-byte string comparison.
  </p>

  <h2>6.4 Summary Comparison: Data Integrity Mechanisms</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Integrity Requirement</th>
        <th style="width: 37%;">MERN Stack (MongoDB / Mongoose)</th>
        <th style="width: 38%;">PERN Stack (PostgreSQL / Prisma — Tinat)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Foreign Key Protection</strong></td>
        <td>None. Deleting a parent document leaves orphaned children in other collections.</td>
        <td>Strict database-level foreign keys with <code>ON DELETE CASCADE</code> or <code>ON DELETE RESTRICT</code>.</td>
      </tr>
      <tr>
        <td><strong>Unique Identity Guarantee</strong></td>
        <td>Application-level indexes; subject to replication race conditions in sharded clusters.</td>
        <td>Atomic B-Tree unique constraints blocking duplicate entries at the disk storage level.</td>
      </tr>
      <tr>
        <td><strong>Numerical Boundaries</strong></td>
        <td>Mongoose schema <code>min/max</code> (bypassed by <code>updateOne</code> / <code>findByIdAndUpdate</code>).</td>
        <td>PostgreSQL <code>CHECK</code> constraints enforced on all writes regardless of query method.</td>
      </tr>
      <tr>
        <td><strong>Allowed String Values</strong></td>
        <td>Strings validated in Node.js runtime memory.</td>
        <td>4-byte PostgreSQL <code>ENUM</code> types verified by the database catalog engine.</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== PAGE 15: LECTURE 7 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 7: The Hybrid Superpower — PostgreSQL JSONB</h1>

  <h2>7.1 Having Your Cake and Eating It Too</h2>
  <p>
    When MERN developers consider transitioning to PostgreSQL, their #1 hesitation is usually: <em>"What if I have flexible, unpredictable data that doesn't fit into neat rigid columns? In MongoDB, I can store any arbitrary JSON object!"</em>
  </p>
  <p>
    The secret weapon of modern PostgreSQL is <strong>JSONB (Binary JSON)</strong>. PostgreSQL allows you to define columns of type <code>Json</code> (JSONB), giving you the complete schemaless freedom of MongoDB <strong>inside</strong> a high-performance relational database!
  </p>

  <h2>7.2 Case Study: Tinat Forms Dynamic Question Engine</h2>
  <p>
    In Tinat, researchers using the visual no-code form builder ( <code>/forms</code> ) can add 9 different question types: Short Text, Long Text, Multiple Choice, Checkboxes, Dropdown, Linear Rating Scales (1–5 / 1–10), Yes/No, Date Pickers, and File Uploads.
  </p>
  <p>
    A Linear Rating Scale question needs <code>minValue: 1</code>, <code>maxValue: 10</code>, <code>minLabel: "Poor"</code>, <code>maxLabel: "Excellent"</code>. A Multiple Choice question needs an array of options: <code>["Option A", "Option B"]</code>. A Date question needs <code>allowFutureDates: false</code>.
  </p>
  <p>
    Creating 15 separate relational columns for every question variation would cause severe table bloat. Instead, Tinat defines:
  </p>
  <pre>
// In prisma/schema.prisma:
model FormQuestion {
  id           String      @id @default(cuid())
  formId       String
  questionText String
  type         QuestionType
  
  // THE SUPERPOWER: PostgreSQL JSONB Column
  config       Json        @default("{}") // Stores arbitrary configuration!
  options      Json        @default("[]") // Stores dynamic option lists!
  logicRules   Json        @default("[]") // Stores conditional branching rules!
  
  form         TinatForm   @relation(fields: [formId], references: [id], onDelete: Cascade)
}
  </pre>

  <!-- ==================== PAGE 16: LECTURE 7 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>7.3 Querying JSONB in PostgreSQL vs. MongoDB</h2>
  <p>
    PostgreSQL provides rich native operators for indexing and querying nested JSON objects. Compare how you query JSON in MongoDB vs. PostgreSQL:
  </p>

  <div class="compare-grid">
    <div class="code-card">
      <div class="code-card-header header-mern">
        <span>MongoDB JSON Query</span>
        <span>mongo.query.js</span>
      </div>
      <pre>
// Find questions where config.maxValue is 10
const questions = await Question.find({
  "config.maxValue": 10
});

// Find questions containing "Option B"
const multi = await Question.find({
  options: { $elemMatch: { label: "Option B" } }
});
      </pre>
    </div>

    <div class="code-card">
      <div class="code-card-header header-pern">
        <span>PostgreSQL JSONB Query (Tinat)</span>
        <span>Raw SQL / Prisma</span>
      </div>
      <pre>
-- Find questions where config->>'maxValue' = '10'
SELECT * FROM "FormQuestion"
WHERE config->>'maxValue' = '10';

-- Find questions containing "Option B" using @> (contains)
SELECT * FROM "FormQuestion"
WHERE options @> '[{"label": "Option B"}]';
      </pre>
    </div>
  </div>

  <h2>7.4 GIN Indexing: Indexing Entire JSON Trees</h2>
  <p>
    In PostgreSQL, you can attach a <strong>GIN (Generalized Inverted Index)</strong> to a JSONB column:
  </p>
  <pre>
CREATE INDEX idx_form_question_config ON "FormQuestion" USING gin (config);
  </pre>
  <p>
    This indexes every key, value, and nested array inside the JSON column simultaneously. A search across 500,000 JSON documents runs in sub-millisecond time. This provides all the benefits of MongoDB's document model with none of its transactional downsides!
  </p>

  <!-- FIGURE L7.1: HYBRID ARCHITECTURE -->
  <div class="diagram-container">
    <div class="diagram-title">Figure L7.1 — The Hybrid Architecture: Relational Skeleton + Dynamic JSONB Muscle</div>
    <svg width="100%" height="95" viewBox="0 0 660 95" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="10" width="180" height="75" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="105" y="26" fill="#1e40af" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">RELATIONAL SKELETON</text>
      <text x="105" y="40" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• User ID, Email, Role</text>
      <text x="105" y="52" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Foreign Key: studyId &rarr; Study</text>
      <text x="105" y="64" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• B-Tree Indexes & Constraints</text>
      <text x="105" y="78" fill="#1e40af" font-size="5.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Guarantees ACID Integrity</text>

      <path d="M195 47 L230 47" stroke="#059669" stroke-width="2"/>
      <text x="212" y="42" fill="#059669" font-size="6" font-family="sans-serif" text-anchor="middle">+</text>

      <rect x="230" y="10" width="180" height="75" rx="6" fill="#f0fdf4" stroke="#10b981" stroke-width="1.2"/>
      <text x="320" y="26" fill="#065f46" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">DYNAMIC JSONB MUSCLE</text>
      <text x="320" y="40" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Question Config Options</text>
      <text x="320" y="52" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Branching Condition Logic</text>
      <text x="320" y="64" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Flexible Survey Payload</text>
      <text x="320" y="78" fill="#065f46" font-size="5.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">No-Code Form Flexibility</text>

      <path d="M410 47 L445 47" stroke="#059669" stroke-width="2"/>
      <text x="427" y="42" fill="#059669" font-size="6" font-family="sans-serif" text-anchor="middle">=</text>

      <rect x="445" y="10" width="200" height="75" rx="6" fill="#f8fafc" stroke="#0284c7" stroke-width="1.5"/>
      <text x="545" y="26" fill="#0284c7" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">THE TINAT ADVANTAGE</text>
      <text x="545" y="42" fill="#0c4a6e" font-size="6.2" font-family="sans-serif" text-anchor="middle">Best of Both Worlds:</text>
      <text x="545" y="55" fill="#15803d" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">Strict banking-grade escrow ledgers</text>
      <text x="545" y="68" fill="#0369a1" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">+ Google-Forms style flexibility</text>
    </svg>
  </div>

  <!-- ==================== PAGE 17: LECTURE 8 ==================== -->
  <div class="page-break"></div>
  <h1>Lecture 8: The MERN-to-PERN Developer Migration Playbook</h1>

  <h2>8.1 The Vocabulary Rosetta Stone</h2>
  <p>
    Keep this mental translation table at your desk when transitioning from MERN codebases to PERN codebases:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">MERN Concept (MongoDB / Mongoose)</th>
        <th style="width: 35%;">PERN Equivalent (PostgreSQL / Prisma)</th>
        <th style="width: 40%;">What You Need to Know</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Database</strong></td>
        <td><strong>Database</strong></td>
        <td>Direct equivalent; hosted on Neon, Supabase, AWS RDS, or local Docker.</td>
      </tr>
      <tr>
        <td><strong>Collection</strong></td>
        <td><strong>Table</strong></td>
        <td>Instead of an unstructured collection of BSON docs, data is in a strict 2D table.</td>
      </tr>
      <tr>
        <td><strong>Document</strong></td>
        <td><strong>Row (Record)</strong></td>
        <td>Every record has the exact same columns defined by the schema.</td>
      </tr>
      <tr>
        <td><strong>Field</strong></td>
        <td><strong>Column</strong></td>
        <td>Columns have strict data types (<code>TEXT</code>, <code>INTEGER</code>, <code>BOOLEAN</code>, <code>JSONB</code>, <code>TIMESTAMP</code>).</td>
      </tr>
      <tr>
        <td><strong><code>_id: ObjectId("...")</code></strong></td>
        <td><strong><code>id: UUID</code> or <code>CUID</code> (Primary Key)</strong></td>
        <td>Primary Keys uniquely identify rows; Tinat uses collision-resistant CUID strings.</td>
      </tr>
      <tr>
        <td><strong>Embedded Subdocuments</strong></td>
        <td><strong>Separate Table with Foreign Key</strong></td>
        <td>Avoid embedding large arrays; create a child table linked by parent ID.</td>
      </tr>
      <tr>
        <td><strong><code>.populate()</code></strong></td>
        <td><strong>SQL <code>JOIN</code> or Prisma <code>include</code></strong></td>
        <td>Joins are executed in C-speed by PostgreSQL instead of Node.js memory.</td>
      </tr>
      <tr>
        <td><strong>Mongoose Model</strong></td>
        <td><strong>Prisma Client Delegate (<code>prisma.user</code>)</strong></td>
        <td>Type-safe query builder generated automatically from <code>schema.prisma</code>.</td>
      </tr>
      <tr>
        <td><strong><code>mongosh</code></strong></td>
        <td><strong><code>psql</code></strong></td>
        <td>The native interactive terminal shell for inspecting and querying data.</td>
      </tr>
      <tr>
        <td><strong>MongoDB Compass</strong></td>
        <td><strong>Prisma Studio (<code>npx prisma studio</code>)</strong></td>
        <td>Visual web-based graphical interface for viewing and editing database rows.</td>
      </tr>
    </tbody>
  </table>

  <h2>8.2 Top 5 Common Pitfalls for MERN Developers in PERN</h2>
  <ul>
    <li>
      <strong>Pitfall 1: Trying to embed large arrays inside one record.</strong><br>
      <em>MERN habit:</em> Creating an array of 5,000 items inside one object. <em>PERN fix:</em> Create a separate table with a foreign key pointing back to the parent ID.
    </li>
    <li>
      <strong>Pitfall 2: Forgetting to run migrations when editing schemas.</strong><br>
      <em>MERN habit:</em> Adding a field to Mongoose and restarting Node. <em>PERN fix:</em> Always run <code>npx prisma migrate dev</code> so PostgreSQL creates the SQL column on disk.
    </li>
    <li>
      <strong>Pitfall 3: Manual multi-step balance changes without <code>$transaction</code>.</strong><br>
      <em>MERN habit:</em> Running separate <code>update()</code> calls. <em>PERN fix:</em> Wrap related financial updates inside <code>await prisma.$transaction([ ... ])</code>.
    </li>
    <li>
      <strong>Pitfall 4: Relying on application-side validation instead of database constraints.</strong><br>
      <em>MERN habit:</em> Writing JavaScript <code>if (amount &lt; 0)</code> checks. <em>PERN fix:</em> Add SQL <code>CHECK</code> constraints and enums so the database protects itself.
    </li>
    <li>
      <strong>Pitfall 5: Treating <code>undefined</code> and <code>null</code> as the same.</strong><br>
      <em>MERN habit:</em> Omitting a field makes it undefined. <em>PERN fix:</em> In SQL, a column is either <code>NOT NULL</code> (must have a value) or nullable (<code>NULL</code>).
    </li>
  </ul>

  <!-- ==================== PAGE 18: LECTURE 8 CONTINUED ==================== -->
  <div class="page-break"></div>
  <h2>8.3 The Developer's Migration Checklist</h2>
  <p>
    When migrating a feature or project from MERN to PERN, follow this disciplined 6-step engineering checklist:
  </p>

  <div class="info-box">
    <h4>Step 1: Normalize Your Entities</h4>
    <p>Look at your Mongoose schemas. Identify any embedded arrays (e.g. <code>questions</code>, <code>comments</code>, <code>transactions</code>). Extract them into distinct Prisma models with a <code>@relation</code> and foreign key.</p>
  </div>

  <div class="info-box">
    <h4>Step 2: Declare Enums and Constraints in <code>schema.prisma</code></h4>
    <p>Replace loose string validations with strict Prisma <code>enum</code> definitions. Mark critical unique fields (emails, national ID hashes) with <code>@unique</code>.</p>
  </div>

  <div class="info-box">
    <h4>Step 3: Leverage JSONB for Truly Dynamic Data</h4>
    <p>If you have genuinely arbitrary metadata (like Tinat Forms question configs or audit event logs), do not create 20 empty columns. Use a <code>Json</code> column with a default <code>"{}"</code>.</p>
  </div>

  <div class="info-box">
    <h4>Step 4: Execute Initial Migration & Generate Client</h4>
    <p>Run <code>npx prisma migrate dev --name init</code>. Verify that the generated SQL migration creates your tables and foreign key indices cleanly.</p>
  </div>

  <div class="info-box">
    <h4>Step 5: Replace <code>.find().populate()</code> with Type-Safe <code>include</code></h4>
    <p>Rewrite your backend controllers. Benefit immediately from TypeScript autocomplete. Delete all manual TypeScript interface definitions that duplicated your old Mongoose models.</p>
  </div>

  <div class="info-box">
    <h4>Step 6: Secure Critical Ledgers with Atomic Transactions</h4>
    <p>Audit every financial or inventory movement. Encase them in atomic <code>prisma.$transaction</code> blocks to eliminate race conditions and double-spending vulnerabilities forever.</p>
  </div>

  <div class="case-study-box" style="margin-top: 14px;">
    <h4>Final Takeaway for Certified MERN Developers</h4>
    <p>
      Your transition from MERN to PERN is not about abandoning what you know—it is an <strong>evolution into enterprise-grade engineering</strong>. By pairing your React and Node.js proficiency with PostgreSQL's mathematical relational rigor and ACID transactions, you gain the superpower to build mission-critical financial, healthcare, and research infrastructure like the <strong>Tinat Research Ecosystem</strong>.
    </p>
  </div>

  <p style="text-align: center; font-size: 7.5pt; color: #64748b; margin-top: 24px;">
    — END OF ADVANCED FULL-STACK LECTURE GUIDE —<br>
    From MERN to PERN • Published November 2026 • Tinat Engineering Architecture Series
  </p>

</body>
</html>
`;
};

const html = generateHtml();
fs.writeFileSync(outputHtmlPath, html, 'utf8');
console.log('✅ Lecture HTML written to: ' + outputHtmlPath);

// Execute Chrome Headless to compile into PDF
try {
  console.log('Rendering Lecture PDF via Headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cmd = '"' + chromePath + '" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="' + outputPdfPath + '" "' + outputHtmlPath + '"';
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(outputPdfPath)) {
    const stats = fs.statSync(outputPdfPath);
    console.log('✅ Lecture PDF successfully generated: ' + outputPdfPath + ' (' + Math.round(stats.size / 1024) + ' KB)');

    // Copy to brain artifact directory
    fs.copyFileSync(outputPdfPath, brainPdfPath);
    console.log('✅ Lecture PDF copied to artifact directory: ' + brainPdfPath);

    fs.copyFileSync(outputHtmlPath, brainHtmlPath);
    console.log('✅ Lecture HTML copied to artifact directory: ' + brainHtmlPath);
  } else {
    console.error('❌ PDF file was not created.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error generating PDF:', err);
  process.exit(1);
}
