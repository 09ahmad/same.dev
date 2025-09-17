#  Same.dev — AI-Powered Website Builder

Same.dev is an **AI-powered full-stack website builder** inspired by platforms like [bolt.new](https://bolt.new).  
With just a **prompt**, it can generate a complete project end-to-end — including the frontend, backend, and supporting utilities.  

The goal of Same.dev is to **make software development as simple as describing what you want**.  
Whether you need a landing page, a dashboard, or a backend service, Same.dev builds the entire project inside a **monorepo** with a clean and scalable architecture.  

---
## 🎥 Demo Video

[Watch the demo on YouTube](https://drive.google.com/file/d/1tzibb_fsc_nQXfgVQtwsXtnTHII6jiMT/view)



## Introduction

Modern web development often requires stitching together multiple tools:
- A **frontend framework** (like React/Next.js)  
- A **backend runtime** (like Node.js or Bun)  
- A **state management system**  
- A **database layer**  
- Shared utilities and build tooling  

This can be overwhelming, especially for rapid prototyping or when you just want to get something running fast.

**Same.dev solves this problem** by combining:
- **AI-driven code generation** → describe your project in plain English, and let the system scaffold the entire app.  
- **Monorepo architecture with Turborepo** → keeps frontend, backend, and shared packages in one place.  
- **Next.js frontend** → delivers a production-ready, SSR-enabled UI.  
- **Bun-powered backend services** → provides ultra-fast execution for APIs and background tasks.  
- **History tracking** → every generated project is stored and can be revisited later.  

With these pieces, Same.dev provides a **developer-first experience**, enabling both beginners and professionals to build and iterate on apps faster than ever.

---

## 📂 Monorepo Structure
same.dev/
│── .turbo/ # Turborepo build cache
│── agent/ # Backend service (AI Agent that generates code/projects)
│── fe/ # Next.js frontend (user-facing interface)
│── history/ # Backend service (stores project history/persistence)
│── packages/ # Shared utilities, types, and configurations
│── .gitignore # Git ignore rules
│── .npmrc # npm registry config
│── bun.lock # Bun lockfile
│── package.json # Root package file
│── README.md # Project documentation
│── turbo.json # Turborepo configuration



---

##  Tech Stack

- **Monorepo Tooling:** [Turborepo](https://turbo.build/repo)  
- **Frontend:** [Next.js](https://nextjs.org/) with App Router  
- **Backend Runtime:** [Bun](https://bun.sh/) (fast alternative to Node.js)  
- **Language:** TypeScript  
- **Package Manager:** Bun + npm  
- **AI Integration:** Custom AI Agent service for project scaffolding

---