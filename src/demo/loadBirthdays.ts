import type { Birthday } from '../components/BirthdayCircle';

/**
 * Load birthdays from a CSV file
 * Expected format: Name,YYYY-MM-DD (one per line)
 */
export async function loadBirthdaysFromCSV(url: string): Promise<Birthday[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load birthdays: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line.includes(','))
    .map((line) => {
      const [name, dateStr] = line.split(',');
      return {
        name: name.trim(),
        date: new Date(dateStr.trim()),
      };
    })
    .filter((b) => !isNaN(b.date.getTime()));
}
