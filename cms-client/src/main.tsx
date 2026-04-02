import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { Button } from "./components/ui/button";

const App = () => {
  return (
    <div className="text-3xl font-bold underline">
      <p>CMS Client</p>
      <Button
        onClick={() => {
          console.log("Button clicked");
        }}
      >
        Click me
      </Button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
