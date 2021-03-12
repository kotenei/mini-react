// import React, { useState } from "react";
// import ReactDOM from "react-dom";
import { default as MiniReact } from "mini-react";

// /**@jsx MiniReact.createElement */
let flag = false;
function App() {
  const [count, setCount] = MiniReact.useState(0);
  const [name, setName] = MiniReact.useState("abc");

  if (!flag) {
    setTimeout(() => {
      setCount(1);
      setCount(2);
    }, 1000);

    // setTimeout(() => {
    //   // setCount(2);
    //   setName("aaa");
    // }, 3000);
    flag = true;
  }

  return (
    <div>
      <h1>Count: {count}</h1>
      <button
        onClick={() => {
          setCount((c) => c + 1);
        }}
      >
        递增
      </button>
      &nbsp;
      <button
        onClick={() => {
          setCount((c) => c - 1);
        }}
      >
        递减
      </button>
    </div>
  );
}

const element = <App />;
const container = document.getElementById("root");
MiniReact.render(element, container);
