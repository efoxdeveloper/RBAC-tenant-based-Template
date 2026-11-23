# Support CRM — Module-wise Pages & Functionality

**Version:** 1.0 · **Updated:** 23 November 2026 · **Project:** Multi-Tenant Service CRM · **Owner:** Efox Technologies

## Purpose

This file is a **screen-and-feature blueprint** for developers, UI/UX designers and QA. It explains **which module contains which pages, which user opens them, and exactly what users can do there**. The platform has three role-aware interfaces: **Super Admin**, **Tenant Admin**, and **Technician Mobile App**. The platform supports multi-branch shops, home services, workshop repairs, serial-tracked spare parts, paid/warranty/AMC jobs, revisits, payments and attendance.

**Legend:** `SA` = Super Admin; `TA` = Tenant Admin; `DIS` = Dispatcher; `STORE` = Store Manager; `WS` = Workshop Staff; `FIN` = Finance; `TECH` = Technician. `List → Detail → Form` pages can be nested routes, dialogs or sheets; not every operation needs a standalone sidebar item.

## A. Shared Navigation Design

### Super Admin sidebar
1. Dashboard
2. Tenants → Tenant List, Create Tenant, Tenant Detail
3. SaaS Plans & Subscriptions
4. Feature Controls & Limits
5. Global Catalog & Default Templates
6. Platform Users & Roles
7. Usage & Platform Reports
8. Security, Audit & Support Access
9. Platform Settings

### Tenant Admin main bottom bar (mobile)
`Home | Tickets | Inventory | Payments | Team`

### Tenant Admin sidebar (extra pages)
Dashboard; Service Tickets; Scheduling & Dispatch; Customers; Customer Products; Technicians & Attendance; Inventory; Revisits & Follow-ups; Workshop Repairs; Warranty Management; AMC Plans; Estimates & Payments; Reports; Masters & Configuration; Notifications; Company Settings.

### Technician main bottom bar
`Home | Jobs | Stock | Collections | Profile`

### Technician hamburger sidebar
Dashboard; My Attendance; My Jobs (Today, Upcoming, Pending, Completed); My Stock; Stock Requests; Parts Returns; My Collections; Payment History; Cash Settlements; Notifications; My Profile; Help & Logout.

**Core UX principle:** On a technician job, `Visit Check-In`, `Diagnosis`, `Add/Replace Part`, `Serial Number`, `Warranty/Paid`, `Charges`, `Estimate`, `Customer Approval`, `Payment`, `Revisit`, `Workshop Transfer`, `Final Testing`, and `Customer OTP` live **inside My Jobs → Job Details** as sections or steps. They are **not 12 independent sidebar screens**.

---

## Module 01 — Tenant Management
**Main roles:** SA · **Goal:** Create and operate independent customer organizations on one SaaS.

| Page / Screen | What the user can see or do |
|---|---|
| SaaS Dashboard | Active/trial/expired tenants, subscriptions, usage, alerts, signup trend and platform health. |
| Tenant List | Search/filter tenants by name, plan, status, expiry; view usage and quick actions. |
| Create Tenant | Enter business details, owner contact, tenant code/subdomain, timezone, currency; seed default roles/masters; send initial invite. |
| Tenant Detail | View company profile, branches, plan, employee counts, allowed features, usage, activity and audit; no cross-tenant operational editing by default. |
| Tenant Plan & Billing | Assign plan, trial, renewal date, quotas, payment state; suspend/reactivate under policy. |
| Feature & Limit Control | Enable/disable workshop/AMC/WhatsApp/reports and set employee/branch/storage limits. |

**Rules:** Strict tenant data isolation; subscription suspension must not delete data; every privileged change audited.

## Module 02 — Authentication & Role-Based Access
**Main roles:** All · **Goal:** Secure login and permission-aware UI.

