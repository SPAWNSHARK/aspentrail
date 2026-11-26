ARGO STATION / SPECIES V2
Replaces the V1 six-species prototype, not the K’Vetar or Hiveport packs.
18 standalone GLB 2.0 models; 3 palette variants per species. Embedded 512px procedural base-color and normal maps, metallic/roughness factors, emissive accents. Geometry is rebuilt using interpolated cross sections, detailed accessories and species-specific proportions.
Animation hierarchy and rotation keyframes are carried over from V1 (Idle, Walk, Talk, Drink, Wave; Velari additionally WingStretch). They are rigid joint animations, not weighted skinning. Revalidate poses and collisions in game before deployment.
Three.js: load using GLTFLoader, create AnimationMixer(gltf.scene), select clips by name. Set environment map for metal reflections and use ambient and directional lighting. Models are Y-up and +Z facing, in meters. Set NPC collider height and radius based on model bounds.
Diagnostic preview shows actual generated geometry and vertex-sampled base color under simplified lighting; not a full PBR render. These are stylized procedural assets, not hand-sculpted photorealistic characters.
