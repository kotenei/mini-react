const render = (element, container) => {

  console.log(element,'kkkkkk')

  // 创建 dom 节点
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  // 给 dom 节点添加属性
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // 递归创建子节点
  element.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
};

export default render;