| Page / Screen | What the user can see or do |
|---|---|
| Shared Login | Employee mobile/email + password/OTP (depending on configured method); tenant/shop branding when known. |
| Tenant Selector | For an employee belonging to more than one tenant, explicitly choose the active tenant. |
| Forgot / Reset Password | Request verification, reset password securely, show expiry/errors. |
| My Sessions / Security | View login sessions/devices, logout other devices, change password. |
| Roles List & Role Form (SA/TA) | Create/edit roles; select module, action and branch-scoped permissions. |
| Employee Access Assignment (TA) | Assign one or more roles, branches and active/inactive access to employee. |
| Access Denied / Session Expired | Clear non-leaky messaging with safe retry/login paths. |

**Rules:** Backend authorizes each API; never depend on hidden menu items for security; tenant-scoped membership enforced.

## Module 03 — Company & Branch Management
**Main roles:** TA · **Goal:** Configure a shop/service company and its locations.

| Page / Screen | What the user can see or do |
|---|---|
| Company Profile | Edit display/legal name, shop logo, email/phone, GST/tax identity, address and receipt branding. |
| Branch List / Add Branch | Add/edit branch name, code, contacts, hours, holidays and default service area. |
| Branch Detail | Assign employees, default rates, warehouse, workshop and coverage areas; view branch activity. |
| Warehouse & Workshop Locations | Create locations for stock and device repairs; configure capabilities, managers and working hours. |
| Service Areas & Zones | Configure PIN/area/zone coverage and which home-visit rate applies. |
| Company Settings | Timezone, currency, ticket-number prefix, invoice sequence and default policies. |

## Module 04 — Masters & Configuration
**Main roles:** TA (some global seeds from SA) · **Goal:** Provide tenant-specific dropdowns, rules and prices.

| Page / Screen | What the user can see or do |
|---|---|
| Product Masters → Categories | Add TV, AC, Refrigerator, Washing Machine, etc.; enable/disable. |
| Product Masters → Brands | Add Samsung, LG, Sony; reuse global brand entries or create tenant-specific ones. |
| Product Masters → Models | Add model with category, brand, code and specification. |
| Parts Masters → Part Categories | Maintain PCB, display, motor, bulb, capacitor and other classifications. |
| Parts Masters → Spare Parts / Add New Part | Add SKU, part name, category, compatible models, selling price, taxes, serialization, warranty and old-part collection rule. |
| Service Masters → Service Types | Define diagnosis, repair, installation, preventive maintenance, workshop service. |
| Service Masters → Complaint Types | Define customer problem labels by product (No Display, No Sound, Not Cooling). |
| Service Masters → Visit Outcomes & Reasons | Manage Revisit Required, Waiting for Part, Workshop Required, Customer Unavailable and permitted reasons/required fields. |
| Pricing Masters → Service / Labor Charges | Configure category/service-wise effective-dated labor and diagnostic rates. |
| Pricing Masters → Home Visit / Revisit | Configure area/zone rate, repeat-visit fee, no-show rules and waivers. |
| Pricing Masters → Workshop / Pickup | Configure workshop diagnosis, product pickup and delivery fee rules. |
| Coverage Masters → Warranty Rules | Set duration and covered parts/labor/visits/exclusions. |
| Coverage Masters → AMC Plans | Define amount, duration, benefits, usage quota, paid parts and renewal. |
| Other Masters → Locations / Payment Modes | Maintain stock location types and enabled receipt/payment methods. |

**Rules:** Global seeds do not overwrite tenant overrides; editing master pricing must not change previously approved estimates or historical invoices. Do not confuse part catalog entries with real serialized stock units.

## Module 05 — Customer Management
**Main roles:** TA, DIS · **Goal:** Maintain customer identity and service relationships.

| Page / Screen | What the user can see or do |
|---|---|
| Customer List | Search by phone/name, filters, outstanding summary, add customer action. |
| Add / Edit Customer | Name, mobile, alternate contact, email, address, service notes, communication consent. |
| Customer Detail | Tabs: Overview, Addresses, Products, Tickets, Payments, AMC/Warranties, Notes. |
| Customer Addresses | Add/edit home, office and alternate service addresses with landmarks. |
| Customer Service History | See past tickets, technician visits, replacements, invoices and pending cases. |
| Duplicate Review | Flag same mobile/near-duplicate profiles, review and safely merge with audit. |

**Rules:** Customers may request paid support without buying any item from this tenant.

