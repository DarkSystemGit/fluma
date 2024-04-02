import {text} from '../testComponents.js'
export default function (props,component){
    props.name='Joe'
    component.appendChild(text({children:'Dynamic Bit!'}))
    component.addEventListener('mouseenter',()=>{
        component.style.color='green'
    })
    component.addEventListener('mouseleave',()=>{
        component.style.color='black'
    })
    return {props,component}
}