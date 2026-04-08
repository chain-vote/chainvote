import { useMemo, useRef, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, QuadraticBezierLine, OrbitControls, Html, Points, PointMaterial } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useChainStore } from '../../store/chainStore'
import { useMerkleTree } from '../../hooks/useMerkleTree'
import { useChainSocket } from '../../hooks/useChainSocket'

/**
 * DataFlow: Visualizes particles flowing from child to parent, 
 * symbolizing the "sealing" of truth into the root.
 */
function DataFlow({ from, to, count = 5 }: { from: [number, number, number], to: [number, number, number], count?: number }) {
  const points = useMemo(() => new Float32Array(count * 3), [count])
  
  const ref = useRef<THREE.Points>(null)
  useFrame((state) => {
    if (!ref.current) return
    const positions = ref.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    
    // Control point for quadratic curve to mimic branches
    const mid = [from[0], (from[1] + to[1]) / 2, to[2]]

    for (let i = 0; i < count; i++) {
        const speed = 0.5 + (i % 3) * 0.2
        const t = (time * speed + (i / count)) % 1
        
        // Quadratic Bezier Formula: (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        const outT = 1 - t
        const a = outT * outT
        const b = 2 * outT * t
        const c = t * t

        positions[i * 3]     = a * from[0] + b * mid[0] + c * to[0]
        positions[i * 3 + 1] = a * from[1] + b * mid[1] + c * to[1]
        positions[i * 3 + 2] = a * from[2] + b * mid[2] + c * to[2]
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={ref}>
       <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
       </bufferGeometry>
       <PointMaterial transparent color="#d4af37" size={0.06} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
    </Points>
  )
}

function MerkleNode({
  position,
  isLeaf,
  isIntact,
  isNew,
  isTampered,
  hash,
  isRoot
}: {
  position: [number, number, number]
  isLeaf: boolean
  isIntact: boolean
  isNew: boolean
  isTampered: boolean
  hash: string
  isRoot: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHover] = useState(false)
  const [clicked, setClicked] = useState(false)

  const color = isTampered ? '#ff0000' : (!isIntact ? '#ff4500' : (isRoot ? '#4fc3f7' : (isLeaf ? '#00ff66' : '#d4af37')))

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.05
    
    if (isTampered) {
      meshRef.current.position.x += (Math.random() - 0.5) * 0.08
    }

    if (isNew) {
      matRef.current.emissiveIntensity = 4 + Math.sin(t * 12) * 2
    } else {
      matRef.current.emissiveIntensity = hovered ? 3 : (isRoot ? 2 : 1.2)
    }
  })

  return (
    <group position={position}>
      <Float speed={isNew ? 4 : 1.5} floatIntensity={hovered ? 0.6 : 0.1}>
        <mesh 
          ref={meshRef} 
          onClick={(e) => { e.stopPropagation(); setClicked(!clicked) }}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto' }}
        >
          {isRoot ? (
             <sphereGeometry args={[0.25, 32, 32]} />
          ) : isLeaf ? (
            <icosahedronGeometry args={[0.12, 1]} />
          ) : (
            <octahedronGeometry args={[0.1, 0]} />
          )}
          <meshStandardMaterial
            ref={matRef}
            color={color}
            emissive={color}
            emissiveIntensity={1}
            roughness={0.2}
            metalness={0.8}
            wireframe={hovered}
          />
        </mesh>
      </Float>
      
      {clicked && (
        <Html distanceFactor={10} position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-void/90 backdrop-blur-xl border border-gold/40 px-4 py-3 rounded-xl shadow-2xl text-center pointer-events-auto min-w-[200px]">
            <div className="text-[10px] uppercase tracking-widest text-gold mb-2 font-cinzel">Mystical Node</div>
            <div className="font-mono text-[9px] text-white/90 break-all leading-tight opacity-70 mb-3">{hash}</div>
            <button onClick={() => setClicked(false)} className="px-3 py-1 border border-gold/20 hover:bg-gold/10 text-gold text-[9px] uppercase tracking-widest transition-all rounded">Dismiss</button>
          </div>
        </Html>
      )}
    </group>
  )
}