## Module 06 — Customer Product Management
**Main roles:** TA, DIS, TECH (view/edit limited) · **Goal:** Link service and coverage to actual appliances.

| Page / Screen | What the user can see or do |
|---|---|
| Customer Products List | Filter by customer/category/brand/warranty, register new appliance. |
| Register Product | Customer, product category/model, serial number, purchase date, purchase source (`Our Shop` / `Outside`), seller and invoice upload. |
| Product Detail | Product identity, current location (home/workshop when relevant), past tickets, installed part serials and service history. |
| Product Coverage | Show original warranty, replacement-part service warranty, active AMC and eligibility notes. |
| Product Documents | Attach purchase invoice, warranty document and service images. |

## Module 07 — Service Ticket Management
**Main roles:** TA, DIS · **Goal:** Record, assign and resolve a customer complaint.

| Page / Screen | What the user can see or do |
|---|---|
| Ticket List | Search/filter by status, priority, customer, product, technician, branch, date, SLA; `+` in header to create. |
| Create Ticket | Select/add customer and product, complaint, notes, photos, address, priority, service type, preferred time and preliminary coverage. |
| Ticket Detail | Ticket number, status, customer, appliance, coverage, attachments, full visits timeline, estimates, payments and activity history. |
| Ticket Assignment | Select/replace technician, time slot, branch, skill and visit-specific instructions. |
| Ticket Timeline | Chronological status, visits, approvals, part requests, payments, workshop custody and comments. |
| Close / Cancel / Reopen | Controlled closure reasons: resolved, estimate declined, unrepairable, cancelled; reopen with audit. |
| Ticket Board / Queue | Group ticket cards by New, Assigned, In Progress, Waiting Part, Revisit, Workshop and Resolved. |

**Rule:** **One ticket can have multiple service visits**. An unresolved visit does not close the ticket.

## Module 08 — Scheduling & Dispatch
**Main roles:** TA, DIS · **Goal:** Get the right technician to the right customer.

| Page / Screen | What the user can see or do |
|---|---|
| Dispatch Dashboard | Unassigned tickets, technician availability, today's visits, delays and overlap warnings. |
| Scheduling Calendar | Day/week view; filter by technician, branch, area, priority and job status. |
| Assign Technician | Pick eligible engineer by skills, work hours, active status and route/service zone; add visit ETA. |
| Visit Detail | Customer address/map link, scheduled slot, assigned technician, notes, previous attempts and contact actions. |
| Reschedule / Reassign | Change slot or engineer with reason; notify customer and technician; preserve history. |
| Visit Queue | Today, Upcoming, Overdue, Cancelled, Completed and Revisit Pending. |

## Module 09 — Technician & Attendance
**Main roles:** TA, TECH · **Goal:** Employee duty and workforce tracking.

| Page / Screen | What the user can see or do |
|---|---|
| Technician List (TA) | Technicians with skills, branch, status, active jobs, present/on-duty flags and stock counts. |
| Technician Detail (TA) | Profile, skills, assignments, past jobs, attendance, collections, performance. |
| My Attendance (TECH) | Show **Start Duty / Check In** when not present today; show current duty time, **End Duty / Check Out**, workday history. |
| Attendance Register (TA) | Today/monthly check-in/out logs, absent/late entries, source/GPS evidence if enabled. |
| Attendance Correction Request | Technician or admin requests correction with reason, reviewer decision and audit. |
| Technician Performance | Jobs completed, response time, revisits, first-time-fix rate and collection summary. |

**Critical distinction:** Daily Duty Check-In marks employee present for the day. **Visit Check-In** confirms arrival at a particular customer job. They are separate records.

## Module 10 — Field Service Execution (Technician App)
**Main roles:** TECH · **Goal:** Finish assigned repairs at customer premises.

