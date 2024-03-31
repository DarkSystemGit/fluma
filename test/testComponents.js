export function text() {
  return (function anonymous() {
    var args = Array.from(arguments).slice(0, -1);
    var container = document.createElement("div");
    var component = ((args, template) => {
      return template;
    })
      .bind(container)({}, `<p>$[children]</p>`)
      .replaceAll("$[children]", arguments[arguments.length - 1]);
    container.innerHTML = component;
    return container;
  })(...arguments);
}
export function hallo() {
  return (function anonymous(name) {
    var args = Array.from(arguments).slice(0, -2);
    var container = document.createElement("div");
    var component = ((args, template) => {
      return template;
    })
      .bind(container)(
        { name: args[0] },
        `${text(`Hallo, ${name}`).childNodes[0].outerHTML}`,
      )
      .replaceAll("$[children]", arguments[arguments.length - 1]);
    container.innerHTML = component;
    return container;
  })(...arguments);
}
