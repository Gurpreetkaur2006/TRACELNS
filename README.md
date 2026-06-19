# TRACELNS
# TraceLens Intelligence

**Cyber Complaint Analyzer & Pattern Tracker**

A fully offline, browser-based tool for logging cybercrime complaints and detecting patterns across them — built as part of a 45-day Cyber Security Training Program.

---

## About the Project

TraceLens Intelligence is a lightweight investigative support tool designed for cybercrime cell workflows. It allows an officer to register complaints, store them locally on the system (no internet or server required), and automatically surface connections between cases — for example, when the same suspect phone number or UPI ID appears across multiple unrelated complaints.

The core idea: cybercrime complaints are rarely investigated in isolation. The same scammer phone number or UPI handle often shows up in several FIRs filed by different victims, sometimes across different police stations. Manually noticing that overlap is slow. TraceLens automates the cross-referencing.

### Problem Statement

Cybercrime helpline and FIR data is typically logged complaint-by-complaint with no easy way to see whether a phone number, UPI ID, or modus operandi has appeared before. Repeat offenders and organized fraud rings stay hidden in plain sight simply because nobody connects complaint #45 to complaint #312. This project builds a working prototype of a tool that closes that gap, using only client-side technology so it can run on any system without IT setup, internet access, or a backend server.

### What It Does

- **Complaint Registration** — structured intake form capturing victim details, suspect phone/UPI, crime type, and incident description
- **Local Data Storage** — all complaint data persists in the browser's LocalStorage; nothing leaves the machine
- **Case Management** — view, search, and manage all registered complaints in a sortable table
- **Risk Scoring Engine** — automatically scores a suspect's phone/UPI based on how many complaints reference it and how many distinct crime types are linked to it (Low / Medium / High Risk)
- **Link Analysis** — interactive SVG network graph visualizing how a suspect phone number connects to victims, UPI IDs, crime types, and complaint records
- **Intelligence Dashboard** — aggregate statistics: top crime categories, repeat-offender rankings, case trends
- **Dossier Export** — generates a printable investigation summary for a given suspect

### Tech Stack

Built deliberately with no frameworks, no build tools, and no backend — so it runs by opening a single HTML file:

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom design system, no framework) |
| Logic | Vanilla JavaScript (ES6) |
| Storage | Browser LocalStorage |
| Visualization | Hand-built SVG rendering (no chart library dependency for the network graph) |

### Project Structure

```
TraceLens-Intelligence/
├── index.html      # App shell, layout, all views (login, dashboard, register, manage, analysis, intel, scope)
├── style.css       # Design system: colors, typography, layout, components
├── storage.js       # LocalStorage data layer — CRUD for complaints, session/auth handling, seed data
├── analyzer.js      # Risk scoring engine + link analysis + SVG network graph renderer
├── app.js           # Main controller — routing between views, form handling, table rendering, dossier generation
└── README.md
```

### How to Run

No installation, no server, no dependencies.

1. Clone or download this repository
2. Open `index.html` directly in any modern browser (Chrome/Edge/Firefox)
3. Log in with the demo credentials shown on the login screen
4. Start registering complaints — sample seed data is included so the dashboard isn't empty on first run

### Current Scope / Phase

This is **Phase 1** of a multi-phase build:
- ✅ Phase 1 — Complaint registration, local storage, risk scoring, link analysis, dashboard (current)
- 🔜 Phase 2 — *(describe your planned Phase 2 here, e.g. bank-account/transaction trail analysis)*
- 🔜 Phase 3 — *(describe your planned Phase 3 here, e.g. cloud sync, multi-user roles)*

A "Future Scope" view inside the app itself outlines further planned upgrades (cloud database integration, bank transaction parsing, AI-based fraud pattern detection, GIS mapping, role-based access control).

### Disclaimer

This is a training/educational prototype built for demonstration purposes during a cybersecurity training program. The sample data included is fictional. It is not intended for deployment on live case data without appropriate security review, access controls, and data protection compliance.

### Contributors

- Gurpreet Kaur — [https://github.com/Gurpreetkaur2006]
- Harshpreet Kaur — [https://github.com/harshjaswal06]

### License

This project is for educational/training purposes. 
