import "./node_modules/jquery/dist/jquery.js";
import "./node_modules/moveable/dist/moveable.js";
import "./node_modules/moveable-helper/dist/moveable-helper.js";
import "./node_modules/selecto/dist/selecto.js";
import "./node_modules/panzoom/dist/panzoom.js";
import "./node_modules/@fortawesome/fontawesome-free/js/all.js";
import "./node_modules/arrow-line/dist/arrow-line.js";
export class Blueprint{
    nodeList = {};
    arrowList = {};
    dragArrows = null;
    constructor(container){
        this.container = container;
        this.containerDOM = $(container);
        this.containerDOM.addClass('blueprint_container')
        this.viewerDOM = $('<div class="blueprint_viewer"></div>');
        this.backgroundDOM = $(`
        <svg class="blueprint_background">
            <pattern id="dotBackground" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="translate(-0.4,-0.4)">
                <circle cx="0.7" cy="0.7" r="0.7" fill="#91919a"></circle>
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#dotBackground)"></rect>
        </svg>
        `);
        this.arrowDOM = $('<svg class="blueprint_arrows"></svg>');
        this.containerDOM.append(this.backgroundDOM);
        this.containerDOM.append(this.viewerDOM);
        this.viewerDOM.append(this.arrowDOM);
        this.createViewer();
        this.createDragableNode();
        this.createArrowMaker();
    }

    async createViewer(){
        await new Promise(r => setTimeout(r,10));
        this.viewer =  panzoom(this.viewerDOM[0],{
            maxZoom: 2,
            minZoom: 0.5,
            smoothScroll: false,
            beforeMouseDown: e => {
                const elementClick = $('.blueprint_nodeContainer:hover').length !==0;
                const portClick = $('.blueprint_portHandle:hover').length !==0;
                const ctrlKey = e.ctrlKey;
                if(elementClick && !ctrlKey && !portClick){
                    this.moveable.target = $('.blueprint_nodeContainer:hover')[0];
                    this.moveable.dragStart(e);
                }
                if(elementClick || ctrlKey || portClick){
                    return true;
                } 
            }
        }).on("pan", e => {
            const transform = e.getTransform();
            this.backgroundDOM.find('pattern').attr({
                x:transform.x/transform.scale, 
                y:transform.y/transform.scale,
                patternTransform:`scale(${transform.scale})`
            });
        }).on("zoom", e => {
            const transform = e.getTransform();
            this.backgroundDOM.find('pattern').attr({
                x:transform.x/transform.scale, 
                y:transform.y/transform.scale,
                patternTransform:`scale(${transform.scale})`
            });
        })
    }

    createArrowMaker(){
        let startPort = null;
        this.containerDOM.on("mousedown",e =>{
            const ports = $('.blueprint_portHandle:hover');
            if(ports.length){
                startPort = ports[0];
            }
        });
        this.containerDOM.on("mouseup",e =>{
            if(startPort){
                let endPort = null;
                const ports = $('.blueprint_portHandle:hover');
                if(ports.length){
                    //join ports
                    endPort = ports[0];
                    const startPortQuerry = `[data-port-ref="${startPort.dataset.portRef}"]`;
                    const endPortQuerry = `[data-port-ref="${endPort.dataset.portRef}"]`
                    const {fromX,fromY, toX, toY} = this.getArrowCoords(startPortQuerry,endPortQuerry);
                    const arrow = arrowLine({x: fromX, y: fromY}, {x: toX, y: toY}, {
                        svgParentSelector:'.blueprint_arrows',
                        thickness: 2,
                        pivots:[{x:20, y: 0}, {x:-30, y: 0}],
                        endpoint:{
                            type : 'none'
                        }
                    });
                    this.arrowList[startPort.dataset.portRef+'___'+endPort.dataset.portRef] = {
                        startPortQuerry,
                        endPortQuerry,
                        startPort:startPort.dataset.portRef,
                        endPort: endPort.dataset.portRef,
                        arrow
                    }
                }else{
                    //create new nodeType and join
                }
                startPort = null;
            }
        });

    }

    getArrowCoords(startPortQuerry, endPortQuerry){
        const transform = this.viewer.getTransform();
        const {x:cx , y:cy} = this.containerDOM[0].getBoundingClientRect(); 
        const {x:fx, y:fy} = $(startPortQuerry)[0].getBoundingClientRect();
        const {x:tx, y:ty} = $(endPortQuerry)[0].getBoundingClientRect();
        const z = transform.scale;
        const lx = transform.x;
        const ly = transform.y;
        const containerOffset = 10000;   


        const offsetX = cx+lx;
        const offsetY = cy+ly;
        const fromX = fx/z+29-offsetX/z+containerOffset;
        const fromY = fy/z+13-offsetY/z+containerOffset;
        const toX = tx/z+7-offsetX/z+containerOffset;
        const toY = ty/z+13-offsetY/z+containerOffset;
        return {fromX, fromY, toX, toY}
    }

    updateArrows(nodeIds=[]){
        if(!this.dragArrows && nodeIds){
            this.dragArrows = [];
            Object.values(this.arrowList).forEach(item => {
                const fromNodeID = item.startPort.split('_')[1];
                const toNodeID = item.endPort.split('_')[1];
                if(nodeIds.includes(fromNodeID) || nodeIds.includes(toNodeID)){
                    this.dragArrows.push(item);
                }
            });
        }
        this.dragArrows?.forEach(item => {
            const {fromX, fromY, toX, toY} = this.getArrowCoords(item.startPortQuerry, item.endPortQuerry);
            item.arrow.update({
                source: {x: fromX, y: fromY} ,
                destination: {x: toX, y: toY}
            })
        });
    }

