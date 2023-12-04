import {Blueprint} from "./blueprint.js";
const graph = new Blueprint('#blueprint');
graph.addNode(0,{
    inputs:[
        {label:'a'},
        {label:'b'},
        {label:'c'},
        {label:'d'}
    ],
    outputs:[
        {label:'sum'},
    ],
    content: `<div>hello world</div>`,
    header: `Sum of 2 numbers`,
});
graph.addNode(1,{
    inputs:[
        {label:'number 1'},
        {label:'number 2'}
    ],
    outputs:[
        {label:'sum'},
    ],
    content: `<div>hello world</div>`,
    header: `Sum of 2 numbers`,
});