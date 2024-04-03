import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useEffect } from 'react'
import * as THREE from 'three'
import React from 'react'

export const monkeyPosition = new THREE.Vector3(10,500,-20)

function BuildingModel({onClick}) {
  const model = useGLTF('./models/Buildings/env.glb')
  let monkey = null
  
  useFrame((state, delta) => {
    monkey.rotation.y += delta
  })

  for (const mesh of model.scene.children) {
    /* Change material of road marking because sometimes the road marking 
    would disappear depending on the position of the camera */
    if (mesh.name === 'RoadMarking') {
      mesh.material = new THREE.MeshBasicMaterial({ color: 'rgb(250, 255, 50)' })
    }

    // Found the hint!
    if (mesh.name === 'Hint!') {
      mesh.position.set(monkeyPosition.x, monkeyPosition.y, monkeyPosition.z)
      mesh.scale.set(12.5, 12.5, 12.5)

      monkey = mesh
    }

    // Shadows!
    if (mesh.name.includes('Terrain') || mesh.name.includes('Road')) {
      mesh.receiveShadow = true
    } else {
      mesh.castShadow = true
    }
  }

  return (
    <primitive onPointerDown={(e) => onClick(e)} object={model.scene} />
  )
}

export default memo(BuildingModel)