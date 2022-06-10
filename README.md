# mini-react

此项目主要用于学习 React 源码。通过此项目，可以掌握 React 的一些基本术语，以及 React 的大概工作流程。

## JSX

JSX 是什么？大多数人只是简单把它理解为模板语法的一种，但它与 React 的运作机制之间存在千丝万缕的联系。我们知道 JSX 是无法在 JavaScript 上运行的，它甚至不是 JS 。但我们可以通过 Babel 把 JSX 转换成 JS 。从下图我们可以清晰看到 JSX 被编译为 React.createElement 的函数

![avatar](/images/1.png)

React.createElement 函数接收三个参数，分别是 tag, config 和 children，该函数最终会返回一个 JS 的对象。如下所示

```js

React.createElement(tag, config, children){
  return {
    $$typeof: Symbol(react.element),
    key: null,
    props: {},
    ref: null,
    type: ƒ AppFunc(),
    ...
  }
}

```

以下两种示例代码完全等效

```js
const element = (
  <div id="app">
    <p className="text">hello world!!!</p>
  </div>
);
```

```js
const element = React.createElement(
  "div",
  { id: "app" },
  React.createElement("p", { className: "text" }, "hello world!!!")
);
```

这里，我们可以看到 JSX 最终如何被转换为 JS 对象，该对象就是我们常说的虚拟 DOM 。

```js
// 注意：这是简化过的结构
const element = {
  type: "div",
  props: {
    id: "app",
    children: [
      {
        type: "p",
        props: {
          className: "text",
          children: ["hello world!!!"],
        },
      },
    ],
  },
};
```

很多人认为虚拟 DOM 最大的优势是减少 JS 操作真实 DOM 带来的性能消耗，但这并不是全部。 虚拟 DOM 最大的优势在于抽象原本的渲染过程，实现跨平台的能力，而不仅仅局限于浏览器的 DOM，可以是安卓和 IOS 的原生组件，可以是小程序，也可以是各种GUI。



## Fiber

目前浏览器刷新率为 60Hz（60 帧/s），每一帧耗时也就是在 16.6ms。 我们知道 js 可以操作 DOM， GUI 渲染线程与 JS 线程是互斥的，也就是 JS 的脚本执行和浏览器的布局、绘制是不能同时进行的。那在16.6ms内，浏览器做了如下图所示的工作。

![avatar](/images/2.png)

从上图可以简单理解为：

```js
JS脚本执行 -----  样式布局 ----- 样式绘制
```

当 JS 执行时间过长，超出了16.6ms，这次刷新就没有时间执行样式布局和样式绘制了，造成页面掉帧卡顿。

在 React Filber 出来之前， React 是通过递归的方式执行的，一旦开始就无法中断，当层级很深的时候，递归更新时间会超过16ms，用户交互就会卡顿。
为了能够满足快速响应，实现可中断异步更新代替同步更新，React 从 V15 升级到 V16 后重构了整个构架。


## Render and Commit Phases

## Reconciliation

## HOOKS
