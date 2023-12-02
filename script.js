import {Blueprint} from "./blueprint.js";
const graph = new Blueprint('#blueprint');
graph.addNode(0,{
    inputs:[
        {title:'number 1'},
        {title:'number 2'}
    ],
    outputs:[
        {title:'sum'},
    ],
    content: `<div>hello world</div>`,
    header: `Sum of 2 numbers`,
});
graph.addNode(1,{
    inputs:[
        {title:'number 1'},
        {title:'number 2'}
    ],
    outputs:[
        {title:'sum'},
    ],
    content: `<div>hello world</div>`,
    header: `Sum of 2 numbers`,
});