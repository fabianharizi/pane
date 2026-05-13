export default class MouseInfo {
  constructor(e) {
    this.isDragging = false;
    this.coords = {x: 0, y: 0};
    this.offset = {x: 0, y: 0};
    this.e;
  }

  start(e){
    this.reset();
    this.e = e;
    this.isDragging = true;
    this.coords = {x: e.clientX, y: e.clientY};
    // console.log("Started at X:"+this.coords.x+" Y:"+this.coords.y)

    window.addEventListener('mousemove', (e) => {
      this.getData(e)
    });

    window.addEventListener('mouseup', (e) => {
      this.end()
    });
  }

  getData(e){
    if(this.isDragging == true){
      this.offset = {
        x: this.coords.x - e.clientX,
        y: this.coords.y - e.clientY
      }
      // console.log("Moving by X:"+this.offset.x+" Y:"+this.offset.y)
    }
  }

  end(){
    this.isDragging = false;
    window.removeEventListener('mousemove', (e) => {
      this.getData(e)
    });

    window.removeEventListener('mouseup', (e) => {
      this.end()
    });
  }

  reset(){
    this.isDragging = false;
    this.coords = {x: 0, y: 0};
    this.offset = {x: 0, y: 0};
  }
}