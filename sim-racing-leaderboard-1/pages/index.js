import { useState } from 'react'

export default function Home() {
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [entries, setEntries] = useState([])

  const addEntry = () => {
    if (!name || !time) return
    const updated = [...entries, { name, time: parseFloat(time) }]
      .sort((a, b) => a.time - b.time)
      .slice(0, 5)
    setEntries(updated)
    setName('')
    setTime('')
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>🏁 Sim Racing Leaderboard</h1>
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Driver Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Best Lap Time (seconds)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          type="number"
          step="0.001"
          style={{ marginRight: 10 }}
        />
        <button onClick={addEntry}>Add</button>
      </div>

      <h2>Top 5</h2>
      <ol>
        {entries.map((entry, index) => (
          <li key={index}>
            {entry.name} - {entry.time.toFixed(3)}s
          </li>
        ))}
      </ol>
    </div>
  )
}