export function MerkleTree3D() {
  const electionId = useChainStore((s) => s.electionId)
  const treeStructure = useChainStore((s) => s.treeStructure)
  const integrityMap = useChainStore((s) => s.integrityMap)
  const newVoteHash = useChainStore((s) => s.newVoteHash)
  const tamperedVoteId = useChainStore((s) => s.tamperedVoteId)

  useMerkleTree(electionId)
  useChainSocket(electionId)

  const { nodes, edges } = useMemo(() => {
    const nodes: any[] = []
    const edges: any[] = []
    if (!treeStructure.length) return { nodes, edges }

    const totalLevels = treeStructure.length
    
    treeStructure.forEach((level, lvlIdx) => {
      // Arrangement: Root at top (Y positive), Leaves at bottom (Y negative)
      // Level Y: from -2.5 to 2.5
      const y = totalLevels === 1 ? 0 : (lvlIdx / (totalLevels - 1)) * 5 - 2.5
      
      // Horizontal arrangement: Circular for each level
      const radius = lvlIdx === totalLevels - 1 ? 0 : (totalLevels - 1 - lvlIdx) * 0.8 + 1
      
      level.forEach((node, nodeIdx) => {
        const angle = level.length === 1 ? 0 : (nodeIdx / level.length) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const pos: [number, number, number] = [x, y, z]

        nodes.push({
          id: `${lvlIdx}-${nodeIdx}`,
          position: pos,
          hash: node.hash,
          voteId: node.id,
          isLeaf: lvlIdx === 0,
          isRoot: lvlIdx === totalLevels - 1
        })

        if (lvlIdx < totalLevels - 1) {
          const parentLevel = treeStructure[lvlIdx + 1]
          const parentIdx = Math.floor(nodeIdx / 2)
          if (parentLevel && parentLevel[parentIdx]) {
            // Re-calculate parent pos
            const pLevelLen = parentLevel.length
            const pRadius = lvlIdx + 1 === totalLevels - 1 ? 0 : (totalLevels - 1 - (lvlIdx + 1)) * 0.8 + 1
            const pAngle = pLevelLen === 1 ? 0 : (parentIdx / pLevelLen) * Math.PI * 2
            const px = Math.cos(pAngle) * pRadius
            const py = (lvlIdx + 1 / (totalLevels - 1)) * 5 - 2.5 // This line was a bit wrong in local var, recalculating correctly in next step
            const pyCorrect = totalLevels === 1 ? 0 : ((lvlIdx + 1) / (totalLevels - 1)) * 5 - 2.5
            const pz = Math.sin(pAngle) * pRadius
            edges.push({ from: pos, to: [px, pyCorrect, pz] })
          }
        }
      })
    })

    return { nodes, edges }
  }, [treeStructure])

  return (
    <Canvas camera={{ position: [0, 2, 8], fov: 60 }} style={{ background: 'transparent' }}>
      <fog attach="fog" args={['#060606', 5, 20]} />
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#4fc3f7" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#d4af37" />

      {edges.map((edge, i) => (
        <group key={i}>
          <QuadraticBezierLine 
             start={edge.from} 
             end={edge.to} 
             mid={[edge.from[0], (edge.from[1] + edge.to[1]) / 2, edge.to[2]]}
             color="#d4af37" 
             lineWidth={2} 
             transparent 
             opacity={0.3} 
          />
          <DataFlow from={edge.from} to={edge.to} count={4} />
        </group>
      ))}

      {nodes.map((node) => (
        <MerkleNode
          key={node.id}
          hash={node.hash}
          position={node.position}
          isLeaf={node.isLeaf}
          isRoot={node.isRoot}
          isIntact={integrityMap[node.hash] !== false}
          isNew={node.hash === newVoteHash}
          isTampered={node.voteId === tamperedVoteId}
        />
      ))}

      <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} minDistance={4} maxDistance={15} />

      <Suspense fallback={null}>
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
