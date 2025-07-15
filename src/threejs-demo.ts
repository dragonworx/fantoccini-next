import * as THREE from 'three';

// Initialize the Three.js scene
function initThreeJsDemo(): void {
	// Get container
	const container = document.getElementById('canvas-container');
	if (!container) {
		console.error('Canvas container not found');
		return;
	}

	// Scene setup
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x1a1a1a);

	// Orthographic camera setup - front view
	const aspect = window.innerWidth / window.innerHeight;
	const frustumSize = 6;
	const camera = new THREE.OrthographicCamera(
		frustumSize * aspect / -2,
		frustumSize * aspect / 2,
		frustumSize / 2,
		frustumSize / -2,
		0.1,
		1000
	);
	camera.position.set(0, 0, 10); // Front view
	camera.lookAt(0, 0, 0);

	// Renderer setup
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	container.appendChild(renderer.domElement);

	// Lighting setup
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(10, 10, 5);
	directionalLight.castShadow = true;
	directionalLight.shadow.camera.left = -10;
	directionalLight.shadow.camera.right = 10;
	directionalLight.shadow.camera.top = 10;
	directionalLight.shadow.camera.bottom = -10;
	directionalLight.shadow.camera.near = 0.1;
	directionalLight.shadow.camera.far = 50;
	scene.add(directionalLight);

	// Create materials
	const redMaterial = new THREE.MeshPhongMaterial({ 
		color: 0xff0000,
		shininess: 100,
		specular: 0x222222
	});
	
	const greenMaterial = new THREE.MeshPhongMaterial({ 
		color: 0x00ff00,
		shininess: 100,
		specular: 0x222222
	});

	// Create clock face (cylinder)
	const clockRadius = 2;
	const clockThickness = 0.2;
	const clockGeometry = new THREE.CylinderGeometry(clockRadius, clockRadius, clockThickness, 32);
	const clockFace = new THREE.Mesh(clockGeometry, redMaterial);
	clockFace.rotation.x = Math.PI / 2; // Rotate to face camera
	clockFace.castShadow = 	true;
	clockFace.receiveShadow = true;
	scene.add(clockFace);

	// Create sphere for the tip
	const sphereRadius = 0.15;
	const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
	const sphere = new THREE.Mesh(sphereGeometry, greenMaterial);
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	// Create skeletal system
	// Create bones
	const rootBone = new THREE.Bone();
	rootBone.position.set(0, 0, clockThickness / 2 + 0.1); // Position at clock face front
	
	const handBone = new THREE.Bone();
	handBone.position.y = clockRadius; // Length of the clock hand
	rootBone.add(handBone);

	// Create skeleton
	const skeleton = new THREE.Skeleton([rootBone, handBone]);

	// Create a simple geometry for the skinned mesh
	const boneLength = clockRadius;
	const boneCylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, boneLength, 8, 2);
	
	// Translate geometry so it extends from origin upward
	boneCylinderGeometry.translate(0, boneLength / 2, 0);
	
	// Position vertices for proper skinning
	const positionAttribute = boneCylinderGeometry.attributes.position;
	const vertex = new THREE.Vector3();
	
	// Create skinning attributes
	const skinIndices = [];
	const skinWeights = [];
	
	for (let i = 0; i < positionAttribute.count; i++) {
		vertex.fromBufferAttribute(positionAttribute, i);
		
		// Weight based on height
		const normalizedHeight = vertex.y / boneLength;
		
		skinIndices.push(0, 1, 0, 0);
		skinWeights.push(1 - normalizedHeight, normalizedHeight, 0, 0);
	}
	
	boneCylinderGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
	boneCylinderGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

	// Create skinned mesh with visible material
	const boneMaterial = new THREE.MeshPhongMaterial({ 
		color: 0xffff00,  // Yellow color for bone visibility
		emissive: 0x444400,
		shininess: 100
	});
	const skinnedMesh = new THREE.SkinnedMesh(boneCylinderGeometry, boneMaterial);
	skinnedMesh.bind(skeleton);
	skinnedMesh.position.z = clockThickness / 2 + 0.1;
	skinnedMesh.castShadow = true;
	skinnedMesh.receiveShadow = true;
	scene.add(skinnedMesh);

	// Create skeleton helper to visualize the bones
	const skeletonHelper = new THREE.SkeletonHelper(skinnedMesh);
	// Update the material to make it more visible
	const helperMaterial = skeletonHelper.material as THREE.LineBasicMaterial;
	helperMaterial.linewidth = 3;
	helperMaterial.color = new THREE.Color(0x00ffff); // Cyan color for visibility
	scene.add(skeletonHelper);

	// Add root bone to scene
	scene.add(rootBone);

	// Attach sphere to the hand bone
	handBone.add(sphere);
	sphere.position.set(0, 0, 0); // Position relative to hand bone
	
	// Add clock markings
	const markMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
	for (let i = 0; i < 12; i++) {
		const angle = (i / 12) * Math.PI * 2;
		const markGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.05);
		const mark = new THREE.Mesh(markGeometry, markMaterial);
		mark.position.x = Math.sin(angle) * (clockRadius - 0.3);
		mark.position.y = Math.cos(angle) * (clockRadius - 0.3);
		mark.position.z = clockThickness / 2 + 0.05;
		mark.rotation.z = -angle;
		scene.add(mark);
	}

	// Add subtle axes helper for reference
	const axesHelper = new THREE.AxesHelper(3);
	axesHelper.position.set(-2.5, -2.5, 0);
	scene.add(axesHelper);

	// Get slider elements
	const slider = document.getElementById('rotation-slider') as HTMLInputElement;
	const valueDisplay = document.getElementById('rotation-value') as HTMLSpanElement;

	// Handle rotation
	slider.addEventListener('input', () => {
		const degrees = parseFloat(slider.value);
		const radians = degrees * (Math.PI / 180);
		
		// Rotate the root bone around Z axis
		// Start at 12 o'clock (90 degrees offset) and rotate clockwise
		rootBone.rotation.z = -radians - Math.PI / 2;
		
		// Update display
		valueDisplay.textContent = `${degrees}°`;
	});
	
	// Initialize hand position to 12 o'clock
	rootBone.rotation.z = -Math.PI / 2;

	// Animation loop
	function animate(): void {
		requestAnimationFrame(animate);
		
		// SkeletonHelper automatically updates when bones change
		// No manual update needed
		
		renderer.render(scene, camera);
	}

	// Handle window resize
	window.addEventListener('resize', () => {
		const aspect = window.innerWidth / window.innerHeight;
		camera.left = frustumSize * aspect / -2;
		camera.right = frustumSize * aspect / 2;
		camera.top = frustumSize / 2;
		camera.bottom = frustumSize / -2;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	// Start animation
	animate();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initThreeJsDemo);
} else {
	initThreeJsDemo();
}