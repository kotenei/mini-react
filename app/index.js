// import React, { useState } from "react";
// import ReactDOM from "react-dom";
import { default as MiniReact } from "mini-react";

// /**@jsx MiniReact.createElement */
function App() {
  const [count, setCount] = MiniReact.useState(1);
  const onClick = () => {
    setCount((c) => c + 1);
  };
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={onClick}>递增</button>
    </div>
  );
}

const element = <App />;
const container = document.getElementById("root");
MiniReact.render(element, container);
