import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

const App = () => {
  return <div className="text-3xl font-bold underline">CMS Client</div>;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
