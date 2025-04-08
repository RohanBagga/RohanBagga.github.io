let tokenClient;
let accessToken = null;

const CLIENT_ID = "1032345992294-48boa203ightsaf4o186tqgtu8c13l4n.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

window.onload = () => {
  // Initialize GIS token client
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      localStorage.setItem("google_access_token", accessToken);
      document.getElementById("signout-btn").style.display = "inline-block";
      document.getElementById("signin-btn").style.display = "none";
      fetchCalendarEvents();
    },
  });

  // Sign in
  document.getElementById("signin-btn").addEventListener("click", () => {
    tokenClient.requestAccessToken();
  });

  // Sign out
  document.getElementById("signout-btn").addEventListener("click", () => {
    accessToken = null;
    localStorage.removeItem("google_access_token");
    document.getElementById("signin-btn").style.display = "inline-block";
    document.getElementById("signout-btn").style.display = "none";
    document.getElementById("calendar-events").innerHTML = "";
  });

  // Auto-restore session if token exists
  const storedToken = localStorage.getItem("google_access_token");
  if (storedToken) {
    accessToken = storedToken;
    document.getElementById("signin-btn").style.display = "none";
    document.getElementById("signout-btn").style.display = "inline-block";
    fetchCalendarEvents();
  }
};

function fetchCalendarEvents() {
  fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(res => res.json())
    .then(data => displayEvents(data.items))
    .catch(err => console.error("Failed to load events:", err));
}

function displayEvents(events) {
  const container = document.getElementById("calendar-events");
  container.innerHTML = "";

  if (!events.length) {
    container.textContent = "No events found.";
    return;
  }

  events.forEach(event => {
    const div = document.createElement("div");
    div.className = "event-card";
    div.textContent = `📅 ${event.summary || "Untitled"} - ${event.start?.dateTime || event.start?.date}`;
    container.appendChild(div);
  });
}

  