| Page / Screen | What the user can see or do |
|---|---|
| Technician Home | Duty status/Start Duty, today's jobs, upcoming jobs, stock summary, collections and urgent alerts. |
| My Jobs | Tabs: Today, Upcoming, Pending, Completed; search and status filter. |
| Job Details — Overview | Customer, address/call/navigation, appliance, complaint, job status, warranty/AMC, prior visit notes. |
| Job Details — Visit Check-In | Tap `Arrived / Check In`; save visit timestamp, optional GPS and current visit status. |
| Job Details — Diagnosis | Enter diagnosis, remarks, photographs and required work. |
| Job Details — Add / Replace Part | Part dropdown; choose `Add` or `Replace`; quantity; select/scan assigned serial; if replace, `Old Part Collected?` yes/no, old serial/photo. |
| Job Details — Warranty / Paid | For each line choose eligible warranty/AMC or paid, display applicable policy and DB-sourced part/service/home visit prices. |
| Job Details — Estimate | Itemized parts, labor, visit fee, tax/waiver and total; preview and share before work. |
| Job Details — Customer Approval | Record Approved/Declined manually in MVP with time/notes; future verified WhatsApp response. |
| Job Details — Payment | Collect cash/UPI/online; display paid, due and verified receipt state. |
| Job Details — Visit Outcome | Choose Resolved, Revisit Required, Waiting for Part, Workshop Required, Customer Not Available, etc. |
| Job Details — Final Testing | Complete relevant test checklist, repair notes and after-service photos. |
| Job Details — Completion OTP | Send SMS OTP to customer's phone; verify OTP server-side; complete a genuinely resolved job. |
| Job Details — Visit History | Previous visits, technician, diagnosis, parts, requests and customer approvals. |

**Rules:** Do not claim successful payment, installed stock, attendance or OTP verification before server confirmation. Show `Pending Sync` offline when relevant.

## Module 11 — Inventory & Spare Parts
**Main roles:** TA, STORE, TECH · **Goal:** Track stock by location, technician, SKU and serial.

| Page / Screen | What the user can see or do |
|---|---|
| Stock Dashboard (TA/STORE) | Total/low stock, warehouse-wise quantities, serialized stock, pending requests and returns. |
| Spare Parts List / Add New Part | Search SKUs, view part profile; create part master (see Module 04). |
| Stock Receiving | Receive purchased units, quantity, batch/serial, cost, invoice and target location. |
| Technician Stock Allocation | Select technician, part and particular serials; issue/transfer with acceptance event. |
| Technician-wise Inventory | View issued, available, installed, pending-return and damaged parts per person. |
| My Stock (TECH) | Available assigned parts, serials, used history and low-stock warning. |
| Request Parts (TECH) | Request part/quantity for a specific job or general replenishment; reason and urgency. |
| Inventory Requests (STORE) | Approve/reject, allocate, issue and communicate fulfillment ETA. |
| Stock Transfer | Transfer warehouse → technician, technician → technician, branch → branch, workshop → store with ledger event. |
| Part Return / Old Part Collection | Return unused parts, damaged inventory and removed old parts with condition/serial/photo. |
| Stock Ledger / Adjustment | View immutable transactions; authorized audit adjustments and reconciliation. |

**Example:** Mohit receives five serial-tracked bulbs. He installs one at a customer's home and records the exact new serial. Four remain available. Old part collection is tracked separately. **Requesting or reserving stock is not installing it.**

## Module 12 — Revisit & Follow-Up
**Main roles:** TA, DIS, TECH · **Goal:** Handle incomplete visits without losing the ticket.

| Page / Screen | What the user can see or do |
|---|---|
| Job Details — Revisit Request (TECH) | Choose outcome/reason (time insufficient, complex issue, customer request), notes and recommended next date. |
| Revisit Queue (TA/DIS) | View pending revisits by ticket, age, customer, technician, reason and urgency. |
| Schedule Next Visit | Create Visit 2 / Visit 3 on same ticket, confirm date and technician. |
| Waiting for Part Queue | View tickets blocked by SKU requests and ETA; coordinate stock with store. |
| Follow-Up History | Show every attempt, notes, charges and reasons in one ticket timeline. |
| Revisit Fee Review | Apply database rule: free vs chargeable based on tenant policy, warranty/AMC and circumstances. |

**Rules:** Visit can be `Completed — Unresolved` while parent ticket remains open; do not automatically charge a second visit fee.

## Module 13 — Workshop Management
**Main roles:** TA, WS, TECH · **Goal:** Repair appliances that cannot be serviced at home.

