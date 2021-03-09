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
    alternate: null,
    effectTag: null,
    firstEffect: null,
    lastEffect: null,
    nextEffect: null,
  };
};
