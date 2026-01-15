import { useState, useEffect } from 'react';
import { BirthdayCircle, type Birthday } from '../components/BirthdayCircle';
import { loadBirthdaysFromCSV } from './loadBirthdays';
import './DemoPage.css';

export function DemoPage() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBirthdaysFromCSV('/birthdays.txt')
      .then((data) => {
        setBirthdays(data);
        console.log(`Loaded ${data.length} birthdays`);
      })
      .catch((e) => {
        console.error('Error loading birthdays:', e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="demo-page">
        <div className="demo-loading">Loading birthdays...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="demo-page">
        <div className="demo-error">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Birthday Circle</h1>
        <p className="demo-subtitle">
          A circular calendar visualization of birthdays throughout the year
        </p>
      </header>

      <main className="demo-main">
        <BirthdayCircle
          birthdays={birthdays}
          showControls={true}
          showTooltip={true}
          onBirthdayHover={(hovered, day) => {
            if (hovered) {
              console.log(`Hovering day ${day}:`, hovered);
            }
          }}
        />
      </main>

      <footer className="demo-footer">
        <p>Loaded {birthdays.length} birthdays</p>
      </footer>
    </div>
  );
}
