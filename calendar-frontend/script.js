let compactMode = false;
let lastFetchedEvents = [];

// -- LOCAL EVENTS FROM YOUR SERVER --
async function fetchEvents() {
  try {
    const res = await fetch("https://rohanbagga-github-io.onrender.com/events");
    return res.json();
  } catch (e) {
    document.getElementById("events").innerText = "Could not load events.";
    console.error(e);
    return [];
  }
}

function getDaysRemaining(dateStr) {
  const today = new Date();
  const eventDate = new Date(dateStr);
  const diffTime = eventDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getTag(summary) {
  summary = summary.toLowerCase();
  if (summary.includes("birthday")) return "birthday";
  if (summary.includes("exam") || summary.includes("test")) return "exam";
  if (summary.includes("meeting") || summary.includes("project")) return "work";
  return "default";
}

function renderEvents(events) {
  const container = document.getElementById("events");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filterDays = document.getElementById("dateFilter").value;

  container.innerHTML = "";

  const filtered = events.filter(e => {
    const days = getDaysRemaining(e.date);
    const matchSearch = e.summary.toLowerCase().includes(search) || e.date.includes(search);
    const matchTime = filterDays === "all" || days <= parseInt(filterDays);
    return days >= 0 && matchSearch && matchTime;
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p>No matching events.</p>";
    return;
  }

  filtered.forEach(event => {
    const div = document.createElement("div");
    const tag = getTag(event.summary);
    div.className = `event-card ${tag}`;

    const days = getDaysRemaining(event.date);
    const countdownText = days === 0
      ? "🟡 Today!"
      : `${days} day${days > 1 ? "s" : ""} remaining`;

    div.innerHTML = compactMode
      ? `<strong>${event.summary}</strong> — ${countdownText}`
      : `
        <div class="title">${event.summary}</div>
        <div class="date">📅 ${new Date(event.date).toDateString()}</div>
        <div class="countdown">⏳ ${countdownText}</div>
      `;

    container.appendChild(div);
  });
}

function initEventRendering() {
  fetchEvents().then(events => {
    lastFetchedEvents = events;
    renderEvents(events);
    document.getElementById("searchInput").addEventListener("input", () => renderEvents(events));
    document.getElementById("dateFilter").addEventListener("change", () => renderEvents(events));
    document.getElementById("toggleView").addEventListener("click", () => {
      compactMode = !compactMode;
      renderEvents(events);
    });
  });
}

// -- GOOGLE SIGN IN (REDIRECT MODE) --
function startGoogleAuth() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      clientId: '1032345992294-48boa203ightsaf4o186tqgtu8c13l4n.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
    }).then(() => {
      const authInstance = gapi.auth2.getAuthInstance();
      authInstance.signIn({
        ux_mode: 'redirect'
      });
    });
  });
}

function checkForSignedInUser() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      clientId: '1032345992294-48boa203ightsaf4o186tqgtu8c13l4n.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
    }).then(() => {
      const authInstance = gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();

      if (user.isSignedIn()) {
        const accessToken = user.getAuthResponse().access_token;
        localStorage.setItem("google_access_token", accessToken);

        fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        .then(res => res.json())
        .then(data => displayEvents(data.items))
        .catch(err => console.error("Error fetching events:", err));
      }
    });
  });
}

// -- CALENDAR EVENTS DISPLAY --
function displayEvents(events) {
  const container = document.getElementById("calendar-events");
  container.innerHTML = "";

  events.forEach(event => {
    const div = document.createElement("div");
    div.textContent = `📅 ${event.summary || "No Title"} - ${event.start?.dateTime || event.start?.date}`;
    container.appendChild(div);
  });
}

// -- PAGE LOAD INIT --
window.onload = () => {
  initEventRendering();
  checkForSignedInUser(); // fetch calendar events if returning from redirect
};


  
  