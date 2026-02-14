import {
	Mesh,
	PlaneGeometry,
	MeshLambertMaterial,
	DoubleSide,
	TextureLoader,
	NearestFilter,
	Vector2,
} from "three";

/**
 * 나무 클래스
 */
export class Tree {
	constructor(texture, width, height, offset, scale) {
		this.texture = texture;
		this.width = width;
		this.height = height;
		this.offset = offset;

		this.texture.magFilter = NearestFilter;
		this.texture.minFilter = NearestFilter;

		this.imageWidth = texture.image.width;
		this.imageHeight = texture.image.height;

		const repeatX = this.width / this.imageWidth;
		const repeatY = this.height / this.imageHeight;
		const uvOffsetX = this.offset.x / this.imageWidth;
		const uvOffsetY = this.offset.y / this.imageHeight;

		this.texture.repeat.set(repeatX, repeatY);
		this.texture.offset.set(uvOffsetX, 1 - uvOffsetY - repeatY);

		const geometry = new PlaneGeometry(scale.x, scale.y);
		const material = new MeshLambertMaterial({
			map: this.texture,
			transparent: true,
			side: DoubleSide,
			depthWrite: false,
			depthTest: true,
			alphaTest: 0.8,
		});
		material.color.setScalar(0.45); // 배경 대비 밝기 완화
		this.mesh = new Mesh(geometry, material);
		this.mesh.userData.isBillboard = true;
		this.mesh.name = "Tree";
		this.mesh.castShadow = true; // 그림자 드리우기
		this.mesh.receiveShadow = false; // 나무는 그림자 안 받음
	}

	addToScene(scene, position) {
		this.mesh.position.copy(position);
		scene.add(this.mesh);
	}
}

/**
 * 나무 생성 헬퍼
 */
export const createTree = async (sizeKey, variantIndex, scale, treeConfigs) => {
	const config = treeConfigs[sizeKey];
	if (!config) {
		throw new Error(`Invalid tree size key: ${sizeKey}`);
	}
	if (variantIndex < 0 || variantIndex >= config.offsets.length) {
		throw new Error(`Invalid variant index: ${variantIndex}`);
	}

	const offset = new Vector2(
		config.offsets[variantIndex].x,
		config.offsets[variantIndex].y,
	);

	return new Promise((resolve, reject) => {
		const loader = new TextureLoader();
		loader.load(
			config.path,
			(texture) => {
				const tree = new Tree(
					texture,
					config.width,
					config.height,
					offset,
					scale,
				);
				resolve(tree);
			},
			undefined,
			(error) => {
				console.error("나무 텍스처 로딩 실패:", error);
				reject(error);
			},
		);
	});
};
