# Studio Scarrone Downloader

A downloader that let you archive the payroll

## Install

Install the last stable NodeJS, clone this repo and

```bash
npm install
```

## Configuration

Setup the `.env` file following the `.env_template` file:

- **LOG_LEVEL**: the application log level.
- **PORTAL_USERNAME**: the username of the account on the payroll system.
- **PORTAL_PASSWORD**: the password of the account on the payroll system.
- **GOOGLE_DRIVE_FOLDER**: the folder id where to store the files on Google Drive.
- **GOOGLE_DRIVE_FILE_PREFIX**: the file name prefixes.

Than create a service account, create the authentication key and save the JSON file `googleapi.json`. Give the service account the privileges to access the folder specified in the environment variable `GOOGLE_DRIVE_FOLDER`.

## Run

```bash
npm start
```

## Debug

```bash
npm run debug
```
