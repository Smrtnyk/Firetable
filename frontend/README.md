# Firetable

Reservation management system frontend repository.
Based on Quasar and Firebase JavaScript SDK.

Frontend uses a mixture of .tsx and .vue files, but goal is to move all files to tsx.

To start using rename .env-example to .env and fill in the missing keys.
Also it is using firebase emulators in dev mode so make sure to install it globaly.
```bash
npm i -g firebase-tools
```
Then run a script in the root directory called `start:emulators`.

## Install the dependencies
```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Build the app for production
```bash
quasar build
```

## Support
"last 3 Chrome versions"

## TODO
* [ ] Complete translations for all components
* [ ] Make cloud function that will remove inactive users that are inactive for more than two months but put it behind a config flag
* [ ] Limit the amount of users that can be created on functions part
* [ ] Rate limit the table confirmation on the event to avoid spam
* [ ] Rate limit the guest confirmation on the guest list
* [ ] Make table disabled if someone is already reserving it
* [ ] Make reservations editable
* [ ] Make event editable
* [ ] Make floor editable on event level
* [ ] Add waiters schedule per event so for each event is known who works and where
