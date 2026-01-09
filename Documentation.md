# Inventory Management System — Workflow & Usage Guide

## 1. Overview

This system is designed for **structured, auditable inventory management** across companies and warehouses.

It supports:

* Multiple warehouses per company
* Stock tracking per product per warehouse
* Full audit trail
* Controlled exception handling via approvals

The system is built to scale from **small teams** to **enterprise workflows**.

---

## 2. Core Concepts (Mental Model)

### 🏢 Company

* A company is the **top-level boundary**.
* All warehouses, inventory, and actions happen **inside a company**.
* Users can only operate on **one active company at a time**.

> Think of company as a “workspace”.

---

### 🏬 Warehouse

* Physical or logical storage location.
* Each warehouse belongs to **exactly one company**.
* Stock is always tracked **per warehouse**.

---

### 📦 Product

* Represents an item you store and track.
* Shared across warehouses inside a company.
* Identified by SKU.

---

### 📊 Inventory Stock

* Represents **current quantity** of a product in a warehouse.
* One record per `(product × warehouse)` pair.
* This is the **current state**.

---

### 📜 Inventory Ledger

* Immutable history of **every stock movement**.
* Stock In, Stock Out, Transfers, Orders.
* Used for reporting and traceability.

> Ledger answers: *What happened? When? Why?*

---

### 🧾 Audit Log

* Tracks **who did what** in the system.
* Covers product creation, warehouse changes, stock actions, approvals.
* Non-editable, permanent.

> Audit answers: *Who changed the system state?*

---

## 3. User Roles & Permissions

The system uses **Role-Based Access Control (RBAC)**.

Examples:

* **Admin**: full control, approvals, configuration
* **Manager**: stock operations, reports
* **Staff**: limited operations (stock in/out)

Permissions control:

* Viewing inventory
* Creating products / warehouses
* Stock in / out
* Transfers
* Order approvals
* Viewing audit logs

---

## 4. Active Company Concept

At any time, a user works within **one active company**.

* Selected from the top navigation
* All data shown (products, warehouses, inventory) is **scoped to that company**
* Prevents cross-company data leaks or mistakes

> This keeps operations clean and safe.

---

## 5. Inventory Operations (Core Workflows)

### 5.1 Stock In (Add Inventory)

**Use when:**

* New stock arrives
* Purchase completed
* Initial inventory setup

**Flow:**

1. Select product
2. Select warehouse
3. Enter quantity
4. Submit

**Result:**

* Stock quantity increases
* Ledger entry created
* Audit log recorded

---

### 5.2 Stock Out (Remove Inventory)

**Use when:**

* Goods sold
* Items consumed
* Items disposed

**Flow:**

1. Select product
2. Select warehouse
3. Enter quantity
4. Submit

**Result:**

* Stock quantity decreases
* Ledger entry created
* Audit log recorded

---

### 5.3 Transfer Stock (Warehouse → Warehouse)

**Use when:**

* Moving inventory internally
* Rebalancing stock

**Flow:**

1. Select product
2. Select source warehouse
3. Select destination warehouse (same company)
4. Enter quantity
5. Submit

**Result:**

* Stock deducted from source
* Stock added to destination
* Two ledger entries created
* One audit trail entry

**Rule:**

* Transfers across companies are **not allowed**

---

## 6. Inventory Order (Exception Handling)

### What is an Order?

An **order** is used when the system stock does not match reality.

Examples:

* Damaged items found
* Theft or loss
* Manual correction after audit
* Data migration corrections

---

### 6.1 Request Order

**Who:** Staff / Manager
**Status:** PENDING

**Flow:**

1. Select product
2. Select warehouse
3. Enter order (+ / -)
4. Enter reason (mandatory)
5. Submit

**Important:**

* Stock does **NOT** change yet
* Awaiting approval

---

### 6.2 Approve / Reject Order

**Who:** Admin / Authorized Manager

**Approve:**

* Stock is updated
* Ledger entry created
* Status → APPROVED

**Reject:**

* No stock change
* Status → REJECTED

**Why this matters:**

* Prevents silent stock manipulation
* Enforces accountability

---

## 7. Reports

### Stock Report

* Current inventory snapshot
* Filter by product / warehouse

### Movement Report

* Historical stock movements
* Filter by date, product, warehouse
* Based on ledger (source of truth)

---

## 8. Audit Trail

Every critical action is logged:

* Product creation / updates
* Warehouse creation
* Stock in / out
* Transfers
* Orders
* Approvals

Audit logs show:

* Actor (user)
* Action
* Entity affected
* Before / after state

> This makes the system **compliance-ready**.

---

## 9. Error Handling & Safety

The system prevents:

* Negative stock
* Cross-company transfers
* Unauthorized actions
* Silent data corruption

Errors are:

* Validated on backend
* Shown clearly in UI (toasts)

---

## 10. Typical Daily Workflow (Example)

1. User selects company
2. Adds warehouses if needed
3. Creates products
4. Performs stock-in for new arrivals
5. Transfers stock between warehouses
6. Performs stock-out for sales
7. Requests order if mismatch found
8. Admin approves order
9. Views reports and audit logs

---

## 11. Why This Design Works

* **Scalable**: Multi-company ready
* **Auditable**: Every change tracked
* **Safe**: No silent corrections
* **Flexible**: Supports real-world exceptions
* **Enterprise-grade**: Matches ERP patterns

---

## 12. Final Note for Clients

This system is designed to:

* Reduce inventory errors
* Increase accountability
* Provide full visibility
* Support business growth

You always know:

* What stock you have
* Where it is
* Who changed it
* Why it changed