maizu
MAIZU – African multi-vendor fashion marketplace connecting creators and buyers across the continent.
MAIZU

MAIZU is an African multi-vendor fashion marketplace that connects creators and buyers across the continent.

Tech Stack
Frontend: Next.js
Backend: Node.js
Database: PostgreSQL

Core Features
- Vendor registration
- Product catalog
- Shopping cart
- Secure payments


# MAIZU Project Development Plan

## Overview

MAIZU is an African multi-vendor fashion marketplace that allows creators, designers, and brands to sell products across the continent.

The goal of the first version (MVP) is to build a functional marketplace where:

* Users can create accounts
* Vendors can open stores
* Vendors can upload products
* Customers can browse and buy products

---

# Project Architecture

## Technology Stack

### Frontend

Framework: Next.js
Purpose: Build the website interface for users and vendors.

Responsibilities:

* Product browsing
* Vendor store pages
* Shopping cart
* Checkout interface
* Authentication UI

---

### Backend API

Framework: Node.js with Express

Responsibilities:

* Authentication
* Vendor management
* Product management
* Order management
* Payment processing

---

### Database

Database: PostgreSQL

Purpose:
Store all platform data such as:

* users
* vendors
* products
* orders
* payments

---

### Media Storage

Service: Cloudinary

Purpose:
Store product images and fashion media.

---

# Repository Structure

```
maizu
│
├── frontend
│   ├── components
│   ├── pages
│   ├── layouts
│   ├── services
│   └── utils
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── middleware
│   ├── services
│   └── config
│
├── database
│   ├── schema
│   ├── migrations
│   └── seeds
│
├── docs
│   ├── architecture.md
│   └── api-spec.md
│
├── design
│   ├── ui
│   └── brand
│
└── README.md
```

---

# Core Systems

## 1. Authentication System

Users must be able to:

* Register
* Login
* Reset password

User roles:

* Customer
* Vendor
* Admin

---

## 2. Vendor System

Vendors can:

* Create stores
* Upload products
* Manage inventory
* Track orders

Example vendor data:

```
Vendor
- id
- store_name
- owner_id
- products
- orders
```

---

## 3. Product Catalog

Products contain:

```
Product
- id
- title
- description
- price
- vendor_id
- category
- images
```

---

## 4. Shopping Cart

```
Cart
- user_id
- products
- quantities
```

---

## 5. Order System

```
Order
- id
- customer_id
- products
- total_price
- payment_status
- delivery_status
```

---

## 6. Payment System

Possible integrations:

* Paystack
* Flutterwave
* Stripe

For Africa-first payments, Paystack or Flutterwave are recommended.

---

# Development Workflow

All developers must follow this workflow.

### 1. Pull Latest Changes

```
git pull
```

### 2. Create Feature Branch

Example:

```
git checkout -b vendor-system
```

### 3. Implement Feature

Write and test code.

### 4. Commit Changes

```
git add .
git commit -m "Add vendor system"
```

### 5. Push Branch

```
git push origin vendor-system
```

### 6. Open Pull Request

Create a Pull Request on GitHub for review.

---

# MVP Development Roadmap

Phase 1 (Core Platform)

1. Authentication system
2. Vendor registration
3. Product upload
4. Product listing page
5. Shopping cart
6. Checkout system

---

# Team Responsibilities

Project Lead:

* Architecture decisions
* Task organization
* Code review

Developers:

* Build assigned features
* Create pull requests
* Maintain code quality

---

# Vision

MAIZU aims to become a leading digital marketplace for African fashion, empowering designers and creators to reach customers across the continent and globally.
