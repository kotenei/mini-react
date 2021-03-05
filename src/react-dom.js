import { createFiberFromTypeAndProps, createFiber } from "./createFiber";
import { NoWork } from "./effectTags";
import { FunctionComponent, HostComponent, HostRoot } from "./workTags";

let fiberRootNode = null;
let currentRoot = null;
let workInProgressRoot = null;
let workInProgress = null;

const render = (element, container) => {
  // 首次渲染会创建 fiberRootNode
  // fiberRootNode 的 current 指向当前页面上已渲染内容对应的 Fiber 树
  const rootFiber = createFiber(HostRoot, null, null);
  fiberRootNode = { current: rootFiber };
  rootFiber.memoizedState = { element };
  rootFiber.stateNode = fiberRootNode;
  // workInProgressRoot = fiberRootNode.current;

  // workInProgressRoot = createFiber(HostRoot, null, null);
  // workInProgress.stateNode = container;

  workInProgress = createWorkInProgress(fiberRootNode.current, null);
  workInProgress.memoizedState = { element };
};

const createWorkInProgress = (currentFiber, pendingProps) => {
  let workInProgress = currentFiber.alternate;

  if (!workInProgress) {
    workInProgress = createFiber(
      currentFiber.tag,
      pendingProps,
      currentFiber.key
    );
    workInProgress.type = currentFiber.type;
    workInProgress.stateNode = currentFiber.stateNode;
    workInProgress.alternate = currentFiber;
    currentFiber.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = NoWork;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
    workInProgress.nextEffect = null;
  }

  workInProgress.updateQueue = currentFiber.updateQueue;
  workInProgress.child = currentFiber.child;
  workInProgress.sibling = currentFiber.sibling;
  workInProgress.return = currentFiber.return;
  workInProgress.memoizedState = currentFiber.memoizedState;
  workInProgress.memoizedProps = currentFiber.memoizedProps;

  return workInProgress;
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

  if (!workInProgress && workInProgressRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoopConcurrent);
};

// requestIdleCallback(workLoopConcurrent);

// 创建并返回下一个fiber节点（render阶段)
const performUnitOfWork = (currentFiber) => {
  beginWork(currentFiber);

  if (currentFiber.child) {
    return currentFiber.child;
  }

  // 如果当前 fiber 节点没有子节点，则返回兄弟节点，如果没有就一直向上查找。
  while (currentFiber) {
    completeWork(currentFiber);
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

const completeWork = (currentFiber) => {};

const updateHostRoot = (currentFiber) => {};

const updateHostComponent = (currentFiber) => {};

const updateFunctionComponent = (currentFiber) => {};

const commitRoot = () => {
  workInProgressRoot = null;
};

const commitWork = () => {};

export default render;
