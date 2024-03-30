import * as fs from 'fs'
import * as jsdom from 'jsdom'
import * as path from 'path'
import * as process from 'process'
import xmlStringImp from 'w3c-xmlserializer'
var file = new jsdom.JSDOM(fs.readFileSync(path.join(process.cwd(), process.argv[2])))
var document = file.window.document
var components = {}
var componentList = JSON.parse(fs.readFileSync(path.join(process.cwd(), path.dirname(process.argv[2]), 'config.json'))).components
var basePath = path.join(process.cwd(), path.dirname(process.argv[2]))
Object.keys(componentList).forEach(async (compName) => {
    await importComp(compName)
    if(Object.keys(components)==Object.keys(componentList))console.log(components.hallo('Bob', ''))
});
function xmlString() {
    return xmlStringImp(...arguments).replaceAll('<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>', '').replaceAll('</body></html>', '').replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', '')
}
async function importComp(compName) {
    //console.log(compName)
    var script;
    if (componentList[compName].script) script = await import(path.join(basePath, componentList[compName].script + '.js'))
    components[compName] = await generateComponent(fs.readFileSync(path.join(basePath, componentList[compName].template + '.html')).toString(), script, componentList[compName].properties, compName)
    //console.log(components)
}
function generateComponent(template, script, properties, name) {
    return new Promise((res) => {
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
            }
        })
        template = template.split(';').slice(fin).join(';').trim()
        var dom = new jsdom.JSDOM(template)
        var tempDom = dom.window.document
        var func;
        if (!script) script = (args, template) => { return template }
        includes.forEach((tag, i) => {
            Array.from(tempDom.getElementsByTagName(tag)).forEach(async (node) => {
                await importComp(tag)
                var children = ''
                Array.from(node.childNodes).forEach((child) => { children += xmlString(child) })
                //console.log(xmlString(node),components[tag](Object.values(node.attributes), children),template.replaceAll(xmlString(node),components[tag](Object.values(node.attributes), children)))
                template = template.replaceAll(xmlString(node), components[tag](...Object.values(node.attributes), children))
                //console.log(includes.length)
                if (includes.length-1 == i) {
                    func = new Function(...properties, `var args=Array.from(arguments).slice(0,-2);return arguments[arguments.length-1](${propObj},\`${template}\`).replaceAll('$[children]',arguments[arguments.length-2])`)
                    res(function () {
                        return func(...arguments, script)
                    })
                }
            })
        })


        if (includes.length == 0) {
            func = new Function(...properties, `var args=Array.from(arguments).slice(0,-2);return arguments[arguments.length-1](${propObj},\`${template}\`).replaceAll('$[children]',arguments[arguments.length-2])`)
            res(function () {
                return func(...arguments, script)
            })
        }
        //console.log()


    })
}

//console.log(components.hallo('Bob',''))