import * as fs from 'fs'
import * as jsdom from 'jsdom'
import * as path from 'path'
import * as process from 'process'
import xmlString from 'w3c-xmlserializer'
var file = new jsdom.JSDOM(fs.readFileSync(path.join(process.cwd(), process.argv[2])))
var document = file.window.document
var components = {}
var componentList = JSON.parse(fs.readFileSync(path.join(process.cwd(), path.dirname(process.argv[2]), 'config.json'))).components
var basePath = path.join(process.cwd(), path.dirname(process.argv[2]))
Object.keys(componentList).forEach(async (compName) => {
    importComp(compName)
});
async function importComp(compName){
    console.log(compName)
    var script;
    if (componentList[compName].script) script = await import(path.join(basePath, componentList[compName].script + '.js'))
    components[compName] = generateComponent(fs.readFileSync(path.join(basePath, componentList[compName].template + '.html')).toString(), script, componentList[compName].properties)
}
function generateComponent(template, script, properties) {
    var reps = ''
    var propObj = '{'
    var includes = []
    var fin = 0
    properties.forEach((prop, i) => { reps += `.replaceAll('\${${prop}}',${prop})`; propObj += `'${prop}':args[${i}]` })
    propObj += '}'
    template.split(';').forEach(async (imp, i) => {
        if (imp.includes('@include')) {
            fin++
            includes.push(imp.split('@include')[1].trim());
            //console.log(imp,fin,template.split(';').slice(fin))
            if(!componentList.hasOwnProperty(imp.split('@include')[1].trim()))await importComp(imp.split('@include')[1].trim())
            
        }
    })
    template = template.split(';').slice(fin).join(';').trim()
    var dom=new jsdom.JSDOM(template)
    var tempDom=dom.window.document
    
    includes.forEach((tag)=>{
        Array.from(tempDom.getElementsByTagName(tag)).forEach((node)=>{
            var children=''
            Array.from(node.childNodes).forEach((child)=>{children+=xmlString(child)})
            console.log(components,includes,tag,template)
            console.log(Object.values(node.attributes),children,components[tag](Object.values(node.attributes),children))
            node.replaceWith(components[tag](Object.values(node.attributes),children))
        })
    })
    if (!script) script = (args, template) => { return template }

    var func = new Function(...properties, `var args=Array.from(arguments).slice(0,-2);return arguments[arguments.length-1](${propObj},\`${template}\`).replaceAll('$[children]',arguments[arguments.length-2])`)
    return function () {
        return func(...arguments, script)
    }
}
//console.log(components.hallo('Bob',''))
