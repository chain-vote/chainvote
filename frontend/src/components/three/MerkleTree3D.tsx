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
function DataFlow({ from, to, count = 5, color = "#4fc3f7" }: { from: [number, number, number], to: [number, number, number], count?: number, color?: string }) {
  const points = useMemo(() => new Float32Array(count * 3), [count])
  
  const ref = useRef<THREE.Points>(null)
  useFrame((state) => {
    if (!ref.current) return
    const positions = ref.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    
    const mid = [from[0], (from[1] + to[1]) / 2, to[2]]

    for (let i = 0; i < count; i++) {
        const speed = 0.2 + (i % 3) * 0.05
        const t = (time * speed + (i / count)) % 1
        
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
       <PointMaterial transparent color={color} size={0.1} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.6} />
    </Points>
  )
}

function YggdrasilTrunk() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central Core */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.02, 0.6, 8, 32, 1, true]} />
        <meshStandardMaterial 
          color="#00f2ff" 
          emissive="#00f2ff" 
          emissiveIntensity={2} 
          transparent 
          opacity={0.1} 
          wireframe 
        />
      </mesh>
      
      {/* Entwined Roots */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0.1]} position={[0, -1, 0]}>
          <cylinderGeometry args={[0.01, 0.3, 8, 16, 1, true]} />
          <meshStandardMaterial 
            color="#00ff66" 
            emissive="#00ff66" 
            emissiveIntensity={0.5} 
            transparent 
            opacity={0.15} 
            wireframe 
          />
        </mesh>
      ))}

      {/* Spirit Veil */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshStandardMaterial 
          color="#4fc3f7" 
          transparent 
          opacity={0.03} 
          side={THREE.BackSide} 
        />
      </mesh>
    </group>
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

  // Color mapping inspired by Yggdrasil (Bioluminescent Blue/Green/Gold)
  const baseColor = isTampered ? '#ff0000' : (!isIntact ? '#ff4500' : (isRoot ? '#00f2ff' : (isLeaf ? '#00ff66' : '#d4af37')))

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return
    const t = state.clock.elapsedTime
    
    // Floating animation
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.08
    
    if (isTampered) {
      meshRef.current.position.x += (Math.random() - 0.5) * 0.1
    }

    if (isNew) {
      matRef.current.emissiveIntensity = 5 + Math.sin(t * 12) * 3
    } else {
      matRef.current.emissiveIntensity = hovered ? 4 : (isRoot ? 2.5 : 1.5)
    }

    if (hovered) {
        meshRef.current.scale.setScalar(1.2 + Math.sin(t * 5) * 0.1)
    } else {
        meshRef.current.scale.setScalar(1)
    }
  })

  return (
    <group position={position}>
      <mesh 
        ref={meshRef} 
        onClick={(e) => { e.stopPropagation(); setClicked(!clicked) }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto' }}
      >
        {isRoot ? (
           <sphereGeometry args={[0.3, 32, 32]} />
        ) : isLeaf ? (
          <dodecahedronGeometry args={[0.15, 0]} />
        ) : (
          <octahedronGeometry args={[0.12, 0]} />
        )}
        <meshStandardMaterial
          ref={matRef}
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={1}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {(hovered || clicked) && (
        <Html distanceFactor={8} position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-void/95 backdrop-blur-2xl border border-gold/40 px-5 py-4 rounded-2xl shadow-[0_0_40px_rgba(0,242,255,0.2)] text-center pointer-events-auto min-w-[240px] border-l-4 border-l-gold">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2 font-cinzel">
              {isRoot ? 'Oracle Root' : (isLeaf ? 'Spirit Fruit' : 'Astral Branch')}
            </div>
            <div className="font-mono text-[9px] text-white/90 break-all leading-relaxed opacity-80 mb-3 bg-white/5 p-2 rounded">
                <span className="text-gold/50 block mb-1 uppercase text-[7px]">Merkle Proof Hash</span>
                {hash}
            </div>
            {isLeaf && (
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="w-1 h-1 rounded-full bg-chaingreen animate-ping" />
                    <span className="text-[8px] text-chaingreen uppercase tracking-widest font-bold">Verified Manifestation</span>
                </div>
            )}
            {clicked && (
              <button 
                onClick={(e) => { e.stopPropagation(); setClicked(false) }} 
                className="mt-1 px-4 py-2 bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold text-[9px] uppercase tracking-widest transition-all rounded-lg w-full font-cinzel"
              >
                Dismiss Ledger
              </button>
            )}
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
      const y = totalLevels === 1 ? 0 : (lvlIdx / (totalLevels - 1)) * 6 - 3
      
      // Horizontal arrangement: Circular for each level
      const radius = lvlIdx === totalLevels - 1 ? 0 : (totalLevels - 1 - lvlIdx) * 1.2 + 1.5
      
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
            const pLevelLen = parentLevel.length
            const pRadius = lvlIdx + 1 === totalLevels - 1 ? 0 : (totalLevels - 1 - (lvlIdx + 1)) * 1.2 + 1.5
            const pAngle = pLevelLen === 1 ? 0 : (parentIdx / pLevelLen) * Math.PI * 2
            const px = Math.cos(pAngle) * pRadius
            const pyCorrect = totalLevels === 1 ? 0 : ((lvlIdx + 1) / (totalLevels - 1)) * 6 - 3
            const pz = Math.sin(pAngle) * pRadius
            edges.push({ from: pos, to: [px, pyCorrect, pz] })
          }
        }
      })
    })

    return { nodes, edges }
  }, [treeStructure])

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 2, 12], fov: 50 }} style={{ background: 'transparent' }}>
        <fog attach="fog" args={['#060606', 8, 25]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[15, 20, 15]} angle={0.2} penumbra={1} intensity={3} color="#00f2ff" />
        <pointLight position={[-15, -10, -15]} intensity={1.5} color="#00ff66" />
        <pointLight position={[0, 0, 5]} intensity={1} color="#d4af37" />

        <YggdrasilTrunk />

        {edges.map((edge, i) => {
          const isRootLevel = nodes.find(n => n.position[0] === edge.to[0] && n.position[1] === edge.to[1] && n.position[2] === edge.to[2])?.isRoot
          return (
            <group key={i}>
              <QuadraticBezierLine 
                 start={edge.from} 
                 end={edge.to} 
                 mid={[edge.from[0] * 1.1, (edge.from[1] + edge.to[1]) / 2, edge.from[2] * 1.1]}
                 color={isRootLevel ? "#00f2ff" : (edge.from[1] < 0 ? "#00ff66" : "#d4af37")} 
                 lineWidth={1.2} 
                 transparent 
                 opacity={0.3} 
              />
              <DataFlow from={edge.from} to={edge.to} count={2} color={isRootLevel ? "#00f2ff" : "#00ff66"} />
            </group>
          )
        })}

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

        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.4} 
          minDistance={6} 
          maxDistance={22} 
        />

        <Suspense fallback={null}>
          <EffectComposer>
            <Bloom
              intensity={2.5}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.SCREEN}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
