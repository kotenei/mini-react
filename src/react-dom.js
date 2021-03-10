import { createFiber } from "./createFiber";
import { Deletion, Placement, Update } from "./effectTags";
import { FunctionComponent, HostComponent, HostRoot } from "./workTags";

let currentRoot = null;
let workInProgressRoot = null;
let workInProgress = null;
let deletions = null;
let root;

const render = (element, container) => {
  const rootFiber = createFiber(
    HostRoot,
    {
      children: [element],
    },
    null
  );
  rootFiber.stateNode = container;
  // rootFiber.alternate = currentRoot;

  root = {
    current: rootFiber,
    finishedWork: rootFiber.alternate,
  };

  deletions = [];
  workInProgress = root.current;
  root.current.alternate = workInProgress;
  requestIdleCallback(workLoopConcurrent);
};

// 创建fiber对应的dom节点
const createNode = (fiber) => {
  const node =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  //  updateNode(node, {}, fiber.props);

  return node;
};

// 工作循环（时间分片）
const workLoopConcurrent = (deadline) => {
  // 获取当前浏览器帧的剩余时间
  // 这里的shouldYield在react中是通过Scheduler模块提供，用来判断是否需要中断遍历
  const shouldYield = deadline.timeRemaining() < 1;

  // 构建fiber树
  while (workInProgress && !shouldYield) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (!workInProgress) {
    commitRoot();
  }

  requestIdleCallback(workLoopConcurrent);
};

// 创建并返回下一个fiber节点（render阶段)
const performUnitOfWork = (currentFiber) => {
  beginWork(currentFiber);

  if (currentFiber.child) {
    return currentFiber.child;
  }

  // 如果当前 fiber 节点没有子节点，则返回兄弟节点，如果没有就一直向上查找。
  while (currentFiber) {
    completeUnitOfWork(currentFiber);
    if (currentFiber.sibling) {
      return currentFiber.sibling;
    }
    currentFiber = currentFiber.return;
  }
};

const beginWork = (currentFiber) => {
  const tag = currentFiber.tag;
  switch (tag) {
    case HostRoot:
      updateHostRoot(currentFiber);
      break;
    case HostComponent:
      updateHostComponent(currentFiber);
      break;
    case FunctionComponent:
      updateFunctionComponent(currentFiber);
      break;
    default:
      break;
  }
};

const completeUnitOfWork = (currentFiber) => {};

const updateHostRoot = (currentFiber) => {
  const children = currentFiber.pendingProps;
  reconcileChildren(currentFiber, children);
};

const updateHostComponent = (currentFiber) => {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createNode(currentFiber);
  }
  reconcileChildren(currentFiber, currentFiber.pendingProps.children);
};

const updateFunctionComponent = (currentFiber) => {
  const children = [currentFiber.type(currentFiber.pendingProps)];
  reconcileChildren(currentFiber, children);
};

// 协调阶段，给子 fiber 打上标签，确定是否新增、修改或者删除
const reconcileChildren = (currentFiber, children) => {
  let index = 0;
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
  let prevSibling = null;

  while (index < children.length || oldFiber) {
    const child = children[index];
    let newFiber;
    let isSameType =
      oldFiber &&
      child &&
      oldFiber.type === child.type &&
      oldFiber.key === child.key;

    // 不是不同类型并且有新元素，表示新建，打上 Placement 标识
    if (!isSameType && child) {
      let tag = typeof child === "function" ? FunctionComponent : HostComponent;
      newFiber = createFiber(tag, child.props, child.key);
      newFiber.type = child.type;
      newFiber.return = currentFiber;
      newFiber.effectTag = Placement;
    }

    // 如果是相同类型，则复用旧 fiber，打上 Update 标识
    if (isSameType) {
      newFiber = createFiber(oldFiber.tag, child.props, oldFiber.key);
      newFiber.type = oldFiber.type;
      newFiber.stateNode = oldFiber.stateNode;
      newFiber.alternate = oldFiber;
      newFiber.return = currentFiber;
      newFiber.effectTag = Update;
    }

    // 如果类型不同，并且有旧的 fiber，则需要删除旧的 fiber，打上 Deletion 标识
    if (!isSameType && oldFiber) {
      oldFiber.effectTag = Deletion;
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      currentFiber.child = newFiber;
    } else if (child) {
      prevSibling.sibling = newFiber;
    }

    index++;
    prevSibling = newFiber;
  }
};

// render 阶段
const commitRoot = () => {
  // workInProgressRoot = null;
  // currentRoot = rootFiber;
  // root.finishedWork = null;
};

const commitWork = () => {};

export default render;
