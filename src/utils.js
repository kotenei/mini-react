// 创建 fiber 对应的dom节点
export const createNode = (fiber) => {
  const node =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateNode(node, {}, fiber.pendingProps);

  return node;
};

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) =>
  key !== "children" && key !== "key" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

// 更新 dome 节点
export const updateNode = (node, prevProps, nextProps) => {
  // 移除旧的事件
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

  // 设置新的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      node[name] = nextProps[name];
    });

  // 添加新的事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      node.addEventListener(eventType, nextProps[name]);
    });
};
