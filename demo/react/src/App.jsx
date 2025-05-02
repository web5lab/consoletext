import './App.css'

function App() {

  return (
    <>
      <div>
        <button onClick={() => {
          console.error("error log");
        }}>click me</button>
      </div>
    
    </>
  )
}

export default App
