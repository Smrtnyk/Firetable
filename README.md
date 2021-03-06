[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Smrtnyk_Firetable&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Smrtnyk_Firetable)

## FIRETABLE

### An event management system.
Frontend is made with Quasar which uses Vue as its framework.
Backend communication is done with Firebase and cloud functions.

Current capabilities on frontend are:
* Floor management
* Event management
* User management
* Dark mode

Implemented firebase cloud functions:
* Event creation
* User creation
* User removal
* Automatic old event removal after certain time
* Document removal with all its children
* Trigger function that removes image of an event from storage when event is deleted
* Trigger function that listens on reservation creation and does various calculations and push messaging to the users

---

App locally communicates with firebase emulator as it's backend service, so make sure to install `firebase-tools` globaly.
>npm i -g firebase-tools

---
To start frontend dev server cd into `frontend dir` and run
>npm run dev

---

In order to run it in `https` mode you will need to generate `key.pem` and `cert.pem` using `mkcert`,
otherwise comment out the `https` field in `quasar.config.js`.
Make sure to rename `.env-example` to `.env` and fill in the firebase info.

---

Translation of an app is in progress.

Feel free to fork and use this however you want.
All contributions and ideas are welcome.

---

### Floor editor
![Floor editor](https://github.com/Smrtnyk/Firetable/blob/master/screenshots/floor-editor.jpg?raw=true)


### Event info
![Event info](https://github.com/Smrtnyk/Firetable/blob/master/screenshots/event-info.jpg?raw=true)

## Some things that would be nice to have
* [ ] Complete translations for all components
* [ ] Make cloud function that will remove inactive users that are inactive for more than two months
* [ ] Limit the amount of users that can be created on functions part
* [ ] Rate limit the table confirmation on the event to avoid spam
* [ ] Rate limit the guest confirmation on the guest list
* [ ] Make table disabled if someone is already reserving it
* [ ] Make reservations editable
* [x] Make event editable
* [x] Make floor editable on event level
* [ ] Add waiters schedule per event so for each event is known who works and where
* [x] Move to package based monorepo
* [ ] Make it possible to add new table on event map
* [ ] Implement an option to add a wall on the floor map
* [ ] Center the text on home page when there are no events
* [ ] Fix the touch behavior on map editor on mobile
