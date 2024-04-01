import halloScript from "./components/hallo.js";
export function text() {
  return (function anonymous() {
    var container = document.createElement("div");
    var component;
    component = `<p>$[children]</p>`.replaceAll(
      "$[children]",
      arguments[0].children,
    );
    container.innerHTML = component;
    return container;
  })(...arguments);
}
export function hallo() {
  return (function anonymous() {
    var props = arguments[0];
    var container = document.createElement("div");
    var component;
    var name = props.name;
    var cusExec = halloScript(
      `${text({ children: `Hallo, ${name}` }).outerHTML}`,
      props,
      container,
    );
    props = cusExec.props;
    component = cusExec.template;
    var name = props.name;
    component = `${text({ children: `Hallo, ${name}` }).outerHTML}`.replaceAll(
      "$[children]",
      props.children,
    );
    container.innerHTML = component;
    document.getElementsByTagName("body")[0].appendChild(container);
    return container;
  })(...arguments);
}
