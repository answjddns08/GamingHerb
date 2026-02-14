import { Vector2 } from "three";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { VolumetricLightShader } from "../utils/shaders.js";
import { POST_PROCESSING_CONFIG } from "../constants/gameConfig.js";

/**
 * Post-processing 설정
 * @param {import("three").WebGLRenderer} renderer
 * @param {import("three").Scene} scene
 * @param {import("three").Camera} camera
 */
export function setupPostProcessing(renderer, scene, camera) {
  const sizes = { width: window.innerWidth, height: window.innerHeight };
  const composer = new EffectComposer(renderer);

  // RenderPass
  composer.addPass(new RenderPass(scene, camera));

  // Bokeh Pass (Depth of Field)
  const bokehPass = new BokehPass(scene, camera, {
    focus: POST_PROCESSING_CONFIG.bokeh.focus,
    aperture: POST_PROCESSING_CONFIG.bokeh.aperture,
    maxblur: POST_PROCESSING_CONFIG.bokeh.maxblur,
  });
  //composer.addPass(bokehPass);

  // Bloom 효과
  const bloomPass = new UnrealBloomPass(
    new Vector2(sizes.width, sizes.height),
    POST_PROCESSING_CONFIG.bloom.strength,
    POST_PROCESSING_CONFIG.bloom.radius,
    POST_PROCESSING_CONFIG.bloom.threshold,
  );
  //composer.addPass(bloomPass);

  // Volumetric Light Scattering (God Rays) - 비활성화 상태로
  const godRaysPass = new ShaderPass(VolumetricLightShader);
  godRaysPass.uniforms.exposure.value = POST_PROCESSING_CONFIG.godRays.exposure;
  godRaysPass.uniforms.decay.value = POST_PROCESSING_CONFIG.godRays.decay;
  godRaysPass.uniforms.density.value = POST_PROCESSING_CONFIG.godRays.density;
  godRaysPass.uniforms.weight.value = POST_PROCESSING_CONFIG.godRays.weight;
  godRaysPass.uniforms.samples.value = POST_PROCESSING_CONFIG.godRays.samples;
  // composer.addPass(godRaysPass); // 필요시 활성화

  // Vignette
  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.offset.value = POST_PROCESSING_CONFIG.vignette.offset;
  vignettePass.uniforms.darkness.value = POST_PROCESSING_CONFIG.vignette.darkness;
  composer.addPass(vignettePass);

  return {
    composer,
    bloomPass,
    godRaysPass,
    bokehPass,
    vignettePass,
  };
}

/**
 * Composer 리사이즈
 * @param {import("three/examples/jsm/postprocessing/EffectComposer").EffectComposer} composer
 * @param {import("three/examples/jsm/postprocessing/BokehPass").BokehPass} bokehPass
 * @param {import("three").Camera} camera
 */
export function onComposerResize(composer, bokehPass, camera) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  composer.setSize(w, h);
  if (bokehPass && bokehPass.uniforms.aspect) {
    bokehPass.uniforms.aspect.value = camera.aspect;
  }
}
