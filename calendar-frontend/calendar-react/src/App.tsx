import { useEffect, useState } from 'react';
import './App.css';

// ✅ 1. Define your event type
type CalendarEvent = {
  summary: string;
  date: string;
};

const BACKEND_URL = 'https://rohanbagga-github-io.onrender.com/events';

function App() {
  // ✅ 2. Tell React your events are of type CalendarEvent[]
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    fetch(BACKEND_URL)
      .then(res => res.json())
      .then((data: CalendarEvent[]) => setEvents(data)) // ✅ 3. Cast fetched data
      .catch(err => console.error('Failed to load events', err));
  }, []);

  const getDaysRemaining = (dateStr: string): number => {
    const today = new Date();
    const eventDate = new Date(dateStr);
    const diff = eventDate.getTime() - today.getTime(); // ✅ Safe numeric math
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredEvents = events.filter((e: CalendarEvent) => {
    const days = getDaysRemaining(e.date);
    const matchSearch = e.summary.toLowerCase().includes(search.toLowerCase()) || e.date.includes(search);
    const matchTime = filter === 'all' || days <= parseInt(filter);
    return days >= 0 && matchSearch && matchTime;
  });

  return (
    <div className="container">
      <h1>🎯 Upcoming All-Day Events</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="🔍 Search by title or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">📅 All Future Events</option>
          <option value="7">🗓️ Next 7 Days</option>
          <option value="30">📆 This Month</option>
        </select>
        <button onClick={() => setCompact(prev => !prev)}>🔁 Toggle Compact View</button>
      </div>

      <div className="event-list">
        {filteredEvents.length === 0 ? (
          <p>No matching events.</p>
        ) : (
          filteredEvents.map((e: CalendarEvent) => {
            const days = getDaysRemaining(e.date);
            const countdown =
              days === 0
                ? '🟡 Today!'
                : `${days} day${days !== 1 ? 's' : ''} remaining`;
            return (
              <div key={e.summary + e.date} className="event-card">
                {compact ? (
                  <strong>{e.summary} — {countdown}</strong>
                ) : (
                  <>
                    <div className="title">{e.summary}</div>
                    <div className="date">📅 {new Date(e.date).toDateString()}</div>
                    <div className="countdown">⏳ {countdown}</div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;
