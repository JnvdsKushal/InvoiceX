# InvoiceX
### Blockchain-Backed Invoice Financing Platform for MSMEs

InvoiceX is a fintech platform designed to help Micro, Small and Medium Enterprises (MSMEs) access working capital by connecting suppliers, buyers, and lenders through a structured invoice financing workflow.

The platform aims to improve transparency, traceability, and operational efficiency throughout the invoice lifecycle using a modern web architecture, secure backend APIs, PostgreSQL, and a Rust-based hash-linked ledger for tamper-evident event history.

> **Project status:** Under active development. Core backend foundations, invoice workflow groundwork, and the initial Rust ledger are implemented. Full document processing, email verification, lender financing, settlement, and ledger-service integration remain in development.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Complete Workflow](#complete-workflow)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [How the Ledger Works](#how-the-ledger-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Backend API](#backend-api)
- [Database Design](#database-design)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Development Roadmap](#development-roadmap)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Small businesses frequently deliver goods and services before receiving payment. When customers have payment terms of 30, 60, or 90 days, suppliers can experience working-capital shortages even when they have valid outstanding invoices.

Invoice financing allows eligible businesses to seek financing against qualifying unpaid invoices rather than waiting for the entire payment cycle to finish.

InvoiceX is being developed to support this process through a centralized platform where:

- Suppliers create and submit invoices.
- Buyers verify transactions and resolve discrepancies.
- Eligible invoices can be considered for financing.
- Lenders evaluate invoices and provide financing offers.
- Funding, repayment, and settlement can be tracked.
- Important events can be recorded in a tamper-evident hash-linked ledger.

The project combines conventional database-backed business workflows with a separate ledger component designed to improve the integrity and traceability of historical records.

## Problem Statement

MSMEs face several challenges when managing unpaid invoices and seeking financing.

**Delayed payments:** Suppliers may wait weeks or months to receive payment for completed work.

**Working-capital constraints:** Businesses need funds for salaries, inventory, raw materials, and daily operations while waiting for customers to pay.

**Invoice fraud and duplication:** Weak verification processes can expose lenders to fraudulent invoices, altered documents, or invoices presented for financing more than once.

**Fragmented records:** Invoice details, buyer confirmations, financing offers, and payment records may be maintained in separate systems.

**Limited traceability:** Without reliable audit records, it can be difficult to reconstruct who performed an action and when it occurred.

## Our Solution

InvoiceX aims to bring invoice submission, verification, financing workflows, and event tracking into one application.

The platform combines:

- Role-based access for suppliers, buyers, lenders, and platform administrators.
- Structured invoice records and controlled status transitions.
- A relational database for operational data.
- A planned document-processing pipeline for digital and scanned invoices.
- A separate Rust-based hash-linked ledger for detecting unauthorized changes to recorded event history.
- A planned financing workflow covering offers, funding, repayment, and settlement.

InvoiceX is not intended to replace a bank or regulated lender. Actual financing depends on lender approval, contractual arrangements, and applicable regulations.

---

## Key Features

### 1. Organization-Based Access

The application is designed for multiple organizations, with users assigned roles and associated with an organization.

Planned organization types include:

- MSME / Supplier
- Buyer
- Bank / NBFC / Lender
- Platform

Organization status and user permissions are intended to control access to protected workflows.

### 2. Invoice Management

The invoice backend includes a model for storing key transaction information, including:

- Invoice number
- Supplier and buyer organizations
- Issue date and due date
- Invoice amount and currency
- Purchase-order reference and description
- Current workflow status
- Record version and timestamps

The backend includes basic invoice creation, listing, detail retrieval, and submission functionality.

### 3. Invoice Status Management

The invoice model supports statuses for different stages of the intended lifecycle, including:

- `DRAFT`
- `PENDING_VERIFICATION`
- `NEEDS_CLARIFICATION`
- `VERIFIED`
- `REJECTED`
- `DISPUTED`
- `ELIGIBLE_FOR_FINANCING`
- `OFFER_PENDING`
- `OFFER_ACCEPTED`
- `FUNDING_PENDING`
- `FUNDED`
- `REPAYMENT_PENDING`
- `SETTLED`
- `CANCELLED`

The existence of a status in the model does not mean every transition or associated workflow has been implemented.

### 4. Document Processing — Planned

The intended document workflow will support digitally generated invoice PDFs and scanned invoice documents.

Planned capabilities include:

- Secure document uploads
- PDF text extraction
- Optical Character Recognition (OCR) for scanned documents
- Extraction of invoice numbers, dates, amounts, and business details
- Review and correction of extracted information
- Validation against invoice records and supporting evidence

OCR will help extract information; it will not independently establish that an invoice is authentic.

### 5. Invoice Verification — Planned

The intended verification workflow will allow buyers or authorized verifiers to confirm transaction details, request clarification, or dispute an invoice.

Verification decisions should be associated with the responsible user, timestamp, and relevant evidence.

### 6. Invoice Financing — Planned

The intended financing workflow will allow eligible invoices to be considered by participating lenders.

Planned capabilities include:

- Financing eligibility checks
- Lender offer creation
- Comparison of financing terms
- Offer acceptance
- Funding status tracking
- Repayment reconciliation
- Final settlement

Financing offers, disbursements, and repayments must reflect actual approved terms and confirmed financial events.

### 7. Hash-Linked Ledger

The Rust ledger foundation supports hash-linked records and integrity validation.

Its existing foundation includes:

- Genesis record initialization
- Event addition
- Hash-chain validation
- Persistence and reload
- Corruption detection

Integration between Django and the Rust ledger service remains under development.

---

## User Roles

| Role | Responsibilities |
|---|---|
| Supplier / MSME | Create invoices, submit supporting details, track verification, and review financing offers |
| Buyer | Confirm transaction details, verify invoices, request clarification, or dispute discrepancies |
| Lender | Evaluate eligible invoices, issue offers, and manage financing-related records |
| Platform Super Admin | Manage organizations, review registrations, and administer platform access |

Role-based permissions and organization-level data isolation are important security requirements for the complete implementation.

---

## Complete Workflow

The intended end-to-end workflow is as follows:

### Step 1: Registration

A user submits account details and selects an organization type.

The backend validates the request and creates the organization and user records. Email verification and organization approval are planned before the full production access workflow is enabled.

### Step 2: Invoice Creation

The supplier creates an invoice containing the buyer, invoice number, issue date, due date, amount, and other relevant details.

The invoice is initially saved as a draft.

### Step 3: Invoice Submission

The supplier reviews the draft and submits it for verification.

The implemented submission workflow validates the invoice state and uses a database transaction and version checking to help prevent conflicting updates.

A valid draft transitions to `PENDING_VERIFICATION`.

### Step 4: Document and Data Validation

The planned document-processing service extracts invoice information from uploaded files and allows the supplier to review the results.

The backend validates the invoice fields and applies business rules.

### Step 5: Buyer Verification

The buyer reviews the invoice and supporting evidence.

Possible outcomes include verification, clarification requests, or disputes.

### Step 6: Financing Eligibility

After the necessary verification steps, the platform evaluates whether the invoice satisfies the applicable financing rules.

Eligibility does not guarantee lender approval.

### Step 7: Financing Offers

Participating lenders evaluate eligible invoices and propose financing terms.

The supplier reviews and accepts an offer when appropriate.

### Step 8: Funding

Funding proceeds according to the approved financing agreement.

The platform should record funding only after the relevant disbursement is confirmed.

### Step 9: Repayment and Settlement

Payments are reconciled against the financing obligation. Once all applicable obligations have been satisfied, the transaction can be marked as settled.

### Step 10: Event History

Important events can be recorded in the hash-linked ledger to provide a tamper-evident history of the workflow.

The complete Django-to-Rust ledger integration is still under development.

---

## System Architecture

InvoiceX uses a modular architecture with a React frontend, Django backend, PostgreSQL database, and a separate Rust ledger component.

```mermaid
flowchart TD
    U[Suppliers, Buyers, Lenders, Admins]
    FE[React + TypeScript Frontend]
    API[Django REST Framework API]
    DB[(PostgreSQL - Neon)]
    LEDGER[Rust Hash-Linked Ledger]
    DOCS[Document Storage and OCR - Planned]
    FIN[Financing and Settlement - Planned]

    U --> FE
    FE -->|REST API / JSON| API
    API <--> DB
    API -.->|Planned integration| LEDGER
    API -.-> DOCS
    API -.-> FIN
```

### Frontend

The frontend provides the user interface for registration, invoice management, dashboards, and other application workflows.

**Technologies:** React, TypeScript, Vite, and Tailwind CSS.

### Backend

The backend manages API requests, business logic, invoice records, and access control.

**Technologies:** Python, Django, Django REST Framework, and JWT-related authentication dependencies.

### Database

PostgreSQL stores the application's relational data.

The project uses Neon as its PostgreSQL hosting provider.

### Ledger

The separate Rust component provides hash-linked event records and integrity validation.

It is designed as a ledger foundation, not a decentralized consensus network.

### Document Processing

Document storage, PDF extraction, and OCR are planned components and are not yet part of the verified end-to-end workflow.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Python, Django |
| API | Django REST Framework |
| Authentication foundation | Custom Django user model and JWT dependencies |
| Database | PostgreSQL |
| Database hosting | Neon |
| Ledger | Rust |
| Ledger design | Hash-linked event records |
| Version control | Git and GitHub |

---

## How the Ledger Works

The ledger uses cryptographic hashing to link records together.

Each record contains event information and a reference to the preceding record's hash.

Conceptually:

```text
Genesis Record
      |
      v
Event A
Hash: H(A)
      |
      v
Event B
Previous Hash: H(A)
Hash: H(B)
      |
      v
Event C
Previous Hash: H(B)
Hash: H(C)
```

If a record is modified without updating the subsequent chain, the hash validation process can detect the inconsistency.

### Why use a ledger?

The ledger provides an additional integrity mechanism for important historical events.

It complements PostgreSQL rather than replacing it:

- PostgreSQL manages operational records and current workflow state.
- The ledger maintains a separate hash-linked history of recorded events.

### What the ledger does not guarantee

A hash-linked ledger does not independently prove that an invoice is genuine or that a financial transaction actually occurred.

If an attacker can rewrite the entire ledger and recompute every hash, a basic hash chain may not expose the rewrite. Stronger assurance requires controls such as restricted write access, digital signatures, independently retained checkpoints, or independently operated participants.

The current implementation should therefore be described as a **tamper-evident hash-linked ledger foundation**, not as a fully decentralized blockchain network.

---

## Project Structure

The repository is organized into separate frontend, backend, and ledger components.

```text
InvoiceX/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.local
│   └── vite.config.ts
│
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── test_settings.py
│   ├── accounts/
│   ├── organizations/
│   ├── invoices/
│   ├── financing/
│   ├── audit/
│   ├── ledger/
│   ├── manage.py
│   └── .env
│
├── blockchain/
│   ├── Cargo.toml
│   └── src/
│
├── .gitignore
└── README.md
```

*This is the intended high-level layout. Individual files may differ as development progresses.*

---

## Getting Started

### Prerequisites

Install the following tools before running the project:

- Git
- Node.js and npm
- Python 3.11 or another Python version compatible with the installed dependencies
- PostgreSQL access, either locally or through Neon
- Rust and Cargo for working on the ledger component

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd InvoiceX
```

Replace the placeholder with your actual GitHub repository URL.

### 2. Configure the backend

Open a terminal and navigate to the backend:

```bash
cd backend
```

Create and activate a virtual environment on Windows:

```cmd
python -m venv .venv
.venv\Scripts\activate
```

Install the project's backend dependencies.

If `requirements.txt` exists:

```cmd
pip install -r requirements.txt
```

If your repository does not yet contain a dependency file, create one from your verified environment before sharing the project.

Create a `backend/.env` file using the example in the [Environment Configuration](#environment-configuration) section.

### 3. Apply database migrations

After configuring a valid database connection:

```cmd
python manage.py check
python manage.py migrate
```

The migrations create or update the required application tables.

### 4. Create a Django administrator

```cmd
python manage.py createsuperuser
```

Follow the prompts to create an administrator account.

### 5. Start the backend

```cmd
python manage.py runserver
```

The backend will normally be available at:

```text
http://127.0.0.1:8000/
```

The health endpoint is:

```text
http://127.0.0.1:8000/api/v1/health/
```

The Django Admin interface is:

```text
http://127.0.0.1:8000/admin/
```

### 6. Configure and start the frontend

Open a second terminal:

```cmd
cd frontend
npm install
```

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_MOCK_MODE=false
```

Start Vite:

```cmd
npm run dev
```

Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173/
```

The frontend environment variables are public configuration values. Never put database credentials, private keys, or backend secrets in frontend environment variables.

### 7. Run the Rust ledger

Open another terminal:

```cmd
cd blockchain
cargo test
```

This runs the available Rust tests.

To start the ledger, inspect the current Rust project's executable entry point and run the appropriate Cargo command, commonly:

```cmd
cargo run
```

**Note:** The existing Rust foundation is not yet a complete HTTP service connected to Django. Running the ledger does not automatically enable end-to-end ledger integration.

---

## Environment Configuration

### Backend environment variables

Create `backend/.env` locally:

```dotenv
DJANGO_SECRET_KEY=replace-with-a-strong-random-secret
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

LEDGER_SERVICE_URL=http://127.0.0.1:8081
MAX_UPLOAD_SIZE_MB=10
```

Replace the database URL with the connection string from your own Neon project.

Keep the secret key, database credentials, and other private configuration out of Git.

`LEDGER_SERVICE_URL` is a configuration value for the intended service integration. Its presence does not mean the Rust HTTP service is already running.

### Frontend environment variables

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_MOCK_MODE=false
```

Restart the Vite server after changing environment variables.

The frontend must not contain server-side credentials.

---

## Backend API

The following endpoints are part of the current backend foundation.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/health/` | Backend health check |
| `POST` | `/api/v1/auth/register/` | Register a user and organization |
| `GET` | `/api/v1/invoices/` | List invoices visible to the authenticated user |
| `POST` | `/api/v1/invoices/` | Create an invoice |
| `GET` | `/api/v1/invoices/{id}/` | Retrieve an invoice |
| `POST` | `/api/v1/invoices/{id}/submit` | Submit a draft invoice for verification |

Invoice endpoints require authentication according to the backend's configured permissions.

The endpoint inventory may evolve as new features are implemented. Email verification, organization approval, lender offers, funding, repayment, and ledger API endpoints should not be considered available until implemented and tested.

### Example: Register a user

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Supplier",
    "email": "supplier@example.com",
    "organizationName": "Example Components",
    "organizationType": "MSME",
    "password": "ReplaceWithAStrongPassword123!"
  }'
```

The registration API accepts these organization types:

- `MSME`
- `BUYER`
- `LENDER`

A successful response includes the created user's identifier, email, name, role, and status.

The current registration flow creates the user and organization with pending statuses and sets the user inactive. Email verification and organization approval have not yet been completed.

Use a test email address that is not already registered in your database.

---

## Database Design

The backend uses Django models to represent the application's core entities.

### Organizations

An organization represents a business or platform entity.

The model includes:

- UUID identifier
- Organization name
- Organization type
- Registration identifier
- Organization status
- Creation timestamp

### Users

The custom user model associates each user with an organization.

It includes:

- UUID identifier
- Name and unique email
- Password hash managed by Django
- Organization relationship
- Role and status
- Creation timestamp

### Invoices

The invoice model associates supplier and buyer organizations with an invoice record.

It includes:

- UUID identifier
- Invoice number
- Issue and due dates
- Amount and currency
- Purchase-order reference and description
- Workflow status
- Version number
- Creation and update timestamps

The database enforces relevant invoice constraints, including positive amounts, valid date ordering, and uniqueness of invoice numbers within a supplier organization.

Additional financing, verification, audit, and ledger relationships will be developed as the corresponding workflows are implemented.

---

## Security Considerations

InvoiceX is intended to handle sensitive business and financial information. Security must be considered throughout development.

Current foundations and intended protections include:

- Password hashing through Django's authentication framework
- Server-side input validation
- Authentication and permission enforcement
- Organization-scoped data access
- Controlled invoice status transitions
- Transactional updates and version checks for invoice submission
- Restricted access to sensitive documents
- Tamper-evident records for important historical events

Before production use, the platform also requires thorough security testing, including:

- Email verification and account lifecycle controls
- Strong authentication and token lifecycle management
- Authorization tests for every role and organization
- Secure document storage and file validation
- Rate limiting and abuse protection
- Secret management and production deployment hardening
- Audit logging and monitoring
- Payment and financing reconciliation controls
- Independent security review

The development configuration must not be used as a production configuration without appropriate hardening.

---

## Testing

### Django configuration checks

```cmd
cd backend
python manage.py check
```

### Invoice backend tests

The project includes a separate test configuration intended to use an in-memory SQLite database:

```cmd
python manage.py test invoices --settings=config.test_settings
```

This helps keep application tests isolated from the Neon development database.

SQLite-based tests do not prove PostgreSQL-specific concurrency behavior. Critical transaction and locking behavior should also be tested against PostgreSQL.

### Rust ledger tests

```cmd
cd blockchain
cargo test
```

The ledger foundation has previously passed five tests covering core ledger operations and integrity checks.

### Frontend checks

Run the scripts available in `frontend/package.json`. Common commands, when defined, include:

```cmd
npm run lint
npm run build
```

A passing build verifies compilation, not the correctness of every user workflow.

End-to-end tests across registration, invoice submission, verification, financing, settlement, and ledger recording remain necessary.

---

## Development Roadmap

### Phase 1 — Core Foundation

- [x] React + TypeScript frontend foundation
- [x] Django backend foundation
- [x] PostgreSQL / Neon configuration
- [x] Custom user and organization models
- [x] Registration API foundation
- [x] Invoice model and basic API endpoints
- [x] Invoice submission transition and version checking
- [x] Rust hash-linked ledger foundation

### Phase 2 — Authentication and Organizations

- [ ] Resolve and test frontend registration networking
- [ ] Implement email verification
- [ ] Implement organization review and approval
- [ ] Complete real login and token lifecycle handling
- [ ] Enforce role-based access across protected workflows
- [ ] Add comprehensive authentication and authorization tests

### Phase 3 — Invoice Documents and Verification

- [ ] Implement secure document uploads
- [ ] Add PDF text extraction
- [ ] Add OCR for scanned invoices
- [ ] Build supplier review of extracted invoice fields
- [ ] Implement buyer verification and dispute handling
- [ ] Add duplicate-invoice and financing checks

### Phase 4 — Financing Workflows

- [ ] Implement financing eligibility rules
- [ ] Implement lender offers
- [ ] Implement offer acceptance
- [ ] Record confirmed funding events
- [ ] Implement repayment reconciliation
- [ ] Implement settlement workflows

### Phase 5 — Ledger Integration

- [ ] Build the Rust ledger service API
- [ ] Connect Django to the ledger service
- [ ] Record important invoice and financing events
- [ ] Implement failure handling and retry behavior
- [ ] Add independent integrity checks and audit checkpoints
- [ ] Test database and ledger consistency

### Phase 6 — Production Readiness

- [ ] Complete end-to-end tests
- [ ] Perform security and authorization reviews
- [ ] Configure production secrets and deployment
- [ ] Add observability and error monitoring
- [ ] Integrate appropriate payment and verification providers
- [ ] Review legal and regulatory requirements for the intended operating model

---

## Limitations

InvoiceX is currently a development project.

The following limitations should be considered:

- The complete end-to-end invoice financing workflow is not yet implemented.
- Email verification and organization approval remain under development.
- The frontend registration connection requires integration testing.
- Document upload, PDF extraction, and OCR are planned features.
- Lender offers, funding, repayment, and settlement require implementation.
- The Rust ledger is a hash-linked ledger foundation rather than a decentralized consensus network.
- Django-to-Rust ledger integration is not complete.
- The project is not yet a production-ready financial service.

The application should not be used to make real financing decisions or process real financial transactions until the required functionality, security controls, operational procedures, and regulatory requirements have been addressed.

---

## Contributing

Contributions, suggestions, and issue reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Add or update tests.
5. Run the relevant checks.
6. Submit a pull request describing the change.

Please avoid committing credentials, private business documents, real customer information, or production database connection strings.

---

## License

No license has been specified yet.

Before publishing the repository for reuse, choose an appropriate license and add a `LICENSE` file. Until then, do not assume that the code is available for unrestricted reuse.

---

## Project Vision

InvoiceX aims to make invoice financing more transparent and traceable by combining structured business workflows with secure data management and tamper-evident event history.

By bringing suppliers, buyers, and lenders into a common workflow, the project seeks to help MSMEs manage outstanding invoices and pursue working-capital financing more efficiently.

**InvoiceX — Making invoice financing more transparent, traceable, and accessible.**