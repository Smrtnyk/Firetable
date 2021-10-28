[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Smrtnyk_Firetable&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Smrtnyk_Firetable)

## FIRETABLE

### An event management system.
Frontend is made with Quasar which uses Vue as its framework.
Backend communication is done with Firebase and cloud functions.

Current capabilities on fronted are:
* Floor management
* Event management
* User management
* Dark mode

Implemented functions:
* Event creation
* User creation
* User removal
* Automatic old event removal after certain time
* Document removal with all its children
* Trigger function that removes image of an event from storage when event is deleted
* Trigger function that listens on reservation creation and does various calculations and push messaging to the users

---

App localy communicates with firebase emulator as it's backend service, so make sure to install `firebase-tools` globaly.
>npm i -g firebase-tools

Translation of an app is in progress.

Feel free to fork and use this however you want.
All contributions and ideas are welcome.

---

### Floor editor
![Floor editor](https://github.com/Smrtnyk/Firetable/blob/master/screenshots/floor-editor.jpg?raw=true)


### Event info
![Event info](https://github.com/Smrtnyk/Firetable/blob/master/screenshots/event-info.jpg?raw=true)
