let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;

/**
 * 给 fiber 节点创建其 dom 节点和设置其属性
 * @param {*} fiber
 */
const createDom = (fiber) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
};

/**
 * 提交并渲染 fiber tree
 */
const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  // 设置最后一次渲染后的 fiber tree 的引用
  currentRoot = wipRoot;
  wipRoot = null;
};

/**
 * 渲染 dom
 * @param {*} fiber
 */
const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
};

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
const updateDom = (dom, prevProps, nextProps) => {
  // 移除旧的或已修改过的事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 移除旧的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 设置新的或已更改的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 添加事件监听
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
};

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 该属性用于记录上一次提交dom后的 fiber tree 引用
    alternate: currentRoot,
  };
  deletions = [];
  // 设置第一个工作单元为 fiber tree 的 root
  nextUnitOfWork = wipRoot;
};

/**
 * 工作循环，浏览器空闲时就执行该函数
 * @param {*} deadline
 */
const workloop = (deadline) => {
  let shouldYield = false;
  // 浏览器空闲时创建并返回工作单元 fiber
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 如果没有下一个工作单元则表示 fiber tree 创建完成，开始渲染整个fiber tree
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workloop);
};

/**
 * 设置并返回工作单元 fiber
 * @param {*} fiber
 */
const performUnitOfWork = (fiber) => {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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

export const useState = (initial) => {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextunitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
};

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
};

/**
 * 协调器
 * @param {*} wipFiber
 * @param {*} elements
 */
const reconcileChildren = (wipFiber, elements) => {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
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
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    // 如果类型不同，并且有新的元素，则需要创建一个新的dom节点
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
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
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

requestIdleCallback(workloop);

export default render;
