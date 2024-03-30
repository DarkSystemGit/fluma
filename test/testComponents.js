export function hallo() {
  return (function anonymous(name) {
    var args = Array.from(arguments).slice(0, -2);
    return ((args, template) => {
      return template;
    })({ name: args[0] }, `<p>Hallo, ${name}</p>`).replaceAll(
      "$[children]",
      arguments[arguments.length - 1],
    );
  })(...arguments);
}