| Page / Screen | What the user can see or do |
|---|---|
| Job Details — Workshop Transfer (TECH) | Select reason, workshop, product/serial, visible condition, accessories, photos and pickup request. |
| Pickup Authorization | Capture explicit customer permission, scheduled pickup and pickup receipt. |
| Pickup / Product Handover | Record who took custody, time, condition, accessories and signed/OTP confirmation where configured. |
| Workshop Intake (WS) | Scan/check product serial, acknowledge receipt, inspect condition and assign internal repair. |
| Workshop Job Queue | Status groups: Awaiting Pickup, Received, Under Repair, Waiting Part, Testing, Ready to Return. |
| Workshop Repair Detail | Diagnosis, internal technician, parts used, revised estimate/approval, work notes and photos. |
| Final Testing / Quality Check | Enter test results, condition and ready-for-delivery approval. |
| Product Return / Delivery | Schedule delivery or customer collection; record handover proof, date and recipient. |
| Workshop History | Full custody trail: customer → pickup person → workshop → return. |

**Rules:** Moving the entire customer's product is distinct from moving spare-part inventory. Product remains linked to original service ticket until resolved or explicitly closed.

## Module 14 — Warranty Management
**Main roles:** TA, DIS; TECH (read eligibility) · **Goal:** Determine correct covered vs paid service.

| Page / Screen | What the user can see or do |
|---|---|
| Warranty Policy List / Form | Configure product/service/part warranty, duration, covered items, labor, visits and exclusions. |
| Customer Warranty Register | View covered products, start/end dates, source document, warranty status and claim history. |
| Warranty Eligibility Detail | Show why a job line is covered or paid at selected visit date. |
| Replacement Part Warranty | View warranty newly issued on a replaced part with serial and date. |
| Override Approval | Authorized manager documents exception and reason without overwriting original coverage history. |
| Expiry / Warranty Reports | Upcoming expiry, claims, covered repairs and free-service costs. |

## Module 15 — AMC / Maintenance Plans
**Main roles:** TA, DIS, authorized TECH · **Goal:** Sell and fulfill recurring maintenance coverage.

| Page / Screen | What the user can see or do |
|---|---|
| AMC Plan List / Create Plan | Configure plan price, duration, covered appliances, visit quota, included labor/home visits, excluded paid parts and renewal. |
| Customer AMC List | Search active, pending, expired, expiring and renewed subscriptions. |
| Sell / Assign AMC | Select customer/product, plan, dates and quote; collect payment and activate on confirmed receipt. |
| Customer AMC Detail | Coverage, remaining visits, past usage, payments and renewal date. |
| AMC Usage History | Each visit/benefit consumed, what was waived, what remains paid. |
| Renewal Queue | Notify and process renewals, changes in plan and expiry. |
| AMC Reports | Plan sales, active contracts, expiring counts, usage and profitability. |

**Example:** ₹500/year plan may include eligible home visits and labor while replacement parts stay paid. This depends on the tenant's actual configured plan terms.

## Module 16 — Estimates, Billing & Payments
**Main roles:** TA, FIN, TECH · **Goal:** Ensure transparent estimates, approved work and reconciled money.

| Page / Screen | What the user can see or do |
|---|---|
| Estimates List | Search pending/approved/rejected/revised estimates by ticket and customer. |
| Estimate Detail / Versioning | Itemized SKU/serial, labor, visit/pickup charges, discount, warranty/AMC waiver, taxes and total; keep old versions. |
| Customer Approval Panel | Manual in MVP with technician and notes; verified customer WhatsApp acceptance in future. |
| Invoice / Receipt Detail | Generate and download tenant-branded invoice and payment receipts for chargeable work. |
| Payments List (TA/FIN) | All cash/UPI/online payments, statuses, references, filters and reconciliation state. |
| Collect Payment (TECH within Job Details) | Enter payable amount/method, initiate or confirm payment according to method, show due amount. |
| My Collections (TECH) | Today's collections, cash vs noncash, unsubmitted cash and receipt history. |
| Cash Settlement (TECH/FIN) | Technician records cash handover; cashier confirms actual receipt and outstanding cash. |
| Outstanding & Adjustments | Pending balances, approved refund/adjustments, reason and audit trail. |

