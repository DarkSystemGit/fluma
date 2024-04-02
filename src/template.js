import * as fs from "fs";
import * as jsdom from "jsdom";
import * as path from "path";
import * as process from "process";
import * as prettier from "prettier";
import xmlStringImp from "w3c-xmlserializer";
import { minify } from "terser";
var file = new jsdom.JSDOM(
  fs.readFileSync(path.join(process.cwd(), process.argv[2])),
);
var prettierOptions = {
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
}
var document = [];
var imports = []
var components = {};
var config = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), path.dirname(process.argv[2]), "config.json"),
  ),
);
var componentList = config.components;
var basePath = path.join(process.cwd(), path.dirname(process.argv[2]));
function uniq(a) {
  var seen = {};
  return a.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}
Object.keys(componentList).forEach(async (compName) => {
  await importComp(compName);
  if (
    Object.keys(components).sort().join() ==
    Object.keys(componentList).sort().join()
  ) {
    Object.values(components).forEach(async (comp, i) => {
      document.push(
        "export " +
        (await prettier.format(comp.toString(), prettierOptions)),
      );
      if (Object.values(components).length - 1 == i) {
        var end;
        setInterval(async () => {
          if (
            document.length == Object.values(components).length &&
            end != true
          ) {
            var file = await prettier.format(
              uniq(imports).map((imp) => {
                return `import ${imp.name}Script from '${imp.path}';`
              }).join(";") + document.join(""), prettierOptions)
            fs.writeFileSync(
              path.join(basePath, `${config.name}.js`),
              file
            );
            fs.writeFileSync(
              path.join(basePath, `${config.name}.min.js`),
              (await minify(file)).code
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
function hash(elm) {
  return btoa(elm.split('').reduce((hash, char) => {
    return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
  }, 0).toString());
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
    script = './' + path.relative(basePath, path.join(basePath, componentList[compName].script + ".js"))
  //console.log(script,path.join(basePath, componentList[compName].script + ".js"), basePath)
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
    var pageInsert = ''
    var props = ''
    var basicProps = ''
    var bP = ['id', 'name', 'class']
    bP.forEach((propName) => { basicProps += `if(!(props.${propName}&&${properties.hasOwnProperty(propName)})){container.${propName}=props.${propName}}` })
    if (componentList[name].page) { pageInsert = 'document.getElementsByTagName("body")[0].appendChild(container);' }
    properties.forEach((prop, i) => {
      props += `var ${prop}=props.${prop};`;
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
    if (script) { imports.push({ path: script, name }); script = `var cusExec=${name}Script(props,container);props=cusExec.props;component=cusExec.template||component;container=cusExec.component;`; } else { script = '' }

    includes.forEach((tag, i) => {
      Array.from(tempDom.getElementsByTagName(tag)).forEach(async (node) => {
        await importComp(tag);
        var children = "";

        var attrs = ''
        if (node.hasAttributes()) {
          for (var attr of node.attributes) attrs += `${attr.name}:'${attr.value}',`
          attrs = ',' + attrs.slice(0, -1)
        }
        //console.log(attrs)
        Array.from(node.childNodes).forEach((child) => {
          children += xmlString(child);
        });
        //console.log(xmlString(node),components[tag](Object.values(node.attributes), children),template.replaceAll(xmlString(node),components[tag](Object.values(node.attributes), children)))
        template = template.replaceAll(
          xmlString(node),
          `<comp class="${tag}" params="{children:'${children}'${attrs}}"></comp>`,
        );
        //console.log(script)
        if (includes.length - 1 == i) {

          func = new Function(

            `var props=arguments[0];var container=document.createElement('div');${basicProps}var component;${props}${script}${props}component=\`${template}\`.replaceAll('$[children]',props.children);container.innerHTML+=component;Array.from(container.getElementsByTagName('comp')).forEach((elm)=>{elm.replaceWith(new Function(\`return \${elm.className}(\${elm.getAttribute('params')})\`)())});${pageInsert}return container`,
            );

          res(genNamedFunc(name, func));
        }
      });
    });

    if (includes.length == 0) {
      func = new Function(

        `var props=arguments[0];var container=document.createElement('div');${basicProps}var component;${props}${script}${props}component=\`${template}\`.replaceAll('$[children]',props.children);container.innerHTML+=component;Array.from(container.getElementsByTagName('comp')).forEach((elm)=>{elm.replaceWith(new Function(\`return \${elm.className}(\${elm.getAttribute('params')})\`)())});${pageInsert}return container`,
      );
      res(genNamedFunc(name, func));
    }
    //console.log()
  });
}

//console.log(components.hallo('Bob',''))
