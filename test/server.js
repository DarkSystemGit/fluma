
import {Server} from './../main.js'

new Server(3001,{getText:()=>{
    return fs.readFileSync('./comp.txt')
}})