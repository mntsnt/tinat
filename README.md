# [Tinat](https://tinat.org/)

A modern, AI-powered health research and clinical data ecosystem that connects researchers with verified participants, coordinates field data collection, and streamlines ethical medical research in Africa.

## Features

- **Smart Study Builder** – Create structured multi-format health questionnaires, clinical surveys, and IRB-compliant protocols.
- **Verified Participant Network** – Recruit pre-screened and Fayda ID-verified contributors for clinical and epidemiological research.
- **Field Data Collection** – Deploy and monitor authorized enumerators with offline session storage, draft saving, and audit trails.
- **Context-Aware AI Analysis** – Synthesize responses, detect anomalies, analyze qualitative feedback, and interact with an AI research assistant powered by Google Gemini.
- **Data Visualization Studio** – Generate real-time statistical distributions, cross-tabulations, and demographic charts.
- **Save & Bookmark Studies** – Like, bookmark, and follow active health studies for quick reference.
- **Discussions & Feedback** – Comment and participate in threaded academic discussions on study findings and methodologies.
- **Public Profile Viewing** – View detailed profiles of researchers, investigators, and community participants across all studies.
- **Tinat Credits (TC) & Wallet** – Automated and transparent participant compensation integrated with Chapa payments.
- **Export Options** – Download datasets in CSV, Excel, and structured formats for SPSS, Stata, R, and Python.
- **Ethics & Consent Governance** – Built-in digital informed consent gates, participant withdrawal management, and institutional ethics oversight.

## Technologies Used

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers, PostgreSQL, Prisma ORM
- **AI**: Google Gemini API
- **Authentication**: JWT (Jose), Fayda National Digital ID, Google OAuth
- **Payments**: Chapa Payment Gateway

## Self Hosting Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/mntsnt/tinat.git
   cd tinat/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Refer to `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your PostgreSQL `DATABASE_URL`, `AUTH_SECRET`, and `GEMINI_API_KEY`.

4. **Initialize database schema**
   ```bash
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Contribute

We welcome contributions from the community! Follow these steps to contribute:

1. **Fork the Repository**: Fork the Tinat repository to your GitHub account.
2. **Make Changes**: Create a new branch, make your changes, and commit them to your branch.
3. **Create a Pull Request**: Once your changes are ready, create a detailed pull request (PR) explaining the changes you've made.
4. **Review and Iterate**: Collaborate with the maintainers to review and iterate on your changes until they are ready to be merged.
5. **That's it!**: Can't wait to see the wonders you'll be doing.

For more detailed guidelines on contributing, please refer to our contribution guidelines.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

Have questions or suggestions? Feel free to open an issue or reach out to our team.
