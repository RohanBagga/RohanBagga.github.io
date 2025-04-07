import fs from 'fs';
import express from 'express';
import { google } from 'googleapis';
import open from 'open';
import cors from 'cors'; 

const app = express();
app.use(cors()); 
const PORT = 3000;

const CREDENTIALS_PATH = 'googleCal_cred.json';
const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

function authorize(callback) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(process.env.GOOGLE_TOKEN));
    callback(oAuth2Client);
  } else {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting:', authUrl);
    open(authUrl);

    app.get('/oauth2callback', (req, res) => {
      const code = req.query.code;
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return res.send('Error retrieving access token');
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        res.send('Authentication successful! You can close this tab.');
      });
    });
  }
}

app.get('/events', (req, res) => {
  authorize(async auth => {
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const now = new Date();

      const result = await calendar.events.list({
        calendarId: 'rohanbagga123@gmail.com', 
        timeMin: now.toISOString(),         

        maxResults: 500,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const filtered = result.data.items
        .filter(event => {
          const start = event.start;
          const isAllDay = !!start?.date;
          const isFakeAllDay = start?.dateTime?.endsWith("T00:00:00Z") &&
                               event.end?.dateTime?.endsWith("T00:00:00Z");
          return isAllDay || isFakeAllDay;
        })
        .map(event => ({
          summary: event.summary || '(No Title)',
          date: event.start.date || event.start.dateTime,
        }));

      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json(filtered);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).send('Failed to fetch events');
    }
  });
});

app.get('/', (req, res) => {
  res.send('✅ Calendar backend is running.');
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
