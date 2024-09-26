# FIRETABLE

[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Smrtnyk_Firetable&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Smrtnyk_Firetable)

### Demo: [https://firetable-eu.web.app](https://firetable-eu.web.app)

To access the demo, use the following credentials:
- **Owner role**:
  - Email: `owner@Demo.at`
  - Password: `Owner@Demo!234,.`
- **Staff role**:
  - Email: `staff@Demo.at`
  - Password: `Staff@Demo!234,.`
- **Manager role**:
  - Email: `manager@Demo.at`
  - Password: `Manager@Demo!234,.`

**Firetable** is an event management system, built as a mono-repo using [pnpm](https://pnpm.io/), designed with a focus on flexibility and user-friendly interfaces.
It functions as a Progressive Web App (PWA), providing a desktop-like experience when installed on your device.
This approach ensures Firetable is not just a web application but also a robust tool that offers an app-like experience directly from your browser.
For optimal use and to take full advantage of its features, including its full-screen functionality, we recommend installing Firetable on your desktop.

- **frontend**: The main frontend application.
- **backend**: The backend application, which is a [Firebase](https://firebase.google.com/) project.
- **functions**: The cloud functions for the backend.
- **types**: Shared types between the packages
- **utils**: Shared utilities between the packages
- **floor-creator**: A tool for creating floor plans.

## Features:
- **Organizations**: Create and manage multiple organisations.
- **Properties Management**: Create and manage multiple properties within an organisation.
- **Floor Maps**: Design detailed floor plans by adding various elements such as DJ Booths, Sofas, Tables, and more.
- **Event Management**: Organize events by selecting from one of the available floor plans.
- **Guest Lists**: Create guest lists for events.
- **Reservation System**: Manage reservations for both planned and walk-in guests.
- **User Management**: Register users and associate them with specific properties.
- **Guest Management**: Create and manage guest profiles with detailed information and their visits tracking.
- **Role-based Access Control**: Assign roles to users and control their access to various features.
- **Analytics**: Track key metrics and gain valuable insights into guest behavior and operational aspects.
- **Dark Mode**: Switch to an eye-friendly dark theme.
- **Language Picker**: Multi-language support to cater to a global audience.
- **Inventory Management**: Keep track of inventory items, manage stock levels, and streamline supply chain operations across all properties.
- **Barcode Scanning**: Quickly add or update inventory items using barcode scanning technology for faster data entry and reduced errors.

## Reservation System

Firetable's reservation system is streamlined to handle two primary types of reservations: Planned and Walk-In, each catering to different guest scenarios.

### Planned Reservations
These are advance bookings where guests confirm their visit beforehand.
The system tracks key details like reservation status (confirmed, cancelled, arrived), guest information, and consumption amounts.
This type of reservation is crucial for managing guest expectations and preparing the venue accordingly.

### Walk-In Reservations
Designed for guests who arrive without a prior reservation.
These are immediately accommodated and tracked with the emphasis on real-time data entry, including guest details and optional consumption data.
This reservation type aids in efficiently managing unexpected guest flow.

## Analytics

The analytics system in Firetable is designed to provide comprehensive insights into both planned and walk-in reservations.
By leveraging visual and data-driven analytics, it offers a detailed understanding of various operational aspects.

### Key Metrics Visualized:
- **Reservation Types Comparison**: Displays the proportion of planned versus walk-in reservations, providing insights into guest behavior and preferences.
- **Guest Arrival Patterns**: Tracks the arrival status (arrived, no-show) of guests, helping in understanding the reliability of reservations.
- **Average Consumption**: Analyzes the average consumption for both reservation types, offering valuable data for revenue forecasting and menu planning.
- **Peak Hours Analysis**: Identifies the busiest hours based on reservation data, facilitating better staff scheduling and resource allocation.
- **Guest Distribution**: Presents the distribution of guests across different days and times, aiding in optimizing event schedules and marketing strategies.
- **Property-wise Reservation Analysis**: Breaks down reservations by property, enabling property managers to evaluate performance and plan improvements.

### Data Utilization:
The analytical data helps in making informed decisions for improving service quality, optimizing operations, and enhancing the overall guest experience.
By understanding patterns and trends in reservations and guest behavior, Firetable empowers venue managers to adapt strategies that align with guest needs and business objectives.

### Inventory Management

Firetable's inventory management system enables efficient tracking and management of inventory across all properties. With real-time updates and detailed tracking.

### Barcode Scanning
Enhance your inventory management with integrated barcode scanning:

 * Efficient Data Entry: Use your phone camera as a barcode scanner to add new items.
 * Error Reduction: Minimize manual entry errors by scanning barcodes for item identification.
 * Compatibility: Works with standard barcode scanners, requiring no specialized equipment, just your phone.
 * Real-Time Synchronization: Instantly update inventory records as items are scanned, ensuring data accuracy.

---

This section outlines the reservation types and the comprehensive analytics provided by Firetable, focusing on the functional aspects and how they contribute to effective event and property management.


## Technology Stack:
- **Frontend**: Developed using Quasar, which is built over the Vue.js framework.
- **Backend**: Communicates through Firebase and supplemented with cloud functions.

> For the cloud functions implemented with Firebase, refer to the `packages/functions` directory.

## Getting Started

### 1. Setup:
To set up the app for local development, follow these steps:
- **Install Dependencies**: Run `pnpm install` in your terminal to install the necessary tools and dependencies.

### 2. Development:
- **Start Firebase Emulators**:
    - Navigate to the root directory and execute `pnpm run start:emulators` to start the Firebase emulators. This will simulate your backend environment locally.
- **Run Development Server**:
    - Open a new terminal window and run `pnpm run dev:frontend` to start the frontend development server.

### 3. HTTPS Mode:
- **Enable HTTPS**: For HTTPS mode, you need SSL certificates. Generate `key.pem` and `cert.pem` files using the `mkcert` tool.
- **Disable HTTPS (Optional)**: If HTTPS is not required, disable it by commenting out the `https` field in `quasar.config.js`.

### 4. Firebase Configuration:
- **Configure Firebase**: An error regarding `fb-config.json` will appear initially. To resolve this:
    - Go to the `backend` package and rename `fb-config-template.json` to `fb-config.json`.
    - Fill in the necessary Firebase project credentials in `fb-config.json`. You'll need to create a Firebase project to obtain these credentials.

### 5. Accessing the App:
- **Launch the App**: After starting both the emulators and the dev server, the app will be accessible at `https://localhost:8080`.

### 6. Creating an Admin User (Mandatory Step):
- **Admin User Setup**: To use the app, you must first create an admin user.
    - Visit the Firebase Emulators UI at `http://localhost:3000/auth`.
    - Click the `Add User` button.
    - Enter a dummy email and password.
    - In the `Custom Claims` field, add `{ "role": "Administrator" }` to grant admin privileges.
    - Log in to the app using these credentials to access all features and functionalities.

## Translations:
- Currently, app is fully written in english, and is partially translated to german.

## Contributions:
Feel free to fork, use, and contribute to this project. All ideas and contributions are welcome!