**Rules:** Use tenant DB price rates with effective dates and freeze approved prices. Gateway request ≠ successful payment until verified. Cash handover is **not** a second customer payment.

## Module 17 — Notifications & Communication
**Main roles:** TA; TECH for alerts · **Goal:** Keep employees and customers informed.

| Page / Screen | What the user can see or do |
|---|---|
| Notification Center | Read/unread alerts for new ticket, assignment, schedule, pending part, revisit and payments. |
| Notification Templates | Edit approved tenant-specific SMS/WhatsApp text and event mapping with required placeholders. |
| Message Delivery Log | Channel, recipient, sent/delivered/failed state, retry and provider reference. |
| Customer Communication Timeline | View service notices on specific customer or ticket. |
| Automation Rules | Configure enabled reminders for ETA, part delay, AMC renewal and ticket updates. |
| Future Customer WhatsApp Approval | Secure approval request; verified Yes/No response updates estimate decision with audit. |

## Module 18 — Reports & Analytics
**Main roles:** TA, FIN, SA (platform aggregate only) · **Goal:** See business performance and bottlenecks.

| Page / Screen | What the user can see or do |
|---|---|
| Tenant Dashboard | Open tickets, scheduled visits, technician presence, unresolved queues, collections and alerts. |
| Ticket & SLA Reports | Tickets by status/type/priority; response/resolution time and first-time-fix percentage. |
| Revisit / Pending Part Report | Repeat visit reasons, part wait times, delayed repair queue. |
| Workshop Operations Report | Products in workshop, custody exceptions, repair aging and turnaround. |
| Technician Report | Attendance, assignments, completion, revisits, time and productivity. |
| Inventory Report | Stock movements, available vs issued vs installed, shortages, serialized-part traceability. |
| Payment & Settlement Report | Income by charge type, paid/unpaid, outstanding, technician cash and settlements. |
| Warranty / AMC Report | Covered vs paid visits, warranty claims, plan sales, subscriptions, usage and renewals. |
| Report Filters & Export | Date range, branch, technician, status, product; export CSV/XLSX as authorized. |
| Super Admin Usage View | Tenant counts, subscriptions, feature usage and platform health without exposing customer financial detail indiscriminately. |

---

## B. Additional Page Structure by Role

### Super Admin: recommended main routes

| Sidebar | Detail / child pages |
|---|---|
| Dashboard | SaaS overview, platform alerts |
| Tenants | Tenant List → Create Tenant / Tenant Detail → Subscription / Features / Usage |
| Plans | SaaS Plan List → Create/Edit Plan → Limits |
| Global Masters | Product Categories, Brands, Default Complaint Templates |
| Platform Users | Users, Roles, Access |
| Reports | Tenant Usage, Subscription Status, Platform Health |
| Settings | Integrations, Notifications, Security, Audit |

### Tenant Admin: recommended main routes

| Sidebar | Detail / child pages |
|---|---|
| Dashboard | KPI overview, attention queues |
| Tickets | Ticket List → Create Ticket → Ticket Detail → Visit/Estimate/Payment History |
| Dispatch | Calendar → Assign / Reassign → Visit Queue |
| Customers | Customer List → Customer Detail → Products / History |
| Technicians | Employee List → Profile / Attendance / Performance |
| Inventory | Stock Dashboard → Parts → Receive / Issue / Transfer / Request / Return / Ledger |
| Revisit & Workshop | Revisit Queue → Schedule; Workshop Queue → Repair Detail / Pickup / Delivery |
| Coverage | Warranty / AMC Plan → Customer Subscriptions / Usage |
| Payments | Payments → Receipt / Outstanding / Cash Settlement |
| Masters | Products, Parts, Services, Complaints, Outcomes, Prices, Charges |
| Reports | Service, Workforce, Inventory, Finance, AMC |
| Settings | Branches, Company, Access, Notifications |

### Technician: recommended routes

