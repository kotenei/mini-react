export const createFiberFromTypeAndProps = (type, key, pendingProps) => {
  let fiberTag;
  switch (type) {
    case value:
      break;

    default:
      break;
  }

  return createFiber(fiberTag, pendingProps, key);
};

export const createFiber = (tag, pendingProps, key) => {
  return {
    tag,
    key,
    type: null,
    stateNode: null,
    child: null,
    sibling: null,
    return: null,
    alternate: null,
    effectTag: null,
    firstEffect: null,
    lastEffect: null,
    nextEffect: null,
  };
};
