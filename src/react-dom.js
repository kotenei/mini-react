import { createFiber } from "./createFiber";
import { Deletion, Placement, Update } from "./effectTags";
import { FunctionComponent, HostComponent, HostRoot } from "./workTags";
import { createNode, updateNode } from "./utils";

let workInProgress = null;
let deletions = null;
let isMount = true;
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

  root = {
    current: rootFiber,
  };

  sechedule();
  requestIdleCallback(workLoopConcurrent);
};

// 工作循环（时间分片）
const workLoopConcurrent = (deadline) => {
  // 获取当前浏览器帧的剩余时间
  // 这里的 shouldYield 在 react 中是通过 Scheduler 模块提供，用来判断是否需要中断遍历
  const shouldYield = deadline.timeRemaining() < 1;

  // 构建fiber树
  while (workInProgress && !shouldYield) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  // 如果fiber树已构建完,则 render 阶段的工作结束，已进入渲染阶段
  if (!workInProgress && root.finishedWork) {
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

// 构建子 fiber 节点
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
  const { children } = currentFiber.pendingProps;
  reconcileChildren(currentFiber, children);
};

const updateHostComponent = (currentFiber) => {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createNode(currentFiber);
  }
  reconcileChildren(currentFiber, currentFiber.pendingProps.children);
};

let workInProgressFiber = null;
let workInProgressHook = null;
const updateFunctionComponent = (currentFiber) => {
  workInProgressFiber = currentFiber;
  workInProgressHook = currentFiber.memoizedState;
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
      let tag =
        typeof child.type === "function" ? FunctionComponent : HostComponent;
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
  // 渲染完成后更改current指向
  root.current = root.finishedWork;
  root.finishedWork = null;
  if (!isMount) {
    isMount = true;
  }
};

const commitWork = () => {};

// 模拟React开始调度更新
const sechedule = () => {
  const rootFiber = root.current;

  workInProgress = rootFiber.alternate;

  if (!workInProgress) {
    workInProgress = createFiber(
      rootFiber.tag,
      rootFiber.pendingProps,
      rootFiber.key
    );
    workInProgress.stateNode = rootFiber.stateNode;
    workInProgress.alternate = rootFiber;
    rootFiber.alternate = workInProgress;
  } else {
    workInProgress.effectTag = null;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  workInProgress.memoizedState = rootFiber.memoizedState;

  root.finishedWork = root.current.alternate;
  deletions = [];
};

export const useState = (initialState) => {
  let hook;

  // 是否初始
  if (!isMount) {
    hook = {
      queue: {
        pending: null,
      },
      // hook 状态
      memoizedState: initialState,
      // 指向下个 hook
      next: null,
    };

    if (!workInProgressFiber.memoizedState) {
      workInProgressFiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }

    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;
    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending);

    hook.queue.pending = null;
  }

  return [baseState, null];
};

export default render;
