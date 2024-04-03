import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { BakeShadows, OrbitControls, Sky, Stars, useKeyboardControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import BuildingModel, {monkeyPosition} from './BuildingModel'
import CarModel from './CarModel'
import Lights from './Lights'
import Menu, { MenuChoice } from './Menu'
import * as THREE from 'three'
import gsap from 'gsap'

const Status = {
  Menu: 1,
  NewPath: {
    ChoosingCarFirstPos: 2,
    CarChoosingPath: 3
  },
  LoadPath: {
    FetchingPath: 4,
    CarFollowingPath: 5,
    CarEndedPath: 6 
  },
}

const apiUrl = 'http://localhost:5000'

export default function Experience() {
  const [ _, getKeys ] = useKeyboardControls()
  const [carPath, setCarPath] = useState([])
  const [isDay, setIsDay] = useState(true)
  const [pathIdx, setPathIdx] = useState(0)
  const [localPaths, setLocalPaths] = useState(
    localStorage.getItem('car-path') === null ? []: JSON.parse(localStorage.getItem('car-path')) 
  )

  const orbitControlsRef = useRef(null)
  const carRef = useRef(null)
  const spotLightRef = useRef(null)

  const [status, setStatus] = useState(Status.Menu)
  const { camera } = useThree() 

  const generalControls = useControls({
    perfVisible: true,
    path: {options: localPaths.map((e, idx) => idx)}
  }, [localPaths])

  const carControls = useControls({
    speed: {min: 1, max: 100, step: 1, value: 10},
    turnSpeed: {min: 0.1, max: 10, step: 0.1, value: 1}
  })

  const focusOnMenu = () => {
    const orbitPos = monkeyPosition.clone()
    orbitPos.y -= 30
    camera.position.copy(orbitPos)
    camera.position.z += 110
    orbitControlsRef.current.target = orbitPos
  }

  const focusOnMap = () => {
    orbitControlsRef.current.target = new THREE.Vector3(-2, 0, -10)
    camera.position.y = 410
    camera.position.x = -2
    camera.position.z = -25
  }

  const focusOnCar = () => {
    const carPos = carRef.current.position
    carRef.current.rotation.y = 0
    orbitControlsRef.current.target = carPos
    camera.position.copy(carPos)
    camera.position.y += 10
    camera.position.z -= 20
  }

  const onChooseMenu = (choice) => {
    if (choice === MenuChoice.NewPath) {
      setStatus(Status.NewPath.ChoosingCarFirstPos)
    } else if (choice === MenuChoice.LoadPath) {
      setStatus(Status.LoadPath.FetchingPath)
    }
  }

  const onClickedMap = (e) => {
    if (status === Status.NewPath.ChoosingCarFirstPos) {
      const carPos = e.point.clone()
      carPos.y += 1.0
    
      carRef.current.position.copy(carPos)

      if (status === Status.NewPath.ChoosingCarFirstPos) {
        setStatus(Status.NewPath.CarChoosingPath)
      }
    }
  }

  const postCarPath = () => {
    fetch(`${apiUrl}/car-path`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(carPath)
  })
  }

  const onEndChoosingPath = () => {
    const allPaths = [...localPaths]
    allPaths.push(carPath)
    localStorage.setItem('car-path', JSON.stringify(allPaths))
  
    postCarPath()

    setLocalPaths(allPaths)
    setStatus(Status.Menu)
  }

  /** Controller for whenever the status is changed */
  useEffect(() => {
    if (status === Status.Menu) {
      focusOnMenu()
      setCarPath([])
    } else if (status === Status.NewPath.ChoosingCarFirstPos) {
      focusOnMap()
    } else if (status === Status.NewPath.CarChoosingPath) {
      focusOnCar()
    } else if (status === Status.LoadPath.FetchingPath) {
      setCarPath(localPaths[generalControls.path ? generalControls.path : 0])
      setPathIdx(1)
    } else if (status === Status.LoadPath.CarFollowingPath) {
      focusOnCar()
    } else if (status === Status.LoadPath.CarEndedPath) {
      setIsDay(false)
    }
  }, [status])

  /** Use effect responsible for positioning the spotlight when the simulation has ended */
  useEffect(() => {
    if (!isDay && status === Status.LoadPath.CarEndedPath) {
      spotLightRef.current.position.set(
        carRef.current.position.x,
        10,
        carRef.current.position.z
      )

      gsap.to(carRef.current.position, {
        ease: 'power2.inOut',
        duration: 2,
        y: '+=5' 
      })

      spotLightRef.current.target = carRef.current
    }
  }, [isDay, status])

  // After fethcing the carPath from the API (in our case, after getting it from localStorage)
  useEffect(() => {
    if (status === Status.LoadPath.FetchingPath && carPath.length && pathIdx === 1) {
      carRef.current.position.set(
        carPath[0].position.x,
        carPath[0].position.y,
        carPath[0].position.z
      )
      console.log(carPath)
      setStatus(Status.LoadPath.CarFollowingPath)
    }
  }, [carPath, pathIdx])

  /** Function tha makes camera rotate with car */
  const adjustCameraRotateWithCar = (deltaCarRotation) => {
    const car = carRef.current

    // Adjust camera rotation to rotate with car
    const diff = new THREE.Vector3(
      camera.position.x - car.position.x,
      0,
      camera.position.z - car.position.z
    )
    const ang = Math.atan2(diff.z, diff.x)
    const xCameraInc = diff.length() * Math.cos(ang - deltaCarRotation)
    const zCameraInc = diff.length() * Math.sin(ang - deltaCarRotation)
    const cameraDeltaX = (car.position.x + xCameraInc) - camera.position.x
    const cameraDeltaZ = (car.position.z + zCameraInc) - camera.position.z

    camera.position.x += cameraDeltaX
    camera.position.z += cameraDeltaZ
  }
  
  /** Function to make camera follow the car */
  const adjustCameraTranslateWithCar = (deltaPosition) => {
    camera.position.add(deltaPosition)
  }

  /** Move car according to user's inputs */
  const moveCarFromKeyboard = (state, delta) => {
    const car = carRef.current
    const orbitControls = orbitControlsRef.current
    const { forward, backward, leftward, rightward } = getKeys()

    if (forward || backward) {
      const speed = delta * ((forward && carControls.speed) + (backward && -carControls.speed))
      const deltaPosition = new THREE.Vector3(
        speed * Math.sin(car.rotation.y),
        0.0,
        speed * Math.cos(car.rotation.y)
      )

      car.position.add(deltaPosition)

      adjustCameraTranslateWithCar(deltaPosition)
    }

    if (leftward || rightward) {
      const rotation = delta * ((leftward && carControls.turnSpeed) + (rightward && -carControls.turnSpeed))
      car.rotation.y += rotation

      adjustCameraRotateWithCar(rotation)
    }

    // Finally, update orbit controls target and focus camera on car
    if (forward || backward || leftward || rightward) {
      orbitControls.target = car.position
      camera.lookAt(car.position)
    }
  }

  /** Function responsible for incrementing the carPath at each 0.025s */
  const incrementPath = (state, delta) => {
    const car = carRef.current

    const l = carPath.length
    const pathObj = l ? carPath[l - 1] : {time: 0}
    
    /** In state carPath we store the position and elapsedTime  */
    if (state.clock.elapsedTime - pathObj.time > 0.025) {
      setCarPath([...carPath, 
        {
          position: { x: car.position.x, y: car.position.y, z: car.position.z },
          time: state.clock.elapsedTime
        }
      ])
      console.log(carPath)
    }
  }

  const moveCarFromPath = (state, delta) => {
    /** Get car Three group from ref */
    const car = carRef.current

    /** Calculate the next pos from the carPath in the simulation */ 
    const nextPos = new THREE.Vector3(
      carPath[pathIdx].position.x, 
      carPath[pathIdx].position.y, 
      carPath[pathIdx].position.z
    )
    
    /** Calculates the vector that represents the distance to next point in the simulation */
    const distToNext = nextPos.clone()
    distToNext.sub(car.position)
  
    /** Calculates angle of the distance vector */
    const angle = Math.atan2(distToNext.z, distToNext.x)
    /** Calculates new position according to carControls speed */
    const deltaPosition = new THREE.Vector3(
      carControls.speed * Math.cos(angle) * delta,
      0,
      carControls.speed * Math.sin(angle) * delta
    )

    /** Before update, we check if the new delta position vector is 
     * bigger than the vector representing the distance to next point
     * if that's the case we simply copy the distance to next to delta position
     * and update next path idx.
     */
    if (deltaPosition.length() > distToNext.length()) {
      deltaPosition.copy(distToNext)
      setPathIdx(pathIdx + 1)
    } else {
      /** Calculate the rotation of the car according to direction of vector distance */
      const deltaRotation = Math.PI / 2 - angle - car.rotation.y  
      car.rotation.y += deltaRotation  
    }
    
    car.position.add(deltaPosition)

    // adjustCameraRotateWithCar(deltaRotation)
    adjustCameraTranslateWithCar(deltaPosition)

    /**Update orbit controls and camera */
    orbitControlsRef.current.target = car.position
    camera.lookAt(car.position)
  }

  /** Hook responsible for the updates of everyframe */
  useFrame((state, delta) => {
    /** boolean variable indicating if the user wants to move to next step */
    const { register } = getKeys()

    
    if (status === Status.NewPath.CarChoosingPath) {
      /** User finished choosing car's path */
      if (register) {
        onEndChoosingPath()
        return
      }

      /** Updates car and camera movement according to keyboard */
      moveCarFromKeyboard(state, delta)

      /** Call function to incrementCarPath */
      incrementPath(state, delta)
    } else if (status === Status.LoadPath.CarFollowingPath) {
      /** If pathIdx is equal to carPath it means that car arrived at final point in the simulation */
      if (pathIdx === carPath.length) {
        setStatus(Status.LoadPath.CarEndedPath)
      } else {
        // Else, continue running the simulation
        moveCarFromPath(state, delta)
      }
    } else if (status === Status.LoadPath.CarEndedPath) {
      /** Animation of spinning car once it arrived at destination */
      carRef.current.rotation.y += delta

      /** If user press spacebar, we get back to the menu  */
      if (register) {
        setIsDay(true)
        setStatus(Status.Menu)
      }
    }
  })

  return (
    <>
      {/* Performances controls */}
      {generalControls.perfVisible && <Perf position='top-left' />}

      {/* Component for loading the environment model provided by Ansys */}
      <BuildingModel onClick={onClickedMap}/>

      {/* Menu for choosing the option, user can either choose between new path or load path */}
      <Menu showLoad={localPaths.length > 0} onChoose={onChooseMenu}/>
      
      {/* Baking shadows for better performances, since the buildings are static 
        In this case, I'm opting for not adding shadow to the car, I could have added a "ContactShadow"
        but I didn't have the time
      */}
      {isDay && <BakeShadows />}

      {/* Car model, component representing the banana car */}
      <CarModel ref={carRef}/>

      {/* Spotlight used for highlighting when the car arrived at destination! */}
      {!isDay && <spotLight angle={Math.PI / 4} intensity={1} castShadow ref={spotLightRef}/>}

      {/* Orbit controls for better control of the camera */}
      <OrbitControls ref={orbitControlsRef} />

      {/* Component for light controls according to variable isDay */}
      <Lights isDay={isDay}/>

      {/* If is not day (car arrived at destination) we add some stars in background */}
      {isDay ? <Sky distance={4500000} mieCoefficient={0.01} mieDirectionalG={1} /> : <Stars />}
    </>
  )
}
