import halloScript from "./components/hallo.js";
export function text() {
  return (function anonymous() {
    var props = arguments[0];
    var container = document.createElement("div");
    if (!(props.id && false)) {
      container.id = props.id;
    }
    if (!(props.name && false)) {
      container.name = props.name;
    }
    if (!(props.class && false)) {
      container.class = props.class;
    }
    var component;
    component = `<p>$[children]</p>`.replaceAll("$[children]", props.children);
    container.innerHTML += component;
    return container;
  })(...arguments);
}
export function hallo() {
  return (function anonymous() {
    var props = arguments[0];
    var container = document.createElement("div");
    if (!(props.id && false)) {
      container.id = props.id;
    }
    if (!(props.name && false)) {
      container.name = props.name;
    }
    if (!(props.class && false)) {
      container.class = props.class;
    }
    var component;
    var name = props.name;
    var cusExec = halloScript(props, container);
    props = cusExec.props;
    component = cusExec.template || component;
    container = cusExec.component;
    var name = props.name;
    component =
      `<comp class="text" params="{children:'Hallo, ${name}'}"></comp>`.replaceAll(
        "$[children]",
        props.children,
      );
    container.innerHTML += component;
    document.getElementsByTagName("body")[0].appendChild(container);
    return container;
  })(...arguments);
}
