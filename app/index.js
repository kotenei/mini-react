// import React, { useState } from "react";
// import ReactDOM from "react-dom";
import { default as MiniReact } from "mini-react";

// /**@jsx MiniReact.createElement */
let flag = false;
function App() {
  const [count, setCount] = MiniReact.useState(0);
  // const [name, setName] = MiniReact.useState("abc");

  // if (!flag) {
  //   // setTimeout(() => {
  //   //   setCount(1);
  //   // }, 1000);

  //   flag = true;
  // }

  return (
    <div key="app">
      <h1>Count: {count}</h1>
      <button
        onClick={() => {
          setCount((c) => c + 1);
        }}
      >
        递增
      </button>
    </div>
  );
}

const element = <App />;
const container = document.getElementById("root");
MiniReact.render(element, container);
