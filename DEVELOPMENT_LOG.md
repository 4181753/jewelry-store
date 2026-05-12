# Development Log - Luxury Jewelry Independent Station

This document serves as a hand-over guide for any AI assistant (Accio) working on this project. It tracks the architecture, key decisions, and development history.

---

## 🚀 Project Overview
A premium independent e-commerce station for luxury jewelry, focusing on elite UI/UX, high-performance inventory management, and private traffic (WhatsApp) conversion.

- **Frontend URL**: `pro20y.com`
- **Admin Panel**: `/admin83` (Chinese interface for the owner)
- **Primary Goal**: High-conversion landing pages for Southeast Asian markets.

---

## 🛠 Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4 (Configured in `src/app/globals.css`, no `tailwind.config.js`)
- **Icons**: Lucide React
- **Data Persistence**: `src/data/site-content.json` (JSON-based flat-file storage)
- **Deployment**: GitHub Actions (CI/CD) -> Hostinger (Node.js via SSH)

---

## 🏗 Key Architecture & Implementation

### 1. Data Structure (`src/data/site-content.json`)
- **Crucial**: This file is the "Database". It stores all products, brands, carousel images, and contact info.
- **Safety**: Always backup this file before large deployments.

### 2. Admin System (`src/app/admin83/page.tsx`)
- **Features**: 
  - 3-batch parallel image scraper for external URLs.
  - Manual image upload for specific items.
  - Pagination (50 items/page).
  - Bulk discount setting (supports 2 decimal places).
  - Excel export/import.
  - **Cloud Sync**: Integrated "Sync to Cloud" button that automates Git workflow (Add -> Commit -> Push) to trigger CI/CD.
  - **Language**: Stays in Chinese for the owner's convenience.

### 3. Git Automation (`src/app/api/admin/sync/route.ts`)
- **Purpose**: Bridge between the Admin UI and GitHub.
- **Implementation**: Uses `child_process.exec` with absolute Git paths to ensure compatibility with various Windows environments.
- **Workflow**: Auto-commits changes to `site-content.json` with a timestamp and pushes to the `main` branch.

### 4. Frontend Localization
- **Language**: Public site is 100% English.
- **Key Terminology**: "Boutique Price" has been replaced with **"Official Price"** across all components.

### 4. Conversion Engine (`src/components/ProductCard.tsx`)
- **WhatsApp Integration**: Instead of direct links, we use a centered QR code overlay in the detail modal.
- **High-Conversion Copy**: 
  - `Free Gift with First Order` (Animated pulse)
  - `Buy 2, 40% OFF on 2nd Item`
- **Interactive UX**: 
  - Carousels pause on hover (Hero and Detail).
  - Detail images auto-play at 1-2s intervals.
  - Multi-image hover (switches to 2nd image on hover).

---

## 📅 Development History Highlights

### **2026-05-12**
- **Cloud Sync Robustness**: Refactored the `sync` API to use a centralized `runGit` helper. This ensures every Git command (`add`, `commit`, `push`) automatically falls back to the absolute Git path if the system PATH is missing, resolving the intermittent "Command failed" errors.
- **Auto-Log Policy**: Established a strict protocol for the AI assistant to update this `DEVELOPMENT_LOG.md` after **every** significant task without requiring a user reminder.
- **Admin Fixes**: 
  - Resolved `ReferenceError` caused by missing state definitions (`filterBrand`, etc.) during pagination implementation.
  - Fixed "Empty Dashboard" bug by ensuring `loadData()` runs on component mount.
  - Improved Sidebar UX with scrolling support to prevent action buttons from being hidden on small screens.
- **Git Environment**: Initial patch for Git paths applied.
- **Deployment**: Migrated from manual `.zip` uploads to **GitHub Actions Auto-Deploy**. Configured SSH Secrets and CI/CD pipeline.
- **Admin Optimization**: Added pagination, decimal support for discounts, and image carousel sorting (up/down).
- **UX**: Implemented "Pause on Hover" for all carousels and "Preload on Hover" for detail images.
- **Copy**: Updated all marketing prompts to red-animated high-conversion text.
- **Terminology**: Unified all boutique labels to "Official Price".

### **Earlier**
- Fixed syntax errors in `admin83` dashboard.
- Implemented centered product detail modal with backdrop blur.
- Configured Hostinger Node.js environment.

---

## 🛡 Hand-over Instructions for the Next Accio
1.  **Check Secrets**: Ensure GitHub Secrets (`SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`, `SSH_PORT`) are set for deployment.
2.  **Data Persistence**: If adding fields to `site-content.json`, update the interfaces in `src/components/ProductCard.tsx` to avoid TS build errors.
3.  **Styling**: Use Tailwind v4 classes. Custom theme values are in `src/app/globals.css`.
4.  **Auto-Update**: After every significant task, update the **"Development History Highlights"** section above.

---

## 📌 Active Task / Next Steps
1.  [ ] Verify GitHub Actions successful deployment after Secrets are added.
2.  [ ] Monitor server performance with preloading logic enabled.
3.  [ ] Optimize `site-content.json` loading speed if product count exceeds 2000+.
