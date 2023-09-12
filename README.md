_The Economist's_ chart-making tool, written in React and D3 using `create-react-app`.

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
