# 🚀 CI/CD Pipeline & Cloud Deployment Guide

This repository is configured with automated **Continuous Integration (CI)** and **Continuous Deployment (CD)** pipelines via **GitHub Actions**.

---

## 🛠️ CI/CD Architecture

```
[ Push / PR to GitHub ]
         │
         ├──► 1. GitHub Actions CI (ci.yml)
         │       ├── Backend DB & Policy Integration Tests
         │       └── Frontend Vite Production Build Verification
         │
         └──► 2. GitHub Actions CD (deploy.yml) [on main branch]
                 ├── Render Backend Webhook Trigger ➔ https://xxx.onrender.com
                 └── Vercel Frontend CLI Deploy ➔ https://xxx.vercel.app
```

---

## 📁 Workflow Files

| Workflow | File | Trigger | Description |
| :--- | :--- | :--- | :--- |
| **Continuous Integration** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Push & Pull Requests | Runs test suite on Node 20.x and 22.x, builds Vite bundle. |
| **Continuous Deployment** | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Push to `main` branch | Automatically triggers Render deploy hook & deploys frontend to Vercel. |

---

## 🔑 GitHub Repository Secrets Configuration

To enable automated zero-touch deployments on git push:

1. Go to your GitHub Repository ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions**.
2. Add the following repository secrets:

### For Render Automated Backend Deployment:
* `RENDER_DEPLOY_HOOK_URL`:
  * In Render Dashboard ➔ Your Web Service (`hr-flow-ai-backend`) ➔ **Settings** ➔ Scroll to **Deploy Hook** ➔ Copy the URL.

### For Vercel Automated Frontend Deployment:
* `VERCEL_TOKEN`:
  * Obtain from Vercel Account Settings ➔ [Tokens](https://vercel.com/account/tokens) ➔ Create Token.
* `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID`:
  * In `frontend/`, run `npx vercel link` once, or check `.vercel/project.json` to find your `orgId` and `projectId`.

---

## 🧪 Local Test Commands

Before pushing, you can test everything locally:

```bash
# Run backend CI test suite
npm --prefix backend test

# Run frontend build check
npm --prefix frontend run build
```