| Bottom navigation | Detail / nested functionality |
|---|---|
| Home | Start Duty / End Duty, jobs today, alerts |
| Jobs | Job List → **Job Details** → Visit Check-In → Diagnosis → Part Add/Replace → Estimate → Approval → Payment → Visit Outcome / Completion OTP |
| Stock | My Stock → Stock Request → Return History |
| Collections | Collection List → Receipt Detail → Cash Settlement |
| Profile | Profile, Attendance History, Notifications, Settings, Help |

## C. Most Important Workflows for Page Design and QA

1. **Own-shop warranty TV:** Create customer + product → verify warranty → ticket → assign visit → technician attendance → visit check-in → diagnose → under-warranty part install → zero/covered charge if eligible → test → customer OTP → resolve.
2. **Outside-shop paid repair:** Register outside purchased product → ticket → estimate with DB charges → customer approval → paid part/labor/visit → payment → OTP close.
3. **Unavailable spare:** Technician diagnoses → requests missing SKU → `Waiting for Part` queue → store issues serial → admin schedules Visit 2 on same ticket → installation and appropriate payment.
4. **Unfinished visit:** Record `Revisit Required` → reason/date → visit ends unresolved → admin schedules next day under same ticket; revisit charge policy evaluated independently.
5. **Workshop repair:** Home visit cannot repair → customer consents → pickup/handover + photos → workshop receives appliance → repairs/tests → delivery confirmation → final ticket resolution.
6. **AMC coverage:** Sell ₹500/year plan → confirm payment → activate → eligible visit/labor waived per quota → replacement parts paid → record usage and renewal.
7. **Technician inventory:** Issue 5 serialized bulbs to Mohit → install exact serial on a ticket → his stock becomes 4; track old part separately.
8. **Cash handling:** Technician collects ₹500 → customer receipt confirmed → technician cash liability ₹500 → cashier accepts handover; avoid double-counting revenue.
9. **Security:** Tenant A employee cannot access Tenant B's customer, tickets, files, stock or payments even by guessing API identifiers.

## D. Engineering and UI Implementation Notes

- **Stack recommendation:** React + Vite (Super Admin/Tenant Admin), React Native (Technician app), Node.js + TypeScript APIs, PostgreSQL with RLS.
- **Visual direction:** Clean Enterprise, white/light gray cards, charcoal typography, thin borders, subtle green/amber statuses, Inter/SF-like font, compact forms. Three-line hamburger header for secondary pages, five-item bottom bar.
- **Master screens:** group related masters with tabs to avoid 20 sidebar items. Example: Product Masters contains Category/Brand/Model tabs; Pricing contains Home Visit/Labor/Workshop tabs.
- **Forms:** Header `+` for create; no duplicate bottom floating create button if top action already exists. Searchable dropdowns, serial scanning, required-field validation, clear error and loading states.
- **Server is authority:** Tenant access, part stock, rate/coverage calculations, approved estimates, payment verification, attendance and customer OTP are checked on backend.
- **Audit & history:** Preserve previous estimate versions, each visit, each inventory movement, each custody handover, each approval and each settlement.
- **Permissions:** Above role names are defaults; actual screens and actions should be permission-controlled per tenant/branch.
- **States:** Handle empty, loading, offline/pending sync, error, blocked, declined and resumed actions explicitly.
- **Design progression:** First create list/detail/form layouts for core modules; then technician Job Details as one integrated multi-section flow; then exception and workshop flows.

## E. Suggested Development Sequence

1. **Foundation:** Tenant → Auth/RBAC → Company/Branch → Global/Tenant Masters.
2. **Service CRM:** Customers → Customer Products → Ticket List/Create/Detail → Dispatch.
3. **Technician App:** Login → Daily Check-In → My Jobs → Visit Check-In → Diagnosis → Parts → Estimate → Approval → Payment → OTP.
4. **Exceptions:** Revisit Queue → Part Request → Stock Issue → Workshop Pickup/Repair/Delivery.
5. **Business:** Warranty → AMC → Notifications → Reports/Exports and advanced automation.

**Scope clarity:** This is a page-and-capability plan, **not evidence of implemented screens or APIs**. Detailed behavior, permissions, status transitions and designs should be validated before coding.