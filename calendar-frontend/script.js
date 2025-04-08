const CLIENT_ID = '1032345992294-48boa203ightsaf4o186tqgtu8c13l4n.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient;
let accessToken = null;
let gapiInited = false;
let gisInited = false;


const signInButton = document.getElementById("signin-btn");
const signOutButton = document.getElementById("signout-btn");
const calendarContainer = document.getElementById("calendar-events");


window.onload = () => {
  gapi.load("client", initializeGapiClient);
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: handleTokenResponse,
  });

  signInButton.onclick = () => tokenClient.requestAccessToken({ prompt: 'consent' });
  signOutButton.onclick = handleSignoutClick;
};

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
}

function handleTokenResponse(response) {
  if (response.error) {
    console.error("Token error:", response);
    return;
  }

  accessToken = response.access_token;
  signInButton.style.display = "none";
  signOutButton.style.display = "inline-block";

  fetchCalendarEvents();
}

function handleSignoutClick() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      calendarContainer.innerHTML = "Access revoked.";
      signInButton.style.display = "inline-block";
      signOutButton.style.display = "none";
    });
  }
}

async function fetchCalendarEvents() {
  calendarContainer.innerHTML = "🔄 Loading events...";

  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    });

    const events = response.result.items;
    displayEvents(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    calendarContainer.innerHTML = "❌ Failed to fetch events.";
  }
}

function displayEvents(events) {
  calendarContainer.innerHTML = "";

  if (!events || !events.length) {
    calendarContainer.textContent = "No upcoming events.";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  events
    .filter(event => event.start.date || event.start.dateTime)
    .sort((a, b) => new Date(a.start.date || a.start.dateTime) - new Date(b.start.date || b.start.dateTime))
    .forEach(event => {
      const title = event.summary || "Untitled";
      const start = event.start.date || event.start.dateTime;
      const date = new Date(start);
      const daysAway = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <div class="title">${title}</div>
        <div class="date">📅 ${date.toDateString()}</div>
        <div class="countdown">⏳ ${
          daysAway === 0 ? "🟡 Today!" :
          daysAway === 1 ? "1 day away" :
          `${daysAway} days away`
        }</div>
      `;
      calendarContainer.appendChild(card);
    });
}
