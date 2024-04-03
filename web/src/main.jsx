import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience'
import { Leva } from 'leva'
import { KeyboardControls } from '@react-three/drei'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Leva />
    <KeyboardControls
      map={[
        {name: 'forward', keys: ['ArrowUp', 'KeyW']},
        {name: 'backward', keys: ['ArrowDown', 'KeyS']},
        {name: 'leftward', keys: ['ArrowLeft', 'KeyA']},
        {name: 'rightward', keys: ['ArrowRight', 'KeyD']},
        {name: 'register', keys: ['Space']},
      ]}
    >
      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [2, 4, 6]
        }}
      >
        <Experience />
      </Canvas>
    </KeyboardControls>
  </StrictMode>,
)
