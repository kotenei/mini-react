import { default as MiniReact } from "mini-react";

/** @jsx MiniReact.createElement */
function Counter() {
  const [state, setState] = MiniReact.useState(1);
  const onClick = () => {
    setState((c) => c + 1);
  };
  return (
    <div>
      <h1>Count: {state}</h1>
      <button onClick={onClick}>递增</button>
    </div>
  );
}

const element = <Counter />;
const container = document.getElementById("root");
MiniReact.render(element, container);
