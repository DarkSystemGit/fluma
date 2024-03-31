import * as fs from "fs";
import * as jsdom from "jsdom";
import * as path from "path";
import * as process from "process";
import * as prettier from "prettier";
import xmlStringImp from "w3c-xmlserializer";
var file = new jsdom.JSDOM(
  fs.readFileSync(path.join(process.cwd(), process.argv[2])),
);
var document = [];
var components = {};
var config = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), path.dirname(process.argv[2]), "config.json"),
  ),
);
var componentList = config.components;
var basePath = path.join(process.cwd(), path.dirname(process.argv[2]));

Object.keys(componentList).forEach(async (compName) => {
  await importComp(compName);
  if (
    Object.keys(components).sort().join() ==
    Object.keys(componentList).sort().join()
  ) {
    Object.values(components).forEach(async (comp, i) => {
      document.push(
        "export " +
          (await prettier.format(comp.toString(), {
            arrowParens: "always",
            bracketSameLine: false,
            bracketSpacing: true,
            semi: true,
            experimentalTernaries: false,
            singleQuote: false,
            jsxSingleQuote: false,
            quoteProps: "as-needed",
            trailingComma: "all",
            singleAttributePerLine: false,
            htmlWhitespaceSensitivity: "css",
            vueIndentScriptAndStyle: false,
            proseWrap: "preserve",
            insertPragma: false,
            printWidth: 80,
            requirePragma: false,
            tabWidth: 2,
            useTabs: false,
            embeddedLanguageFormatting: "auto",
            parser: "babel",
          })),
      );
      if (Object.values(components).length - 1 == i) {
        var end;
        setInterval(() => {
          if (
            document.length == Object.values(components).length &&
            end != true
          ) {
            fs.writeFileSync(
              path.join(basePath, `${config.name}.js`),
              document.join(""),
            );
            end = true;
            process.exit();
          }
        }, 100);
      }
    });
  }
});
function xmlString() {
  return xmlStringImp(...arguments)
    .replaceAll(
      '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>',
      "",
    )
    .replaceAll("</body></html>", "")
    .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', "");
}
function genNamedFunc(name, func) {
  return new Function(
    `return function ${name}(){return (${func.toString()})(...arguments)}`,
  )();
}
async function importComp(compName) {
  //console.log(compName)
  var script;
  if (componentList[compName].script)
    script = await import(
      path.join(basePath, componentList[compName].script + ".js")
    );
  components[compName] = await generateComponent(
    fs
      .readFileSync(
        path.join(basePath, componentList[compName].template + ".html"),
      )
      .toString(),
    script,
    componentList[compName].properties,
    compName,
  );
  //console.log(components)
}
function generateComponent(template, script, properties, name) {
  return new Promise((res) => {
    var reps = "";
    var propObj = "{";
    var includes = [];
    var fin = 0;
    var pageInsert=''
    if(componentList[name].page){pageInsert='document.getElementsByTagName("body")[0].appendChild(container);'}
    properties.forEach((prop, i) => {
      reps += `.replaceAll('\${${prop}}',${prop})`;
      propObj += `'${prop}':args[${i}]`;
    });
    propObj += "}";
    template.split(";").forEach(async (imp, i) => {
      if (imp.includes("@include")) {
        fin++;
        includes.push(imp.split("@include")[1].trim());
      }
    });
    template = template.split(";").slice(fin).join(";").trim();
    var dom = new jsdom.JSDOM(template);
    var tempDom = dom.window.document;
    var func;
    if (!script)
      script = (args, template, component) => {
        return template;
      };
    includes.forEach((tag, i) => {
      Array.from(tempDom.getElementsByTagName(tag)).forEach(async (node) => {
        await importComp(tag);
        var children = "";
        var attrs = Object.values(node.attributes).join() + ",";
        if (Object.values(node.attributes).join("") == "") attrs = "";
        Array.from(node.childNodes).forEach((child) => {
          children += xmlString(child);
        });
        //console.log(xmlString(node),components[tag](Object.values(node.attributes), children),template.replaceAll(xmlString(node),components[tag](Object.values(node.attributes), children)))
        template = template.replaceAll(
          xmlString(node),
          `\${${tag}(${attrs}\`${children}\`).outerHTML}`,
        );
        //console.log(includes.length)
        if (includes.length - 1 == i) {
          func = new Function(
            ...properties,
            `var args=Array.from(arguments).slice(0,-2);var container=document.createElement('div');var component=(${script.toString()})(${propObj},\`${template}\`,container).replaceAll('$[children]',arguments[arguments.length-1]);container.innerHTML=component;${pageInsert}return container`,
          );

          res(genNamedFunc(name, func));
        }
      });
    });

    if (includes.length == 0) {
      func = new Function(
        ...properties,
        `var args=Array.from(arguments).slice(0,-2);var container=document.createElement('div');var component=(${script.toString()})(${propObj},\`${template}\`,container).replaceAll('$[children]',arguments[arguments.length-1]);container.innerHTML=component;${pageInsert}return container`,
      );
      res(genNamedFunc(name, func));
    }
    //console.log()
  });
}

//console.log(components.hallo('Bob',''))
