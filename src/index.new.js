// 已渲染的fiber树的引用
let currentRoot = null;
// 正在构建的fiber树的引用
let workInProgressRoot = null;
// 当前已构建的fiber
let workInProgressFiber = null;

const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === "object" ? child : createTextElement(child);
      }),
    },
  };
};

const createTextElement = (text) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

// 创建dom
const createDom = (fiber) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  return dom;
};

const render = (element, container) => {
  workInProgressRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // alternate 连接已渲染的fiber树的引用
    alternate: currentRoot,
  };
  workInProgressFiber = workInProgressRoot;
};

// 并发模式（时间分片）
const workLoopConcurrent = (deadline) => {
  // 获取当前浏览器帧的剩余时间
  // 这里的shouldYield在react中是通过Scheduler模块提供，用来判断是否需要中断遍历
  const shouldYield = deadline.timeRemaining() < 1;

  // 构建fiber树
  while (workInProgressFiber && !shouldYield) {
    workInProgressFiber = performUnitOfWork(workInProgressFiber);
  }

  // 如果fiber树已构建完,则render阶段的工作结束，已进入渲染阶段
  if (!workInProgressFiber && workInProgressRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoopConcurrent);
};

// 创建并返回下一个fiber节点（render阶段）
const performUnitOfWork = (fiber) => {
  beginWork(fiber);

  // 如果当前 fiber 节点有子节点则返回子节点
  if (fiber.child) {
    return fiber.child;
  }

  // 如果当前 fiber 节点没有子节点，则尝试返回其兄弟节点，如果没有就一直向上查找其父节点，直到所有 fiber 节点创建完成
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};

const beginWork = (fiber) => {
  // 是否函数组件
  const isFunctionComponent = fiber.type instanceof Function;

  // 这里在react中相当于是根据不同的tag，创建不同的子fiber节点
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
};

const updateFunctionComponent = (fiber) => {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
};

// 协调阶段，给节点打上标签，确定节点是否新增、修改或者删除
const reconcileChildren = (fiber, children) => {};

// 渲染到页面上(commit阶段)
const commitRoot = () => {
  // TODO

  // 渲染完成后记录当前已渲染后的fiber树
  currentRoot = workInProgressRoot;
  // 构建中的fiber树已完成渲染，设置其引用为null
  workInProgressRoot = null;
};

// 相当于react的 Scheduler
requestIdleCallback(workLoopConcurrent);


const useState = (initState) => {};

export default {
  createElement,
  render,
  useState,
};
