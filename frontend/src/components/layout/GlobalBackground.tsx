import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { BlendFunction } from 'postprocessing'
import { NodeParticles } from '../three/NodeParticles'

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-void">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 5, 5]} intensity={1} color="#FFB300" />
        
        <NodeParticles count={400} />

        <Suspense fallback={null}>
          <EffectComposer>
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.ADD}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-void/20 to-void" />
    </div>
  )
}
