import React, { useState } from "react";
import ReactDOM from "react-dom";
// import { default as MiniReact } from "mini-react";

// /**@jssx MiniReact.createElement */
function App() {
  const [count, setCount] = React.useState(1);
  const [name, setName] = React.useState("abc");

  return (
    <div key="aaa">
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

const element = <App key="111" />;

  console.log(element);


const container = document.getElementById("root");
ReactDOM.render(element, container);
