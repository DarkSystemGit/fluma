export function text() {
  return (function anonymous() {
    var args = Array.from(arguments).slice(0, -2);
    var container = document.createElement("div");
    var component = ((args, template, component) => {
      return template;
    })({}, `<p>$[children]</p>`, container).replaceAll(
      "$[children]",
      arguments[arguments.length - 1],
    );
    container.innerHTML = component;
    return container;
  })(...arguments);
}
export function hallo() {
  return (function anonymous(name) {
    var args = Array.from(arguments).slice(0, -2);
    var container = document.createElement("div");
    var component = ((args, template, component) => {
      return template;
    })(
      { name: args[0] },
      `${text(`Hallo, ${name}`).outerHTML}`,
      container,
    ).replaceAll("$[children]", arguments[arguments.length - 1]);
    container.innerHTML = component;
    document.getElementsByTagName("body")[0].appendChild(container);
    return container;
  })(...arguments);
}
