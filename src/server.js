import { WebSocket } from 'ws'
export class server{
    constructor(httpServer,functions){
        //console.log(handlers)
        this.handlers=functions
        this.handlers._lstRPC=()=>{
            return Object.keys(this.handlers)
        }
        new WebSocket({httpServer}).on('connection',ws=>{
            ws.on('message',msg=>{
                //console.log(this)
                msg=JSON.parse(msg)
                
                //console.log('New message recived: '+JSON.stringify(msg))
                if(msg.type == '__init'){
                    send(ws,JSON.stringify({pid:new Date().getTime(),id:msg.id}))
                }else{
                    //console.log(JSON.stringify(handlers))
                    try {
                        ws.send(JSON.stringify({status:'ok',res:this.handleMsg(msg),id:msg.id}))
                    } catch (error) {
                        ws.send(JSON.stringify({status:'error',res:error,id:msg.id}))
                    }
                }
            })
        })
    }
    handleMsg(obj){
        return this.handlers[obj.type](obj.clientId,...obj.params) 
    }
}