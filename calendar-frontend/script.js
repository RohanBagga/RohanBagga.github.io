let tokenClient;
let accessToken = null;

const CLIENT_ID = "1032345992294-48boa203ightsaf4o186tqgtu8c13l4n.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

window.onload = () => {

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


  document.getElementById("signin-btn").addEventListener("click", () => {
    tokenClient.requestAccessToken();
  });


  document.getElementById("signout-btn").addEventListener("click", () => {
    accessToken = null;
    localStorage.removeItem("google_access_token");
    document.getElementById("signin-btn").style.display = "inline-block";
    document.getElementById("signout-btn").style.display = "none";
    document.getElementById("calendar-events").innerHTML = "";
  });


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

  function displayEvents(events) {
    const container = document.getElementById("calendar-events");
    container.innerHTML = ""; // Clear container before adding new content
  
    if (!events.length) {
      container.textContent = "No events found.";
      return;
    }
  
    // Filter only all-day events and future events
    const futureAllDayEvents = events
      .filter(event => {
        // Check if it's an all-day event by verifying the presence of `start.date`
        const rawDate = event.start?.date;
        console.log(rawDate);
        const eventDate = new Date(rawDate);
  
        // Return only events that have a start date and are in the future
        return rawDate && eventDate >= new Date();
      })
      .sort((a, b) => {
        // Sort by event date (ascending order)
        const aDate = new Date(a.start?.date);
        const bDate = new Date(b.start?.date);
        return aDate.getTime() - bDate.getTime(); // Sorting by date
      });
  
    // If no future events, display message
    if (!futureAllDayEvents.length) {
      container.textContent = "No upcoming all-day events.";
      return;
    }
  
    // Loop through the sorted future all-day events to display them
    futureAllDayEvents.forEach(event => {
      const div = document.createElement("div");
  
      const title = event.summary || "Untitled";
      const rawDate = event.start?.date; // Use only the `date` field (no time)
      const eventDate = new Date(rawDate);
  
      const diffTime = eventDate - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
      // Countdown text based on days remaining
      const countdownText =
        diffDays === 0
          ? "🟡 Today!"
          : diffDays === 1
          ? "1 day remaining"
          : diffDays >= 7
          ? "🔥 This week!"
          : diffDays >= 30
          ? "🌟 Next month!"
          : `${diffDays} days remaining`;
  
      let tagClass = "default";
      const lowered = title.toLowerCase();
      if (lowered.includes("birthday")) tagClass = "birthday";
      else if (lowered.includes("exam") || lowered.includes("test")) tagClass = "exam";
      else if (lowered.includes("meeting") || lowered.includes("project")) tagClass = "work";
  
      div.className = `event-card ${tagClass}`;
      div.innerHTML = `
        <div class="title">${title}</div>
        <div class="date">📅 ${eventDate.toDateString()}</div>
        <div class="countdown">⏳ ${countdownText}</div>
      `;
  
      container.appendChild(div);
    });
  }
}