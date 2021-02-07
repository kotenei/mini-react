import { React, ReactDOM } from "mini-react";

function Counter() {
  const [state, setState] = ReactDOM.useState(1);
  return (
    <div>
      <h1>Count: {state}</h1>
      <button onClick={() => setState((c) => c + 1)}>递增</button>
    </div>
  );
}

const element = <Counter />;
const container = document.getElementById("root");
ReactDOM.render(element, container);
