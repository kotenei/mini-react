import { React, ReactDOM } from "mini-react";

function Counter() {
  // const [state, setState] = useState(1);
  // return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>;
  return <div>Hi</div>
}

const element = <Counter />;
const container = document.getElementById("root");
ReactDOM.render(element, container);
