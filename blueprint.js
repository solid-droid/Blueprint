import "./node_modules/jquery/dist/jquery.js";
import "./node_modules/moveable/dist/moveable.js";
import "./node_modules/moveable-helper/dist/moveable-helper.js";
import "./node_modules/selecto/dist/selecto.js";
import "./node_modules/panzoom/dist/panzoom.js";
export class Blueprint{
    nodeList = {};
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
        this.containerDOM.append(this.backgroundDOM);
        this.containerDOM.append(this.viewerDOM);
        this.createViewer();
        this.createDragableNode();
    }

    async createViewer(){
        await new Promise(r => setTimeout(r,10));
        this.viewer =  panzoom(this.viewerDOM[0],{
            maxZoom: 2,
            minZoom: 0.5,
            smoothScroll: false,
            beforeMouseDown: e => {
                const elementClick = $('.blueprint_nodeContainer:hover').length !==0;
                const ctrlKey = e.ctrlKey;
                if(elementClick && !ctrlKey){
                    this.moveable.target = $('.blueprint_nodeContainer:hover')[0];
                    this.moveable.dragStart(e);
                }
                if(elementClick || ctrlKey){
                    return true;
                } 
            }
        }).on("pan", e => {
            const transform = e.getTransform();
            this.backgroundDOM.find('pattern').attr({x:transform.x, y:transform.y})
        }).on("zoom", e => {
            // const transform = e.getTransform();
        })
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
                this.viewer.pause();
                $('.blueprint_nodeContainer').css({'z-index':1});
                $(e.target).css({'z-index':2});
                helper.onDragStart(e);
            })
            .on("drag", helper.onDrag)
            .on("dragEnd", e => {
                this.viewer.resume();
            })
            .on("dragGroupStart", e => {
                this.viewer.pause();
                helper.onDragGroupStart(e)
            })
            .on("dragGroupEnd", e => this.viewer.resume())
            .on("dragGroup", helper.onDragGroup)
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
              })
              .on("selectEnd", (e) => {
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

    addNode(id, options={}){
        const self = this;
        const nodeElem = $(`
            <div data-node-ref="blueprintNode_${id}" class="blueprint_nodeContainer">
                <div class="blueprint_header">
                    header
                </div>
                <div class="blueprint_body">
                    <div class="blueprint_input">input</div>
                    <div class="blueprint_content">content</div>
                    <div class="blueprint_output">output</div>
                </div>
                <div class="blueprint_footer">
                    footer
                </div>
            </div>
        `);
        this.viewerDOM.append(nodeElem);
        nodeElem.on('click', e =>{
            self.moveable.target = nodeElem[0];
        });
        this.nodeList[id] = {DOM:nodeElem};
    }


}
