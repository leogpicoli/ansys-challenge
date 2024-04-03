import { Float, Text } from "@react-three/drei";
import { memo, useState } from "react";
import { monkeyPosition } from "./BuildingModel";

export const MenuChoice = {
  NewPath: 0,
  LoadPath: 1
}

function Menu({ showLoad, onChoose }) {
  const [newPathColor, setNewPathColor] = useState('#2e4aff')
  const [loadPathColor, setLoadPathColor] = useState('#2e4aff')

  return <Float
    speed={3}
    floatIntensity={20}
    rotationIntensity={0.1}
  > 
    <Text 
      font="./fonts/bangers-v20-latin-regular.woff"
      position={[monkeyPosition.x, monkeyPosition.y - 30, monkeyPosition.z]}
      fontSize={10}
      color={newPathColor}
      onPointerEnter={() => {setNewPathColor('black')}}
      onPointerLeave={() => {setNewPathColor('#2e4aff')}}
      onPointerDown={() => onChoose(MenuChoice.NewPath)}
    >
      New path
    </Text>
    {showLoad && <Text 
      font="./fonts/bangers-v20-latin-regular.woff"
      position={[monkeyPosition.x, monkeyPosition.y - 50, monkeyPosition.z]}
      fontSize={10}
      color={loadPathColor}
      onPointerEnter={() => {setLoadPathColor('black')}}
      onPointerLeave={() => {setLoadPathColor('#2e4aff')}}
      onPointerDown={() => onChoose(MenuChoice.LoadPath)}
    >
      Load path
    </Text>}
  </Float>
}

export default memo(Menu)