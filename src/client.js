
var msgs = {}
var msgsDone = []
async function buildMsg(msg, params, conn, initId) {
    if(!(this.initId ==undefined)){
        initId = this.initId
    }
    var id = initId
    if (initId == undefined) {
        id = new Date().getTime()
        this.initId =id
        send(conn, { type: '__init', id })
    }
    var clientId = await response(id)
    var msgId = new Date().getTime()
    var obj = { type: msg, clientId, params, id: msgId }
    return {msg:obj,msgId}
}

function ws(host, port, tls) {
    return new Promise((resolve)=>{
        if (tls == true) {
            tls = 's'
        } else {
            tls = ''
        }
        var ws = new WebSocket(`ws${tls}://${host}:${port}`)
        ws.addEventListener('error', e => reject(e))
        ws.onopen = () => {
            ws.onmessage = (msg) => {
                msg = JSON.parse(msg.data)
                msgs[msg.id] = msg
                msgsDone.push(msg.id)
            }
            resolve(ws)
        }
    })
    
}
function send(ws, msg) {
    ws.send(JSON.stringify(msg))
}
async function response(id) {
    return new Promise((resolve) => {
        var iterations = 1
        setTimeout(function resHand() {
            if (msgsDone.includes(id)) {
                resolve(msgs[id])
            } else {
                if (!(iterations == 50)) {
                    setTimeout(resHand, 100)
                }
            }
        }, 100)
    })
}
export class client {
    constructor () {
        url=new URL(window.location)
        var tls=false
        if(url.protocol=="wss:")tls=true
        return new Promise(async (resolve, reject) => {
            try {
                this.cinfo=await ws(url.hostname,url.port,url.protocol,tls)
                var funcList=await this.call('_lstRPC')
                var functions={}
                funcList.forEach((func)=>{
                    functions[func]=eval(`(function(){this.call('${func}',...arguments)})`)()

                })
                resolve(functions)
            } catch (error) {
                reject(error)
            }
        })
         
        
    }
    async call (msg) {
        var ws = this.cinfo
        var params = Array.prototype.slice.call(arguments, 1)
        var msg = await buildMsg(msg,params,ws)
        send(ws,msg.msg)
        var res = await response(msg.msgId)
        if (res.status == 'ok') {
            return res.res
        } else {
            throw new Error(res.res)
        }
    }

}
