[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Smrtnyk_Firetable&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Smrtnyk_Firetable)

## FIRETABLE

### An event management system.
Frontend is made with Quasar which uses Vue as its framework.
Backend communication is done with Firebase and cloud functions.

Some of the capabilities are:
* Properties creation
* Floor maps creation
    - Add various elements onto the floor plan, such as DJ Booth, Sofa, Table etc...
* Event management
    - Create event for properties by choosing one of the created floor plans
* User management
    - Create users and assign them to the corresponding properties
* Dark mode
* Language picker

For implemented firebase cloud functions check `packages/functions` directory.

---

App locally communicates with firebase emulator as it's backend service, `firebase-tools` will install locally with `pnpm install` command.

---
To start frontend dev server cd into `frontend` dir and run
>npm run dev

---

In order to run it in `https` mode you will need to generate `key.pem` and `cert.pem` using `mkcert`,
otherwise comment out the `https` field in `quasar.config.js`.

---

Translation of an app is in progress.

Feel free to fork and use this however you want.
All contributions and ideas are welcome.

---

