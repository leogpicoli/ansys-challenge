import { memo } from "react"

function Lights({isDay}) {
  return <>
    <ambientLight intensity={0.1} />
    <directionalLight
      intensity={isDay ? 1.5 : 0.1}
      position={[20, 70, 20]}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-near={1}
      shadow-camera-far={200}
      shadow-camera-top={200}
      shadow-camera-right={200}
      shadow-camera-bottom={-150}
      shadow-camera-left={-200}
    />
  </>
}

export default memo(Lights)