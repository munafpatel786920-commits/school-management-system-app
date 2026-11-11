# Activation Key Based Customer Registration & Permanent Login System

A multi-tenant licensing and activation system for VidyaVerse SaaS that empowers the Super Admin to issue one-time activation keys, enables customers to register their organization/school and set credentials via a customer activation workflow, and enforces permanent customer logins with automated license expiry validation.

## User Review & Critical Decisions

> [!IMPORTANT]
> The implementation preserves all existing database schema, documents, and existing tenant isolation rules without modifying or deleting live data.

- **Confirmed Decision 1 (Key Generator)**: Automated 16-character alphanumeric key generation (`XXXX-XXXX-XXXX-XXXX`) with plan selection (Basic, Standard, Premium, Lifetime), custom valid-for duration (e.g. 30 days, 365 days), and student limit controls in Super Admin.
- **Confirmed Decision 2 (Customer Activation Page)**: Dedicated `/activate` page featuring key validation, customer user credential registration (Email/Password with retype verification), school profile initialization, and instant single-step account setup.
- **Confirmed Decision 3 (License Expiry & Blocking)**: Automated verification upon login against Firestore `/schools/{schoolId}` status and `expiryDate`. Expired or disabled school accounts are blocked with a clear dialog directing the customer to support for renewal.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades VidyaVerse Global SaaS from manual tenant seeding to a self-service Customer Onboarding & Licensing engine. Super Admin generates cryptographic activation keys tied to specific subscription plans. Customers redeem these keys at `/activate`, create their administrative login credentials, and immediately access their isolated school dashboard.
- **Target Audience / Persona**:
  1. *Super Admin*: Generates keys, manages tenant licenses, sets expiration dates, and monitors platform activity.
  2. *School Admin / Customers*: Redeems key, sets password, logs in permanently, and manages school staff, students, fees, and academics.
- **Key Value**: Provides an automated sales-to-onboarding conversion loop, robust tenant data isolation, zero manual credential distribution, and automated license enforcement.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Super Admin Key Generation Flow**:
   - Super Admin navigates to `/super-admin/keys` (or Activation Keys tab under `/super-admin`).
   - Clicks **"Generate New Activation Key"**.
   - Selects Subscription Plan (e.g., Standard Plan - 500 Students), validity period (e.g., 365 days), and optional Customer Name tag.
   - System generates a unique 16-character key (`VV-2026-89AB-CDEF`), creates a document in `/activation_keys/{keyId}`, and offers one-click copy and key status tracking (`unused`, `redeemed`, `revoked`).

2. **Customer Activation Flow (`/activate`)**:
   - Customer opens `/activate` on any browser.
   - **Step 1: Key Verification**: Input activation key string. System validates key availability in `/activation_keys`.
   - **Step 2: Credential & School Registration**: Customer provides School Name, Admin Name, Admin Email, Password, and Retype Password.
   - **Step 3: Atomic Onboarding**: Creates Firebase Auth user account, initializes `/schools/{schoolId}` tenant doc with plan settings & calculated expiry date, updates key status to `redeemed`, writes `/users/{userId}` mapping, and redirects directly to `/dashboard`.

3. **Customer Login & License Enforcement Flow (`/login`)**:
   - Customer enters Email and Password.
   - Authentication succeeds against Firebase Auth.
   - System loads `/users/{uid}` and associated `/schools/{schoolId}`.
   - **Status & Expiry Verification**:
     - If `school.status === 'disabled'`, block login with "Account Suspended by Platform Admin".
     - If `school.expiryDate` is past current date, auto-update `school.status = 'expired'` and block login with "License Expired on [Date]. Contact support for key renewal."
   - If active & valid, grants full dashboard access.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Activation Keys Collection Strategy**
  - *Chosen Approach*: Dedicated top-level Firestore collection `/activation_keys/{keyId}` where `keyId` or `keyHash` stores key metadata (`key`, `planId`, `durationDays`, `status`, `redeemedBy`, `createdAt`, `redeemedAt`).
  - *Why*: Allows independent indexing, fast key lookup without scanning schools, clean audit logging, and bulk key management.

