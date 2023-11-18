_The Economist's_ chart-making tool, written in React and D3 using `create-react-app`.

## About Sibyl 1.5
As of September 2023, there are conflicting versions of Silver Bullet on the loose. This is Donald Hounam's rogue version, created because of apparently unsurmountable permissions issues. This version is closely related to Sibyl 1.

It incorporates a mod to read in lookup assets at runtime.
It includes the Chartwrapper component, which was hived out as a separate component in the original Sibyl 1, in preparation for development of Sibyl 2.
This version 1.5 is the one currently used in live production at The Economist

## Getting started

Clone Silver Bullet (also known as Sibyl) and clone [Monteux](https://github.com/TheEconomist/monteux) as well. Monteux is a Google Sheets adapter we wrote to interface with the Google Drive API.

Install Sibyl doing `npm install`. Install Monteux with `npm start` as well.

Now you can run `npm start` both in Sibyl and Monteux and start developing (you'll have to use the Monteux port to develop).

## Deployment

First you need to install `lftp`, a command line tool to upload to our FTP. Do `brew install lftp` on a macOS system.

To deploy Sibyl you'd need to create an `.env` file with the infographics FTP user and password like the `.env.example` file (paste the credentials without quotes)

After doing that you'll be able to run the following commands:

Deploys Sibyl to **both** _The Economist_ and the EIU folders:

```bash
npm run deploy
```

Deploys **only** to _The Economist_ folder:

```bash
npm run economist:deploy
```

Deploys to _The Economist_ Sibyl test folder:

```bash
npm run test:deploy
```

Deploys **only** to the EIU folder:

```bash
npm run eiu:deploy
```
