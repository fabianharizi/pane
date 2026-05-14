export default function getMaxCanvasSize(elements, canvasSize){
  let maxDistance = 0;
  elements.forEach(element => {
    if(maxDistance < getFurthestDistance(element, canvasSize)){
      maxDistance = getFurthestDistance(element, canvasSize)
    }
  });

  return canvasSize + (maxDistance * 2)
}


function getFurthestDistance(element, canvasSize) {
  const x = canvasSize / 2 < element.x + element.width / 2 ? element.x + element.width : element.x
  const y = canvasSize / 2 < element.y + element.height / 2 ? element.y + element.height : element.y
  
  return Math.sqrt(Math.pow((x-(canvasSize/2)), 2) + Math.pow((y-(canvasSize/2)), 2))
}