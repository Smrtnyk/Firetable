# FIRETABLE

[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Smrtnyk_Firetable&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Smrtnyk_Firetable)

**Firetable** is an event management system designed with a focus on flexibility and user-friendly interfaces.

## Features:
- **Properties Management**: Create and manage multiple properties.
- **Floor Maps**: Design detailed floor plans by adding various elements such as DJ Booths, Sofas, Tables, and more.
- **Event Management**: Organize events by selecting from one of the available floor plans.
- **User Management**: Register users and associate them with specific properties.
- **Dark Mode**: Switch to an eye-friendly dark theme.
- **Language Picker**: Multi-language support to cater to a global audience.

## Technology Stack:
- **Frontend**: Developed using Quasar, which is built over the Vue.js framework.
- **Backend**: Communicates through Firebase and supplemented with cloud functions.

> For the cloud functions implemented with Firebase, refer to the `packages/functions` directory.

## Getting Started:

1. **Setup**:
    - The app communicates locally with the Firebase emulator. Install the required tools using:
      ```
      pnpm install
      ```

2. **Development**:
    - Navigate to the `frontend` directory and start the development server with:
      ```
      npm run dev
      ```

3. **HTTPS Mode**:
    - To run the app in HTTPS mode, generate `key.pem` and `cert.pem` using `mkcert`.
    - If you do not wish to use HTTPS, you can simply comment out the `https` field in `quasar.config.js`.

## Translations:
- The translation of the app is currently ongoing.

## Contributions:
Feel free to fork, use, and contribute to this project. All ideas and contributions are welcome!
