export default function TestPage() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'red', color: 'white', fontSize: '3rem' }}>
      <h1>🔥 TEST PAGE WORKING 🔥</h1>
      <p>If you see this, routing works!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}
