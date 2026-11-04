import {BrowserRouter , Routes,  Route} from "react-router-dom";

function Home() {
  return (
    <div className = "flex min-h-screen items-center justify-center bg-background">
       <div className = "text-center">
        <h1 className =" text-5xl font-bold tracking-tight">
          Code<span className="text-primary">Collab</span>
        </h1>
        <p className = "mt-4 text-text-secondary">
          Collaborative Coding & Interview Platform
        </p>

        
        <div className = "mt-8 inline-flex gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400 ">
          <span className = "h-2 w-2 rounded-full bg-green-400"></span>Frontend is running successfully
        </div>
       </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;