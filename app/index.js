// const element=<h1 title="foo">Hello</h1>
// const container=document.getElementById('root');
// ReactDOM.render(element,container);

/** start */
// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "Hello",
//   },
// };

// const container = document.getElementById("root");
// const node = document.createElement(element.type);
// node["title"] = element.props.title;

// const text = document.createTextNode("");
// text["nodeValue"] = element.props.children;

// node.appendChild(text);
// container.appendChild(node);
/** end */

/** start */
// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// );

// function createElement(type, props, ...children) {
//   return {
//     type,
//     props: {
//       ...props,
//       children: children.map((child) => {
//         typeof child === "object" ? child : createTextElement(child);
//       }),
//     },
//   };
// }

// function createTextElement(text) {
//   return {
//     type: "TEXT_ELEMENT",
//     props: {
//       nodeValue: text,
//       children: [],
//     },
//   };
// }

// function render(element, container) {
//   const dom =
//     element.type === "TEXT_ELEMENT"
//       ? document.createTextNode("")
//       : document.createElement(element.type);

//   const isProperty = (key) => key !== "children";
//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       dom[name] = element.props[name];
//     });

//   element.props.children.forEach((child) => {
//     render(child, dom);
//   });

//   container.appendChild(dom);
// }

// const MiniReact = {
//   createElement,
//   render,
// };

// const element = MiniReact.createElement(
//   "div",
//   { id: "foo" },
//   MiniReact.createElement("a", null, "bar"),
//   MiniReact.createElement("b")
// );

// const container = document.getElementById("root");
// MiniReact.render(element, container);

import { React, ReactDOM } from "mini-react";

const element = <div>Hello world!</div>;

ReactDOM.render(element, document.getElementById("root"));