    createDragableNode(){
        const self = this;
        let targets = [];
        this.moveable = new Moveable(this.viewerDOM[0], {
          target: [],
          draggable: true,
          scalable: false,
          rotatable: false,
          snappable: false,
          snapCenter: false,
          origin: false,
        });

        const helper = MoveableHelper.create();
        this.moveable
            .on("dragStart", e => {
                const portClick = $('.blueprint_portHandle:hover').length !==0;
                if(!portClick){
                    this.viewer.pause();
                    $('.blueprint_nodeContainer').css({'z-index':1});
                    $(e.target).css({'z-index':2});
                    helper.onDragStart(e);
                } else {
                    this.moveable.target = [];
                }
            })
            .on("drag", e => {
                const nodeId = e.target.dataset["nodeRef"]?.split('node_')[1];
                this.updateArrows([nodeId]);
                helper.onDrag(e);
            })
            .on("dragEnd", e => {
                this.dragArrows = null;
                this.viewer.resume();
            })
            .on("dragGroupStart", e => {
                this.viewer.pause();
                helper.onDragGroupStart(e)
            })
            .on("dragGroupEnd", e => {
                this.dragArrows = null;
                this.viewer.resume()
            })
            .on("dragGroup", e => {
                this.updateArrows([...e.targets].map(x => x.dataset["nodeRef"]?.split('node_')[1]));
                helper.onDragGroup(e);
            })
            .on("scaleStart", helper.onScaleStart)
            .on("scale", helper.onScale)
            .on("scaleGroupStart", helper.onScaleGroupStart)
            .on("scaleGroup", helper.onScaleGroup)
            .on("rotateStart", helper.onRotateStart)
            .on("rotate", helper.onRotate)
            .on("rotateGroupStart", helper.onRotateGroupStart)
            .on("rotateGroup", helper.onRotateGroup)

            new Selecto({
                container: this.containerDOM[0],
                dragContainer: this.containerDOM[0],
                hitRate: 0,
                selectableTargets: [".blueprint_nodeContainer"],
                toggleContinueSelect: ["shift"],
                checkInput:true,
                selectByClick: true,
                selectFromInside: false,
              })
              .on("dragStart", (e) => {
                if (!document.hasFocus()) {
                  e.stop();
                }
                const inputEvent = e.inputEvent;
                const target = inputEvent.target;
                if (
                  !e.inputEvent.ctrlKey||
                  inputEvent.type === "touchstart" ||
                  self.moveable.isMoveableElement(target) ||
                  targets.some((t) => t === target || t.contains(target))
                ) {
                  e.stop();
                }
              }).on("selectEnd", (e) => {
                targets = e.selected;
                self.moveable.target = targets;
              
                if (e.isDragStart) {
                  e.inputEvent.preventDefault();
              
                  setTimeout(() => {
                    self.moveable.dragStart(e.inputEvent);
                  });
                }
              });

              this.containerDOM.on('click',(e)=>{
                if($('.blueprint_nodeContainer:hover').length ==0 && !e.ctrlKey){
                    targets = [];
                    self.moveable.target = targets;
                }
              })
    }

    addHTML(html){
        this.containerDOM.append(html);
    }
    NodeWithBody(id, options){

        const nodeElem = $(`<div data-node-ref="node_${id}" class="blueprint_nodeContainer"></div>`);
        const nodeHeader = $(`<div class="blueprint_header">${options.header}</div>`);
        const nodeBody = $(`<div class="blueprint_body"></div>`);
        const nodeInputs = $(`<div class="blueprint_input"></div>`);
        options.inputs?.forEach((input,i) => {
            const inputPort = $(`<div data-port-ref="input_${id}_${i}" class="blueprint_inputPort blueprint_portHandle"><i class="fa-solid fa-caret-right"></i></div>`);
            const inputText = $(`<div class="blueprint_inputPortLabel">${input.label}</div>`);
            const port = $(`<div class="blueprint_inputPortContainer blueprint_portContainer"></div>`);
            port.append(inputPort);
            port.append(inputText);
            nodeInputs.append(port);
            
        });
        const nodeContent = $(`<div class="blueprint_content">${options.content}</div>`);
        const nodeOutputs = $(`<div class="blueprint_output"></div>`);
        options.outputs?.forEach((input,i) => {
            const outputPort = $(`<div  data-port-ref="output_${id}_${i}" class="blueprint_outputPort blueprint_portHandle"><i class="fa-solid fa-caret-right"></i></div>`);
            const outputText = $(`<div class="blueprint_outputPortLabel">${input.label}</div>`);
            const port = $(`<div class="blueprint_outputPortContainer blueprint_portContainer"></div>`);
            port.append(outputText);
            port.append(outputPort);
            nodeOutputs.append(port);
            
        });
        const nodeFooter = $(`<div class="blueprint_footer">${options.footer}</div>`);

        nodeElem.append(nodeHeader);
        nodeElem.append(nodeBody);
        nodeBody.append(nodeInputs);
        nodeBody.append(nodeContent);
        nodeBody.append(nodeOutputs);

        if(options.footer !== undefined)
            nodeElem.append(nodeFooter);

        return nodeElem;

    }
    addNode(id, options={}){
        options.mode ??= 0;
        let nodeElem
        if(options.mode === 0){
            nodeElem = this.NodeWithBody(id , options);
        }
        
        this.viewerDOM.append(nodeElem);
        nodeElem.on('click', e =>{
            this.moveable.target = nodeElem[0];
        });
        this.nodeList[id] = {DOM:nodeElem};
        return nodeElem;
    }


}
