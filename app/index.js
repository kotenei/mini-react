// import React, { useState } from "react";
// import ReactDOM from "react-dom";
import { default as MiniReact } from "mini-react";

// /**@jsx MiniReact.createElement */
// function App() {
//   const [count, setCount] = MiniReact.useState(1);
//   const [name, setName] = MiniReact.useState("abc");

//   return (
//     <div>
//       <h1>Count: {count}</h1>
//       <button
//         onClick={() => {
//           setCount((c) => c + 1);
//         }}
//       >
//         递增
//       </button>
//       &nbsp;
//       <button
//         onClick={() => {
//           setCount((c) => c - 1);
//         }}
//       >
//         递减
//       </button>
//     </div>
//   );
// }


const App = () => {
  return <div key="abc">Hello</div>;
};

const element = <App />;

console.log(<div key="Asdf">adsf</div>)

const container = document.getElementById("root");
MiniReact.render(element, container);
