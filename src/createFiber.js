export const createFiber = (tag, props, key) => {
  return {
    tag,
    key,
    type: null,
    stateNode: null,
    child: null,
    sibling: null,
    return: null,
    pendingProps: props,
    memoizedState: null,
    alternate: null,
    effectTag: null,
    firstEffect: null,
    lastEffect: null,
    nextEffect: null,
  };
};