- **Decision 2: Atomic Customer Registration**
  - *Chosen Approach*: Client-side Firebase Auth creation paired with Firestore `writeBatch` for atomic writing of `/users/{uid}`, `/schools/{schoolId}`, and `/activation_keys/{keyId}` status update.
  - *Why*: Ensures zero orphaned records if registration is interrupted, without requiring complex backend server infrastructure.

- **Decision 3: Multi-Tenant Data Isolation Enforcement**
  - *Chosen Approach*: Preserve existing `schoolId` tagging on all operational collections (`students`, `teachers`, `classes`, `fees`, `expenses`, `attendance`) paired with strict `schoolId` filtering in React `DataContext` and `SchoolProfileContext`.
  - *Why*: Guarantees complete data separation per customer without breaking existing app components.

---

## 4. Technical Architecture & System Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SUPER ADMIN PANEL                                      │
│  [/super-admin/keys] ──> Generate Key ──> Write to /activation_keys (status: unused)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                  Issues Key to Customer
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CUSTOMER ACTIVATION PAGE                                 │
│  [/activate] ──> 1. Validate Key  ──> 2. Register Credentials  ──> 3. Atomic Batch:    │
│                  - Check Firestore     - Create Firebase Auth user   - Set /schools    │
│                  - Verify 'unused'     - Match Retype Password       - Set /users      │
│                                                                      - Update key doc  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                     Redirect to Login
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PERMANENT CUSTOMER LOGIN                                  │
│  [/login] ──> Firebase Auth ──> Fetch /users/{uid} ──> Check /schools/{schoolId}       │
│                                                        - Verify status === 'active'    │
│                                                        - Verify now < expiryDate       │
│                                                        - Grant /dashboard Session      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete List of Files to Create or Modify

1. **`/src/lib/types.ts` (Modify)**
   - Add `ActivationKey` TypeScript interface (`id`, `key`, `planId`, `planName`, `durationDays`, `studentLimit`, `status: 'unused' | 'redeemed' | 'revoked'`, `customerName`, `createdAt`, `redeemedByUid`, `redeemedByEmail`, `redeemedAt`).
   - Update `School` interface to explicitly include `activationKeyId` and `activationDate`.

2. **`/src/app/(app)/super-admin/keys/page.tsx` (Create)**
   - Super Admin Key Generator UI: Dashboard table displaying all activation keys with search/status filters, key copying, key revocation action, and "Generate Key" modal dialog.

3. **`/src/app/(app)/super-admin/page.tsx` (Modify)**
   - Add quick-navigation tile and metric card for Activation Keys (Total Keys, Active Unused Keys, Redeemed Keys).

4. **`/src/app/activate/page.tsx` (Create)**
   - Public Customer Activation Page with step-by-step UI:
     - Form input for 16-character Activation Key with instant validation.
     - School details input (School Name, Education Board, Contact Phone).
     - Account Administrator setup (Full Name, Email Address, Password, Retype Password validation).
     - Atomic registration execution & instant redirect to login/dashboard.

5. **`/src/app/login/page.tsx` (Modify)**
   - Enhance login flow to check license expiry dates against `new Date()`.
   - Auto-mark expired schools as `expired` status in Firestore.
   - Add direct "Have an Activation Key? Activate Account" link directing customers to `/activate`.

6. **`/firestore.rules` (Modify)**
   - Add security rules match block for `/activation_keys/{keyId}` allowing public read for valid key verification during activation, write for Super Admin, and single-time update during redemption.

7. **`/firebase-blueprint.json` (Modify)**
   - Register `ActivationKey` entity schema and `/activation_keys/{keyId}` collection path to keep project schema reference in sync.

---

## Verification & Safety Guarantees

- **Data Integrity**: Existing `/schools`, `/users`, and operational student/fee records remain untouched.
- **Single-Use Key Guarantee**: Key redemption checks `status === 'unused'` and atomically updates status to `'redeemed'` during registration.
- **Build Verification**: Run `compile_applet` and `lint_applet` to confirm zero compilation or TypeScript errors.
