import { useGLTF } from '@react-three/drei'
import React, { memo } from 'react'

const CarModel = React.forwardRef((_, ref) => {
  const model = useGLTF('./models/BananaCar/car.glb')
  const car = model.scene

  car.scale.setScalar(0.005)

  for (const mesh of car.children) {
    mesh.castShadow = true
  }

  return (
    <primitive ref={ref} object={car} />
  )
})

export default memo(CarModel)