// This hook is used to implement the select preview ghost

import { useEffect, useState } from "react";
import Shape from "../../components/Shape/Shape";
import Line from "../../components/Line/Line";

export default function usePreview(){
  const [preview, setPreview] = useState(null)

  const enablePreview = (type, startX, startY, x, y) => {
    setPreview(() => {switch(type){
        case "rectangle":
        case "oval":
          return <Shape 
            type={type}
            startX={startX}
            startY={startY}
            x={x}
            y={y}
            properties={{
              fill: "#0088aa80",
              strokeColor: "#0088aaaa",
              strokeWidth: 2,
              strokeStyle: "dashed"
            }}
          />
    
        case "line":
          return <Line
            startX={startX}
            startY={startY}
            x={x}
            y={y}
            properties={{
              strokeColor: "#0088aaaa",
              strokeWidth: 2,
              strokeStyle: "dashed",
              headStart: "none",
              headEnd: "none",
            }}
          />
      }}
    )
  }

  const disablePreview = () => {
    setPreview(null);
  }

  return {
    "preview": preview, 
    "enablePreview": enablePreview, 
    "disablePreview": disablePreview
  };
}