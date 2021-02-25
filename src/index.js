// 已渲染的fiber树的引用
let currentRoot = null;
// 正在构建的fiber树的引用
let workInProgressRoot = null;
// 当前已构建的fiber
let workInProgressFiber = null;
// 存放需要删除的fiber节点
let deletions = null;
let hookIndex = null;

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

// 创建fiber对应的dom节点
const createNode = (fiber) => {
  const node =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateNode(node, {}, fiber.props);

  return node;
};

const render = (element, container) => {
  workInProgressRoot = {
    stateNode: container,
    props: {
      children: [element],
    },
    // alternate 连接已渲染的fiber树的引用
    alternate: currentRoot,
  };
  deletions = [];
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
  // 是否函数组件
  const isFunctionComponent = fiber.type instanceof Function;

  // 这里在react中相当于是根据不同的tag，创建不同的子fiber节点
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 如果当前 fiber 节点有子节点则返回子节点
  if (fiber.child) {
    return fiber.child;
  }

  // 如果当前 fiber 节点没有子节点，则返回其兄弟节点，如果没有就一直向上查找。
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return;
  }
};

const updateFunctionComponent = (fiber) => {
  // workInProgressFiber = fiber;
  // workInProgressFiber.hooks = [];
  // hookIndex = 0;
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

const updateHostComponent = (fiber) => {
  if (!fiber.stateNode) {
    fiber.stateNode = createNode(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
};

// 协调阶段，给子节点打上标签，确定子节点是否新增、修改或者删除
const reconcileChildren = (fiber, elements) => {
  let index = 0;
  let oldFiber = fiber.alternate && fiber.alternate.child;
  let prevSibling = null;

  // 遍历当前 fiber 的子元素，并为每个子元素创建一个新的 fiber 节点
  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;

    // 如果旧的 fiber 与新的元素具有相同类型则可以保留其dom节点，只更新节点内容
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        stateNode: oldFiber.stateNode,
        return: fiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    // 如果类型不同，并且有新的元素，则需要创建一个新的dom节点
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        stateNode: null,
        return: fiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    // 如果类型不同，并且有旧的 fiber，则需要移除旧的 fiber 节点
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 把新建的 fiber 节点添加到 fiber tree中，将其设置为孩子节点或是兄弟节点
    if (index === 0) {
      fiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

// 渲染到页面上(commit阶段)
const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(workInProgressRoot.child);
  // 渲染完成后记录当前已渲染后的fiber树
  currentRoot = workInProgressRoot;
  // 构建中的fiber树已完成渲染，设置其引用为null
  workInProgressRoot = null;
};

const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }

  let parentFiber = fiber.return;
  while (!parentFiber.stateNode) {
    parentFiber = parentFiber.return;
  }

  const parentNode = parentFiber.stateNode;

  if (fiber.effectTag === "PLACEMENT" && fiber.stateNode != null) {
    parentNode.appendChild(fiber.stateNode);
  } else if (fiber.effectTag === "UPDATE" && fiber.stateNode !== null) {
    updateNode(fiber.stateNode, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, parentNode);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

// 更新节点
const updateNode = (node, prevProps, nextProps) => {
  // 移除旧的或已修改过的事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      node.removeEventListener(eventType, prevProps[name]);
    });

  // 移除旧的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      node[name] = "";
    });

  // 设置新的或已更改的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      node[name] = nextProps[name];
    });

  // 添加事件监听
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      node.addEventListener(eventType, nextProps[name]);
    });
};

// 移除节点
const commitDeletion = (fiber, parentNode) => {
  if (fiber.stateNode) {
    parentNode.removeChild(fiber.stateNode);
  } else {
    commitDeletion(fiber.child, parentNode);
  }
};

// 相当于react的 Scheduler
requestIdleCallback(workLoopConcurrent);

const useState = (initState) => {
  const oldHook =
    workInProgressFiber.alternate &&
    workInProgressFiber.alternate.hooks &&
    workInProgressFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initState,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    workInProgressRoot = {
      stateNode: currentRoot.stateNode,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    workInProgressFiber = workInProgressRoot;
    deletions = [];
  };

  workInProgressFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
};

export default {
  createElement,
  render,
  useState,
};
