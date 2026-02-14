import { Vector2 } from "three";

/**
 * Volumetric Light Scattering Shader (God Rays)
 */
export const VolumetricLightShader = {
	uniforms: {
		tDiffuse: { value: null },
		lightPosition: { value: new Vector2(0.5, 0.5) },
		exposure: { value: 0.18 },
		decay: { value: 0.95 },
		density: { value: 0.5 },
		weight: { value: 0.4 },
		samples: { value: 50 },
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		varying vec2 vUv;
		uniform sampler2D tDiffuse;
		uniform vec2 lightPosition;
		uniform float exposure;
		uniform float decay;
		uniform float density;
		uniform float weight;
		uniform int samples;

		void main() {
			vec2 texCoord = vUv;
			vec2 deltaTextCoord = texCoord - lightPosition;
			deltaTextCoord *= 1.0 / float(samples) * density;

			vec4 color = texture2D(tDiffuse, texCoord);
			float illuminationDecay = 1.0;

			for(int i = 0; i < 100; i++) {
				if(i >= samples) break;

				texCoord -= deltaTextCoord;
				vec4 sampleColor = texture2D(tDiffuse, texCoord);

				sampleColor *= illuminationDecay * weight;
				color += sampleColor;
				illuminationDecay *= decay;
			}

			gl_FragColor = color * exposure;
		}
	`,
};
