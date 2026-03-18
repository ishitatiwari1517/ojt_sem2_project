import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then(res => res.json())
      .then(data => console.log("SUCCESS:", data))
      .catch(err => console.error("ERROR:", err));
  }, []);

  return <h1>EnergyLens Running</h1>;
}

export default App;