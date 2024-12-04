<p align="center">
  <img src="packages/frontend/public/icons/icon-256x256.png" alt="Firetable Logo" width="256" height="256">
</p>

<h1 align="center">
FIRETABLE
</h1>

[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Smrtnyk_Firetable&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Smrtnyk_Firetable)

Event management system built as a mono-repo using [pnpm](https://pnpm.io/). Functions as a Progressive Web App (PWA) for desktop-like experience.

## Demo
Available at: [https://firetable-eu.web.app](https://firetable-eu.web.app)

Demo credentials:
- Owner: owner@Demo.at / Owner@Demo!234,.
- Staff: staff@Demo.at / Staff@Demo!234,.
- Manager: manager@Demo.at / Manager@Demo!234,.

## Core Features

- Organization & Property Management
  - Create and manage multiple organizations and their properties
  - Role-based access control for users

- Event Planning
  - Floor plan designer with customizable elements (DJ booths, sofas, tables)
  - Event scheduling and management
  - Guest list creation and management

- Reservation System
  - Handle immediate and wait list reservations
  - Track guest information and visit history
  - Monitor consumption data

- Analytics
  - Track key metrics for reservations and events
  - Analyze guest patterns and property performance
  - Generate operational insights

- Additional Features
  - Dark mode support
  - Multi-language interface
  - Inventory management across properties

## Project Structure

- frontend: Main web application
- backend: Firebase project
- functions: Cloud functions
- types: Shared type definitions
- floor-creator: Floor plan creation tool

## Technology Stack

- Frontend: Quasar (Vue.js framework)
- Backend: Firebase + Cloud Functions

## Setup Instructions

1. Install dependencies:
```bash
pnpm install
```

2. Configure Firebase:
   - Rename `/backend/fb-config-template.json` to `fb-config.json`
   - Add your Firebase credentials

3. Start development:
   - Firebase emulators: `pnpm run start:emulators`
   - Frontend server: `pnpm run dev:frontend`

The app will be available at `https://localhost:8080`

### HTTPS Setup (Optional)
Generate SSL certificates using `mkcert` for HTTPS mode, or disable it in `quasar.config.js`

### Admin User Setup
Required before first use:
1. Visit Firebase Emulators UI (`http://localhost:3000/auth`)
2. Add new user with custom claim: `{ "role": "Administrator" }`
3. Use these credentials to log in

## Language Support
Currently supports English with partial German translations

## Contributing
Contributions welcome - feel free to fork and submit PRs!
