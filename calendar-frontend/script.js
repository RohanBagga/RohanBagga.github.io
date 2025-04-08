const CLIENT_ID = '1032345992294-48boa203ightsaf4o186tqgtu8c13l4n.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient;
let accessToken = null;
let allEvents = [];

// DOM elements
const signInButton = document.getElementById("signin-btn");
const signOutButton = document.getElementById("signout-btn");
const calendarContainer = document.getElementById("calendar-events");
const searchInput = document.getElementById("searchInput");
const dateFilter = document.getElementById("dateFilter");

window.onload = () => {
  gapi.load("client", initializeGapiClient);

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: handleTokenResponse,
  });

  signInButton.onclick = () => tokenClient.requestAccessToken({ prompt: 'consent' });
  signOutButton.onclick = handleSignoutClick;

  searchInput.addEventListener("input", filterAndDisplayEvents);
  dateFilter.addEventListener("change", filterAndDisplayEvents);
};

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
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
      maxResults: 100,
    });

    console.log("Raw events response:", response);

    allEvents = (response.result.items || []).filter(e => !!e.start?.date); // All-day only
    console.log("Filtered all-day events:", allEvents);

    filterAndDisplayEvents(); // trigger display
  } catch (error) {
    console.error("❌ Failed to fetch events:", error);
    calendarContainer.innerHTML = "❌ Failed to fetch events.";
  }
}


function filterAndDisplayEvents() {
  calendarContainer.innerHTML = "";

  const query = searchInput.value.toLowerCase();
  const filterDays = dateFilter.value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = allEvents
  .filter(event => {
    const rawDate = event.start?.date;
    if (!rawDate) return false;
  
    const eventDate = new Date(rawDate);
    eventDate.setHours(0, 0, 0, 0);
  
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  
    const title = (event.summary || "").toLowerCase().trim();
    const matchesSearch = title.includes(query.toLowerCase().trim());
    const matchesDate =
      filterDays === "all" || (diffDays >= 0 && diffDays <= parseInt(filterDays));
  
    return diffDays >= 0 && matchesSearch && matchesDate;
  })  
    .sort((a, b) => new Date(a.start.date) - new Date(b.start.date));

  if (!filtered.length) {
    calendarContainer.innerHTML = "<p>No matching all-day events.</p>";
    return;
  }

  filtered.forEach(event => {
    const title = event.summary || "Untitled";
    const rawDate = event.start.date;
    const eventDate = new Date(rawDate);

    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <div class="title">${title}</div>
      <div class="date">📅 ${eventDate.toDateString()}</div>
      <div class="countdown">⏳ ${
        diffDays === 0 ? "🟡 Today!" :
        diffDays === 1 ? "1 day away" :
        `${diffDays} days away`
      }</div>
    `;
    calendarContainer.appendChild(div);
  });
}