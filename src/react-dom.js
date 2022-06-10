import { createFiber } from "./createFiber";
import { Deletion, Placement, Update } from "./effectTags";
import { FunctionComponent, HostComponent, HostRoot } from "./workTags";
import { createNode, updateNode } from "./utils";

let workInProgressRoot = null;
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

  schedule();
};

// 工作循环（时间切片）
const workLoopConcurrent = (deadline) => {
  // 获取当前浏览器帧的剩余时间
  // 这里的 shouldYield 在 react 中是通过 Scheduler 模块提供，用来判断是否需要中断遍历
  const shouldYield = deadline.timeRemaining() < 1;

  // 构建 fiber 树
  while (workInProgress && !shouldYield) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  // 如果 fiber 树已构建完,则 render 阶段的工作结束，已进入渲染阶段
  if (!workInProgress && workInProgressRoot) {
    commitRoot();
  } else {
    requestIdleCallback(workLoopConcurrent);
  }
};

// 创建并返回下一个 fiber 节点（render阶段)
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

// 收集副作用链接
// 每个 fiber 有两个属性
// firstEffect 指向第一个有副作用的子 fiber
// lastEffect 指向最后一个有副作用的子 fiber
// 中间的用 nextEffect 做成一个单链表
const completeUnitOfWork = (currentFiber) => {
  const returnFiber = currentFiber.return;

  if (returnFiber) {
    const effectTag = currentFiber.effectTag;

    // 把自己的儿子挂载到父节点
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }

    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
    }

    // 把自己挂载到父节点
    if (effectTag) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }

      returnFiber.lastEffect = currentFiber;
    }
  }
};

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
  let oldFiber = currentFiber.child;
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
      newFiber = createWorkInProgress(oldFiber, child.props);
      newFiber.sibling = null;
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

// 提交更新(commit阶段)
const commitRoot = () => {
  // 删除旧的节点
  deletions.forEach(commitWork);

  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }

  // 渲染完成后更改 current 指向
  root.current = workInProgressRoot;
  workInProgressRoot = null;

  if (isMount) {
    isMount = false;
  }
};

const commitWork = (currentFiber) => {
  if (!currentFiber) {
    return;
  }

  let returnFiber = currentFiber.return;
  while (!returnFiber.stateNode) {
    returnFiber = returnFiber.return;
  }

  const parentNode = returnFiber.stateNode;
  const effectTag = currentFiber.effectTag;

  if (effectTag === Placement && currentFiber.stateNode) {
    parentNode.appendChild(currentFiber.stateNode);
  } else if (effectTag === Update && currentFiber.stateNode) {
    updateNode(
      currentFiber.stateNode,
      currentFiber.alternate.pendingProps,
      currentFiber.pendingProps
    );
  } else if (effectTag === Deletion) {
    commitDeletion(currentFiber, parentNode);
  }
};

const commitDeletion = (currentFiber, parentNode) => {
  if (!currentFiber && !parentNode) {
    return;
  }

  if (currentFiber.stateNode) {
    parentNode.removeChild(currentFiber.stateNode);
  } else {
    commitDeletion(currentFiber.child, parentNode);
  }
};

// 模拟 React 调度
const schedule = () => {
  workInProgress = createWorkInProgress(
    root.current,
    root.current.pendingProps
  );
  workInProgressRoot = workInProgress;
  deletions = [];
  requestIdleCallback(workLoopConcurrent);
};

// 构建 workInProgress
const createWorkInProgress = (currentFiber, pendingProps) => {
  let workInProgress = currentFiber.alternate;

  if (!workInProgress) {
    workInProgress = createFiber(
      currentFiber.tag,
      pendingProps,
      currentFiber.key
    );
    workInProgress.stateNode = currentFiber.stateNode;
    workInProgress.alternate = currentFiber;
    currentFiber.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = null;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.type = currentFiber.type;
  workInProgress.child = currentFiber.child;
  workInProgress.sibling = currentFiber.sibling;
  workInProgress.memoizedState = currentFiber.memoizedState;

  return workInProgress;
};

export const useState = (initialState) => {
  let hook;

  if (isMount) {
    hook = {
      queue: {
        // 指向最新的 update
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
      baseState = typeof action === "function" ? action(baseState) : action;
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending.next);

    hook.queue.pending = null;
  }

  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
};

const dispatchAction = (queue, action) => {
  const update = {
    action,
    next: null,
  };
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  schedule();
};

export default render;
