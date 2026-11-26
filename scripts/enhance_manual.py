import os
import re

script_path = r'C:\Users\hp\Desktop\Tinat Project\Tinat\app\scripts\generate_master_technical_manual_pdf.ts'

with open(script_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update cover subtitle to mention PERN Stack Architecture
cover_desc_old = 'Master Reference Guide: Foundational Concepts in Plain English, Complete User Journey from Landing Page to Logout, 45 Relational Models, 26 Enums, 44 User Pages, 85 REST APIs, Financial Ledgers, Tinat Forms, and Mobile Administration Architecture.'
cover_desc_new = 'Master Reference Guide: PERN Stack Architecture (PostgreSQL 16, Express/Next.js API Routes, React 19, Node.js 26), Foundational Concepts in Plain English, Complete User Journey from Landing to Logout, 45 Relational Models, 26 Enums, 44 User Pages, 85 REST APIs, Financial Ledgers, Tinat Forms, and Mobile Administration Architecture.'

if cover_desc_old in content:
    content = content.replace(cover_desc_old, cover_desc_new)
    print("Cover description updated.")
else:
    print("Warning: cover_desc_old not found")

# 2. Update Table of Contents
toc_old = """  <h1>Table of Contents</h1>
  
  <div style="margin: 18px 0; font-size: 8.5pt;">
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 1: Foundations in Plain English: How Web Platforms Work</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">3</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 2: The Complete Platform Journey: From Visitor to Logout</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">5</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 3: Database Architecture & Data Dictionary (45 Models, 26 Enums)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">8</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 4: Complete Frontend Page Directory (All 44 User Pages)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">14</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 5: Complete Backend API Directory (All 85 REST Endpoints)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">20</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 6: Specialized Platform Engine Deep-Dives (With Process Figures)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">25</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 7px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 7: Production Operations, Security & Compliance</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">28</span>
    </div>
  </div>"""

toc_new = """  <h1>Table of Contents</h1>
  
  <div style="margin: 14px 0; font-size: 8.5pt;">
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 1: Foundations in Plain English & PERN Architecture Deep-Dive</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">3</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 2: The Complete Platform Journey: From Visitor to Logout</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">6</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 3: Database Architecture & Data Dictionary (45 Models, 26 Enums)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">9</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 4: Complete Frontend Page Directory (All 44 User Pages)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">15</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 5: Complete Backend API Directory (All 85 REST Endpoints)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">21</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 6: Specialized Platform Engine Deep-Dives (With Process Figures)</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">26</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dotted #cbd5e1;">
      <strong>Chapter 7: Production Operations, Security & Compliance</strong>
      <span style="font-family:monospace; color:#047857; font-weight:bold;">29</span>
    </div>
  </div>

  <h2>Index of Architecture & Process Figures</h2>
  <div style="margin: 8px 0 16px 0; font-size: 7.8pt; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 1.1:</strong> Tinat PERN Multi-Tier Runtime Pipeline (p. 5)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 2.1:</strong> Global Navigation & State Progression Map (p. 6)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 3.1:</strong> Database ER Cluster Architecture (p. 9)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 4.1:</strong> Route Protection & RBAC State Machine (p. 15)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 6.1:</strong> Financial Flow Lifecycle & Double-Entry Ledger (p. 26)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 6.2:</strong> Fayda National ID Cryptographic Pipeline (p. 27)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 6.3:</strong> Tinat Forms Engine & Offline Field Sync (p. 27)
    </div>
    <div style="background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong style="color:#047857;">Figure 6.4:</strong> React Native / Expo Mobile Admin & Push Sync (p. 28)
    </div>
  </div>"""

if toc_old in content:
    content = content.replace(toc_old, toc_new)
    print("Table of contents updated.")
else:
    print("Warning: toc_old not found")

# 3. Add Page 5: Section 1.3 PERN Stack Deep Dive before Chapter 2
page5_marker = '  <!-- ==================== PAGE 5: CHAPTER 2 ==================== -->'

page5_content = """  <!-- ==================== PAGE 5: 1.3 PERN STACK ARCHITECTURE ==================== -->
  <div class="page-break"></div>
  <h1>1. Foundations: Platform Architecture & Technology Stack</h1>

  <h2>1.3 Technology Stack: Why Tinat Runs on PERN (and Not MERN)</h2>
  
  <div class="info-box">
    <h4>Definitive Architectural Classification: PERN vs. MERN</h4>
    <p>
      A foundational question for technical evaluators is whether Tinat uses <strong>MERN</strong> (MongoDB, Express, React, Node.js) or <strong>PERN</strong> (PostgreSQL, Express / Next.js Server Handlers, React, Node.js). <strong>The Tinat Research Ecosystem is strictly and exclusively built on the PERN stack.</strong> MongoDB is not present anywhere in the codebase. Every single data model, survey response, and financial transaction is governed by <strong>PostgreSQL 16</strong> through <strong>Prisma ORM v7</strong> with the <code>@prisma/adapter-pg</code> connection pool.
    </p>
  </div>

  <!-- FIGURE 1.1: PERN ARCHITECTURE -->
  <div class="diagram-container">
    <div class="diagram-title">Figure 1.1 — Tinat PERN Architecture & Multi-Tier Runtime Pipeline</div>
    <svg width="100%" height="150" viewBox="0 0 660 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Tier 1: Client / Presentation (React 19) -->
      <rect x="10" y="8" width="145" height="134" rx="8" fill="#f0fdf4" stroke="#10b981" stroke-width="1.5"/>
      <rect x="20" y="16" width="125" height="18" rx="4" fill="#10b981"/>
      <text x="82" y="29" fill="#ffffff" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">R — REACT 19 / NEXT 16</text>
      <text x="82" y="47" fill="#065f46" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Presentation Tier</text>
      <text x="82" y="60" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• 44 User Pages (4 Portals)</text>
      <text x="82" y="72" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• React Server Components</text>
      <text x="82" y="84" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Tailwind CSS v4 Styling</text>
      <text x="82" y="96" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Tinat Forms No-Code UI</text>
      <text x="82" y="108" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Recharts Analytics Charts</text>
      <text x="82" y="128" fill="#047857" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">Expo SDK 54 Mobile</text>

      <!-- Arrow 1 -> 2 -->
      <path d="M155 75 L180 75" stroke="#059669" stroke-width="2"/>
      <text x="167" y="69" fill="#059669" font-size="5.5" font-family="sans-serif" text-anchor="middle">HTTP/REST</text>

      <!-- Tier 2: API Gateway / Routing (Express / Next.js API Routes) -->
      <rect x="180" y="8" width="145" height="134" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
      <rect x="190" y="16" width="125" height="18" rx="4" fill="#3b82f6"/>
      <text x="252" y="29" fill="#ffffff" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">E — EXPRESS / NEXT API</text>
      <text x="252" y="47" fill="#1e40af" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">API & Routing Gateway</text>
      <text x="252" y="60" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• 85 REST Route Handlers</text>
      <text x="252" y="72" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• NextAuth v5 JWT Auth</text>
      <text x="252" y="84" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• RBAC Role Dispatching</text>
      <text x="252" y="96" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Chapa Webhook Signatures</text>
      <text x="252" y="108" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Input Validation (Zod)</text>
      <text x="252" y="128" fill="#1e40af" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">Edge Middleware Guards</text>

      <!-- Arrow 2 -> 3 -->
      <path d="M325 75 L350 75" stroke="#059669" stroke-width="2"/>
      <text x="337" y="69" fill="#059669" font-size="5.5" font-family="sans-serif" text-anchor="middle">V8 Call</text>

      <!-- Tier 3: Execution Runtime & ORM (Node.js 26 + Prisma) -->
      <rect x="350" y="8" width="145" height="134" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
      <rect x="360" y="16" width="125" height="18" rx="4" fill="#d97706"/>
      <text x="422" y="29" fill="#ffffff" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">N — NODE.JS 26 & PRISMA</text>
      <text x="422" y="47" fill="#92400e" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Application Server Runtime</text>
      <text x="422" y="60" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Prisma ORM v7 Client</text>
      <text x="422" y="72" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• @prisma/adapter-pg Pool</text>
      <text x="422" y="84" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• SHA-256 Fayda Hashing</text>
      <text x="422" y="96" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Excel Streaming (.xlsx)</text>
      <text x="422" y="108" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Async Email & Notification</text>
      <text x="422" y="128" fill="#92400e" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">Event Loop & Tasks</text>

      <!-- Arrow 3 -> 4 -->
      <path d="M495 75 L520 75" stroke="#059669" stroke-width="2"/>
      <text x="507" y="69" fill="#059669" font-size="5.5" font-family="sans-serif" text-anchor="middle">SQL/TCP</text>

      <!-- Tier 4: Database & Ledger (PostgreSQL 16) -->
      <rect x="520" y="8" width="130" height="134" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
      <rect x="528" y="16" width="114" height="18" rx="4" fill="#1e293b"/>
      <text x="585" y="29" fill="#ffffff" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">P — POSTGRESQL 16</text>
      <text x="585" y="47" fill="#0f172a" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Relational Database</text>
      <text x="585" y="60" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• 45 Relational Models</text>
      <text x="585" y="72" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• 26 System Enums</text>
      <text x="585" y="84" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• ACID Multi-Table Txns</text>
      <text x="585" y="96" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Append-Only PL/pgSQL</text>
      <text x="585" y="108" fill="#334155" font-size="6" font-family="sans-serif" text-anchor="middle">• Hybrid JSONB Fields</text>
      <text x="585" y="128" fill="#0f172a" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">Foreign Key Cascades</text>
    </svg>
  </div>

  <h3>Technical Breakdown: Why PostgreSQL (PERN) Over MongoDB (MERN)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Architectural Dimension</th>
        <th style="width: 41%;">Tinat Implementation (PERN — PostgreSQL 16)</th>
        <th style="width: 41%;">Legacy Alternative (MERN — MongoDB)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Financial Escrow Ledgers</strong></td>
        <td><strong>Strict ACID Atomicity:</strong> All credit movements (Chapa deposits, participant rewards, platform fee splits, Telebirr cashouts) execute inside atomic <code>prisma.$transaction</code> blocks. Balances and transaction logs commit simultaneously or rollback entirely.</td>
        <td><strong>Eventual Consistency Risks:</strong> Document-level locking and eventual consistency in distributed clusters can introduce race conditions and double-spending vulnerabilities during concurrent high-volume survey payouts.</td>
      </tr>
      <tr>
        <td><strong>Survey Relational Logic</strong></td>
        <td><strong>Relational Cascades:</strong> Workspaces &rarr; Projects &rarr; Studies &rarr; Sections &rarr; Questions &rarr; Conditional Branches &rarr; Responses are joined with strict referential integrity. Deleting a study safely cascades or archives related questions.</td>
        <td><strong>Document Size Limits & Orphans:</strong> Storing thousands of participant responses inside nested study documents quickly violates MongoDB's 16 MB BSON document limit; referencing across collections lacks enforced foreign-key constraints.</td>
      </tr>
      <tr>
        <td><strong>Identity & Sybil Prevention</strong></td>
        <td><strong>Database-Level Unique Constraints:</strong> National identity hashes (<code>faydaFanHash</code>) and email addresses are enforced by B-tree unique indexes at the database engine level, guaranteeing that no bot or duplicate account can slip through.</td>
        <td><strong>Application-Level Index Reliance:</strong> In sharded or replica sets, unique index constraints can occasionally allow duplicate writes under severe network partitions or high concurrent insertion bursts.</td>
      </tr>
      <tr>
        <td><strong>Audit Immutability</strong></td>
        <td><strong>PL/pgSQL Append-Only Triggers:</strong> Low-level database triggers intercept any attempted <code>UPDATE</code> or <code>DELETE</code> statements on settled rows in <code>FinancialTransaction</code>, guaranteeing compliance with national financial audit standards.</td>
        <td><strong>Code-Dependent Immutability:</strong> Document databases cannot easily enforce table-level immutability triggers at the database engine level, leaving ledgers vulnerable if application middleware is bypassed.</td>
      </tr>
      <tr>
        <td><strong>Unstructured Flexibility</strong></td>
        <td><strong>PostgreSQL Native JSONB:</strong> Combines relational rigor for users and wallets with high-performance binary JSON (<code>JSONB</code>) columns for dynamic survey question options and branching condition rules.</td>
        <td><strong>Schema Drift:</strong> Unstructured JSON collections frequently accumulate schema drift across software releases, requiring fragile manual data migration scripts.</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== PAGE 6: CHAPTER 2 ==================== -->"""

if page5_marker in content:
    content = content.replace(page5_marker, page5_content)
    print("Page 5 (PERN Deep Dive) inserted successfully.")
else:
    print("Warning: page5_marker not found")

# 4. Add Figure 3.1 in Chapter 3
fig3_marker = """  <h2>3.1 The 26 System Enums (Standardized Choice Lists)</h2>"""

fig3_content = """  <!-- FIGURE 3.1: DATABASE ER CLUSTERS -->
  <div class="diagram-container">
    <div class="diagram-title">Figure 3.1 — Database Entity-Relationship (ER) Cluster Architecture</div>
    <svg width="100%" height="80" viewBox="0 0 660 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 7 Domain Clusters -->
      <rect x="8" y="8" width="85" height="64" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="50" y="22" fill="#1e40af" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. IDENTITY</text>
      <text x="50" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">User, Account</text>
      <text x="50" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">Session, Fayda</text>
      <text x="50" y="56" fill="#1e40af" font-size="5.2" font-family="sans-serif" text-anchor="middle">Auth & Roles</text>

      <path d="M93 40 L102 40" stroke="#059669" stroke-width="1.5"/>

      <rect x="102" y="8" width="88" height="64" rx="5" fill="#ecfdf5" stroke="#10b981" stroke-width="1.2"/>
      <text x="146" y="22" fill="#065f46" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. STUDIES</text>
      <text x="146" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">Study, Collaborator</text>
      <text x="146" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">Targeting, Payment</text>
      <text x="146" y="56" fill="#065f46" font-size="5.2" font-family="sans-serif" text-anchor="middle">IRB Lifecycle</text>

      <path d="M190 40 L198 40" stroke="#059669" stroke-width="1.5"/>

      <rect x="198" y="8" width="92" height="64" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
      <text x="244" y="22" fill="#92400e" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. QUESTIONS</text>
      <text x="244" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">SurveyQuestion</text>
      <text x="244" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">SurveyResponse</text>
      <text x="244" y="56" fill="#92400e" font-size="5.2" font-family="sans-serif" text-anchor="middle">LogicRule Branching</text>

      <path d="M290 40 L298 40" stroke="#059669" stroke-width="1.5"/>

      <rect x="298" y="8" width="88" height="64" rx="5" fill="#f0fdf4" stroke="#059669" stroke-width="1.2"/>
      <text x="342" y="22" fill="#065f46" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">4. LEDGERS</text>
      <text x="342" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">Wallet, CreditTxn</text>
      <text x="342" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">WithdrawalRequest</text>
      <text x="342" y="56" fill="#047857" font-size="5.2" font-family="sans-serif" text-anchor="middle">Immutable Double-Entry</text>

      <path d="M386 40 L394 40" stroke="#059669" stroke-width="1.5"/>

      <rect x="394" y="8" width="88" height="64" rx="5" fill="#f3e8ff" stroke="#8b5cf6" stroke-width="1.2"/>
      <text x="438" y="22" fill="#6b21a8" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">5. PROJECTS</text>
      <text x="438" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">Workspace, Member</text>
      <text x="438" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">ProjectFile, Chat</text>
      <text x="438" y="56" fill="#6b21a8" font-size="5.2" font-family="sans-serif" text-anchor="middle">Team Collab Hub</text>

      <path d="M482 40 L490 40" stroke="#059669" stroke-width="1.5"/>

      <rect x="490" y="8" width="82" height="64" rx="5" fill="#faf5ff" stroke="#a855f7" stroke-width="1.2"/>
      <text x="531" y="22" fill="#581c87" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">6. FORMS</text>
      <text x="531" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">TinatForm, Field</text>
      <text x="531" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">FormResponse</text>
      <text x="531" y="56" fill="#581c87" font-size="5.2" font-family="sans-serif" text-anchor="middle">No-Code & Offline</text>

      <path d="M572 40 L580 40" stroke="#059669" stroke-width="1.5"/>

      <rect x="580" y="8" width="72" height="64" rx="5" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
      <text x="616" y="22" fill="#0f172a" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">7. OPS</text>
      <text x="616" y="34" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">ActivityLog</text>
      <text x="616" y="44" fill="#334155" font-size="5.5" font-family="sans-serif" text-anchor="middle">AIArtifact</text>
      <text x="616" y="56" fill="#475569" font-size="5.2" font-family="sans-serif" text-anchor="middle">SocialDeck</text>
    </svg>
  </div>

  <h2>3.1 The 26 System Enums (Standardized Choice Lists)</h2>"""

if fig3_marker in content:
    content = content.replace(fig3_marker, fig3_content)
    print("Figure 3.1 inserted.")
else:
    print("Warning: fig3_marker not found")

# 5. Add Figure 4.1 in Chapter 4
fig4_marker = """  <h2>4.1 Public & Authentication Pages</h2>"""

fig4_content = """  <!-- FIGURE 4.1: ROUTE PROTECTION & RBAC -->
  <div class="diagram-container">
    <div class="diagram-title">Figure 4.1 — Frontend Route Protection & RBAC Middleware State Machine</div>
    <svg width="100%" height="80" viewBox="0 0 660 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="15" width="105" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
      <text x="62" y="34" fill="#0f172a" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">HTTP REQUEST</text>
      <text x="62" y="48" fill="#64748b" font-size="6" font-family="sans-serif" text-anchor="middle">Browser / Mobile Client</text>

      <path d="M115 40 L140 40" stroke="#059669" stroke-width="2"/>

      <rect x="140" y="10" width="130" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="205" y="28" fill="#1e40af" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">EDGE MIDDLEWARE</text>
      <text x="205" y="42" fill="#3b82f6" font-size="6" font-family="sans-serif" text-anchor="middle">middleware.ts</text>
      <text x="205" y="55" fill="#64748b" font-size="5.5" font-family="sans-serif" text-anchor="middle">JWT Verification & Claims</text>

      <path d="M270 40 L295 40" stroke="#059669" stroke-width="2"/>

      <!-- 4 Role Layout Shells -->
      <rect x="295" y="6" width="115" height="16" rx="4" fill="#ecfdf5" stroke="#10b981"/>
      <text x="352" y="17" fill="#065f46" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">RESEARCHER: /researcher/*</text>

      <rect x="295" y="24" width="115" height="16" rx="4" fill="#eff6ff" stroke="#3b82f6"/>
      <text x="352" y="35" fill="#1e40af" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">PARTICIPANT: /participant/*</text>

      <rect x="295" y="42" width="115" height="16" rx="4" fill="#fef3c7" stroke="#d97706"/>
      <text x="352" y="53" fill="#92400e" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">COLLECTOR: /collector/*</text>

      <rect x="295" y="60" width="115" height="16" rx="4" fill="#f3e8ff" stroke="#8b5cf6"/>
      <text x="352" y="71" fill="#6b21a8" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">ADMIN: /admin/*</text>

      <path d="M410 40 L440 40" stroke="#059669" stroke-width="2"/>

      <!-- Public vs Protected -->
      <rect x="440" y="15" width="105" height="50" rx="6" fill="#f0fdf4" stroke="#059669" stroke-width="1.2"/>
      <text x="492" y="34" fill="#065f46" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">AUTHORIZED RENDER</text>
      <text x="492" y="48" fill="#047857" font-size="6" font-family="sans-serif" text-anchor="middle">React Server Component</text>

      <path d="M545 40 L565 40" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3"/>

      <rect x="565" y="15" width="85" height="50" rx="6" fill="#fef2f2" stroke="#ef4444" stroke-width="1.2"/>
      <text x="607" y="34" fill="#991b1b" font-size="6.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">UNAUTHORIZED</text>
      <text x="607" y="48" fill="#b91c1c" font-size="5.8" font-family="sans-serif" text-anchor="middle">Redirect to /login</text>
    </svg>
  </div>

  <h2>4.1 Public & Authentication Pages</h2>"""

if fig4_marker in content:
    content = content.replace(fig4_marker, fig4_content)
    print("Figure 4.1 inserted.")
else:
    print("Warning: fig4_marker not found")

# 6. Add Figure 6.2 (Fayda Pipeline)
fig62_marker = """  <h2>6.2 The Ethiopian National ID (Fayda) Verification Pipeline</h2>
  <p>
    Data integrity is the cornerstone of clinical and medical research. If respondents are fake bots or one person takes a survey 20 times using different browser tabs, statistical epidemiological conclusions are ruined.
  </p>"""

fig62_content = """  <h2>6.2 The Ethiopian National ID (Fayda) Verification Pipeline</h2>
  <p>
    Data integrity is the cornerstone of clinical and medical research. If respondents are fake bots or one person takes a survey 20 times using different browser tabs, statistical epidemiological conclusions are ruined.
  </p>

  <!-- FIGURE 6.2: FAYDA VERIFICATION PIPELINE -->
  <div class="diagram-container">
    <div class="diagram-title">Figure 6.2 — Fayda National ID Cryptographic Verification & FAN Hashing Pipeline</div>
    <svg width="100%" height="60" viewBox="0 0 660 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="115" height="44" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="67" y="24" fill="#1e40af" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. CITIZEN INPUT</text>
      <text x="67" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Fayda ID (FIN / FCN)</text>

      <path d="M125 30 L145 30" stroke="#059669" stroke-width="2"/>

      <rect x="145" y="8" width="115" height="44" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
      <text x="202" y="24" fill="#92400e" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. FORMAT & OTP</text>
      <text x="202" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">National SMS Auth</text>

      <path d="M260 30 L280 30" stroke="#059669" stroke-width="2"/>

      <rect x="280" y="8" width="115" height="44" rx="5" fill="#ecfdf5" stroke="#10b981" stroke-width="1.2"/>
      <text x="337" y="24" fill="#065f46" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. IDENTITY MATCH</text>
      <text x="337" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Official Registry Sync</text>

      <path d="M395 30 L415 30" stroke="#059669" stroke-width="2"/>

      <rect x="415" y="8" width="115" height="44" rx="5" fill="#faf5ff" stroke="#a855f7" stroke-width="1.2"/>
      <text x="472" y="24" fill="#6b21a8" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">4. SHA-256 HASH</text>
      <text x="472" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">De-Identified FanHash</text>

      <path d="M530 30 L550 30" stroke="#059669" stroke-width="2"/>

      <rect x="550" y="8" width="100" height="44" rx="5" fill="#f0fdf4" stroke="#059669" stroke-width="1.2"/>
      <text x="600" y="24" fill="#047857" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">5. VERIFIED BADGE</text>
      <text x="600" y="38" fill="#15803d" font-size="5.8" font-family="sans-serif" text-anchor="middle">Anti-Sybil Locked</text>
    </svg>
  </div>"""

if fig62_marker in content:
    content = content.replace(fig62_marker, fig62_content)
    print("Figure 6.2 inserted.")
else:
    print("Warning: fig62_marker not found")

# 7. Add Figure 6.3 (Tinat Forms Engine)
fig63_marker = """  <h2>6.3 Tinat Forms: Independent No-Code Survey Engine</h2>
  <p>
    Tinat Forms (accessible at <code>/forms</code> and public link <code>/f/[id]</code>) allows any student, clinician, or organization to build standalone questionnaires without requiring formal multi-month hospital IRB clearance:
  </p>"""

fig63_content = """  <h2>6.3 Tinat Forms: Independent No-Code Survey Engine</h2>
  <p>
    Tinat Forms (accessible at <code>/forms</code> and public link <code>/f/[id]</code>) allows any student, clinician, or organization to build standalone questionnaires without requiring formal multi-month hospital IRB clearance:
  </p>

  <!-- FIGURE 6.3: TINAT FORMS ENGINE & OFFLINE SYNC -->
  <div class="diagram-container">
    <div class="diagram-title">Figure 6.3 — Tinat Forms Dynamic Question Engine & Offline Field Sync Architecture</div>
    <svg width="100%" height="60" viewBox="0 0 660 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="115" height="44" rx="5" fill="#f0fdf4" stroke="#10b981" stroke-width="1.2"/>
      <text x="67" y="24" fill="#065f46" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. NO-CODE CANVAS</text>
      <text x="67" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">9 Modular Input Types</text>

      <path d="M125 30 L145 30" stroke="#059669" stroke-width="2"/>

      <rect x="145" y="8" width="115" height="44" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="202" y="24" fill="#1e40af" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. JSON SCHEMA</text>
      <text x="202" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Dynamic Serialization</text>

      <path d="M260 30 L280 30" stroke="#059669" stroke-width="2"/>

      <rect x="280" y="8" width="115" height="44" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
      <text x="337" y="24" fill="#92400e" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. PUBLIC RUNNER</text>
      <text x="337" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">/f/[id] (15KB Bundle)</text>

      <path d="M395 30 L415 30" stroke="#059669" stroke-width="2"/>

      <rect x="415" y="8" width="115" height="44" rx="5" fill="#faf5ff" stroke="#a855f7" stroke-width="1.2"/>
      <text x="472" y="24" fill="#6b21a8" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">4. OFFLINE QUEUE</text>
      <text x="472" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">IndexedDB Auto-Sync</text>

      <path d="M530 30 L550 30" stroke="#059669" stroke-width="2"/>

      <rect x="550" y="8" width="100" height="44" rx="5" fill="#f8fafc" stroke="#334155" stroke-width="1.2"/>
      <text x="600" y="24" fill="#0f172a" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">5. EXCEL EXPORT</text>
      <text x="600" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">SPSS Codebook .xlsx</text>
    </svg>
  </div>"""

if fig63_marker in content:
    content = content.replace(fig63_marker, fig63_content)
    print("Figure 6.3 inserted.")
else:
    print("Warning: fig63_marker not found")

# 8. Add Figure 6.4 (Expo Mobile Admin)
fig64_marker = """  <h2>6.6 Mobile Admin Application (Expo SDK 54 & React Native)</h2>
  <p>Located in <code>apps/admin-mobile</code>, the mobile app provides administrators with a fast, portable command center on Android and iOS:</p>"""

fig64_content = """  <h2>6.6 Mobile Admin Application (Expo SDK 54 & React Native)</h2>
  <p>Located in <code>apps/admin-mobile</code>, the mobile app provides administrators with a fast, portable command center on Android and iOS:</p>

  <!-- FIGURE 6.4: EXPO MOBILE ADMIN & PUSH SYNC -->
  <div class="diagram-container">
    <div class="diagram-title">Figure 6.4 — React Native / Expo Mobile Admin & Real-Time Push Sync</div>
    <svg width="100%" height="60" viewBox="0 0 660 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="115" height="44" rx="5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"/>
      <text x="67" y="24" fill="#1e40af" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. EXPO SDK 54</text>
      <text x="67" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Android & iOS Native</text>

      <path d="M125 30 L145 30" stroke="#059669" stroke-width="2"/>

      <rect x="145" y="8" width="115" height="44" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
      <text x="202" y="24" fill="#92400e" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. SECURE STORE</text>
      <text x="202" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Hardware Keystore JWT</text>

      <path d="M260 30 L280 30" stroke="#059669" stroke-width="2"/>

      <rect x="280" y="8" width="115" height="44" rx="5" fill="#faf5ff" stroke="#a855f7" stroke-width="1.2"/>
      <text x="337" y="24" fill="#6b21a8" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. PUSH ALERTS</text>
      <text x="337" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Fraud / Flagged Studies</text>

      <path d="M395 30 L415 30" stroke="#059669" stroke-width="2"/>

      <rect x="415" y="8" width="115" height="44" rx="5" fill="#ecfdf5" stroke="#10b981" stroke-width="1.2"/>
      <text x="472" y="24" fill="#065f46" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">4. 1-TAP APPROVAL</text>
      <text x="472" y="38" fill="#334155" font-size="5.8" font-family="sans-serif" text-anchor="middle">Telebirr & CBE Payouts</text>

      <path d="M530 30 L550 30" stroke="#059669" stroke-width="2"/>

      <rect x="550" y="8" width="100" height="44" rx="5" fill="#f0fdf4" stroke="#059669" stroke-width="1.2"/>
      <text x="600" y="24" fill="#047857" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">5. REAL-TIME DISPATCH</text>
      <text x="600" y="38" fill="#059669" font-size="5.8" font-family="sans-serif" text-anchor="middle">Instant ETB Settlement</text>
    </svg>
  </div>"""

if fig64_marker in content:
    content = content.replace(fig64_marker, fig64_content)
    print("Figure 6.4 inserted.")
else:
    print("Warning: fig64_marker not found")

with open(script_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated generate_master_technical_manual_pdf.ts with PERN breakdown and all figures!")
