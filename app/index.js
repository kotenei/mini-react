import { React, ReactDOM } from "mini-react";

const updateValue = (e) => {
  rerender(e.target.value);
};

const rerender = (value) => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  );
  ReactDOM.render(element, document.getElementById("root"));
};

rerender("World")
