// ============================================================================
// ZOMBIE SURVIVOR OUTPOST 3D - MAP & WORLD MODULE
// High Performance Instanced PBR Outpost Environment
// ============================================================================

import * as THREE from 'three';

export const ZOMBIE_PORTAL_POS = new THREE.Vector3(19.6, 0, -4.8);
export const ZOMBIE_SPAWN_POS = new THREE.Vector3(-4.0, 0, 1.5);

class AssetLibrary {
      constructor() {
        this.geometries = {};
        this.materials = {};
        this._initMaterials();
        this._initGeometries();
      }

      _initMaterials() {
        // Shared matte / flat-shaded materials (low GPU cost)
        const std = (color, roughness = 0.88, metalness = 0.08, extra = {}) =>
          new THREE.MeshStandardMaterial({
            color,
            roughness,
            metalness,
            flatShading: true,
            ...extra
          });

        const lambert = (color, extra = {}) =>
          new THREE.MeshLambertMaterial({
            color,
            flatShading: true,
            ...extra
          });

        // Structural & Compound Materials
        this.materials.corrugatedWall = std(0x556475, 0.72, 0.35);
        this.materials.fencePost = lambert(0x4c3a2b);
        this.materials.barbedWire = std(0x28303b, 0.55, 0.65);
        this.materials.woodDark = lambert(0x4a3625);
        this.materials.woodMedium = lambert(0x634832);
        this.materials.woodLight = lambert(0x7c5c40);
        this.materials.woodCrate = lambert(0x6b4e34);

        // Camp Materials
        this.materials.tentCanvasOlive = lambert(0x656c58, { side: THREE.DoubleSide });
        this.materials.tentCanvasKhaki = lambert(0x7a7158, { side: THREE.DoubleSide });
        this.materials.tentInterior = lambert(0x14171d);
        this.materials.sandbag = lambert(0x7e755c);
        this.materials.supplySack = lambert(0x6e654d);
        this.materials.oilDrum = std(0x3a4859, 0.6, 0.4);
        this.materials.stone = lambert(0x4a525d);
        this.materials.charredLog = lambert(0x2a1f1a);
        this.materials.emberBed = new THREE.MeshBasicMaterial({ color: 0xff5a12 });
        this.materials.flameOuter = new THREE.MeshBasicMaterial({
          color: 0xff6b1a,
          transparent: true,
          opacity: 0.9
        });
        this.materials.flameInner = new THREE.MeshBasicMaterial({
          color: 0xffd252,
          transparent: true,
          opacity: 0.95
        });

        // Barricade & Lamps
        this.materials.stripeRed = lambert(0xa63329);
        this.materials.stripeWhite = lambert(0xcfd4dc);
        this.materials.lampWarmEmissive = new THREE.MeshBasicMaterial({ color: 0xffdf99 });
        this.materials.metalDark = std(0x272f3b, 0.65, 0.45);

        // Background Environment Materials
        this.materials.ruinConcrete = lambert(0x3a4659);
        this.materials.ruinConcreteDark = lambert(0x2b3545);
        this.materials.ruinWindow = lambert(0x101622);
        this.materials.deadTree = lambert(0x352c26);
        this.materials.grass = lambert(0x3e4b3c, { side: THREE.DoubleSide });
        this.materials.rock = lambert(0x424b59);

        // Wrecked Car Palette
        this.materials.carBodies = [
          std(0x49535e, 0.78, 0.2),
          std(0x585148, 0.82, 0.15),
          std(0x3f4c52, 0.75, 0.2),
          std(0x5b4a44, 0.85, 0.12)
        ];
        this.materials.carGlass = std(0x18202c, 0.3, 0.4);
        this.materials.carTire = lambert(0x1b1e24);

        // Portal Materials
        this.materials.portalFrame = std(0x282236, 0.7, 0.35);
        this.materials.portalRimGlow = new THREE.MeshBasicMaterial({ color: 0xf4c7ff });
        this.materials.portalSwirlOuter = new THREE.MeshBasicMaterial({
          color: 0xa838ff,
          transparent: true,
          opacity: 0.72,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.materials.portalSwirlInner = new THREE.MeshBasicMaterial({
          color: 0xd97dff,
          transparent: true,
          opacity: 0.58,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.materials.portalCore = new THREE.MeshBasicMaterial({
          color: 0x4b1280,
          transparent: true,
          opacity: 0.82,
          side: THREE.DoubleSide
        });
      }

      _initGeometries() {
        // Basic shared primitives
        this.geometries.unitBox = new THREE.BoxGeometry(1, 1, 1);
        this.geometries.unitCyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 7);
        this.geometries.oilDrum = new THREE.CylinderGeometry(0.42, 0.42, 1.05, 8);
        this.geometries.sandbag = new THREE.BoxGeometry(0.82, 0.28, 0.44);
        this.geometries.fencePanel = new THREE.BoxGeometry(1.0, 2.35, 0.14);
        this.geometries.fencePost = new THREE.BoxGeometry(0.18, 2.75, 0.18);
        this.geometries.barbedCoil = new THREE.TorusGeometry(0.24, 0.024, 4, 7);
        this.geometries.rock = new THREE.DodecahedronGeometry(0.32, 0);
        this.geometries.flameCone = new THREE.ConeGeometry(0.36, 1.15, 5);

        // Grass tuft cluster (3 crossed low-poly blades merged manually into one BufferGeometry)
        this.geometries.grassTuft = this._createGrassTuftGeometry();

        // Low-poly A-Frame Tent Triangular Prism Geometry
        this.geometries.tentPrism = this._createTentPrismGeometry(3.4, 2.35, 4.1);
      }

      /**
       * Creates a clean triangular prism geometry for A-frame survival tents.
       */
      _createTentPrismGeometry(width, height, depth) {
        const hw = width * 0.5;
        const hd = depth * 0.5;
        const positions = new Float32Array([
          // Left roof slope
          -hw, 0, hd,   0, height, hd,   0, height, -hd,
          -hw, 0, hd,   0, height, -hd,  -hw, 0, -hd,
          // Right roof slope
          hw, 0, -hd,   0, height, -hd,  0, height, hd,
          hw, 0, -hd,   0, height, hd,   hw, 0, hd,
          // Back triangle wall
          -hw, 0, -hd,  0, height, -hd,  hw, 0, -hd,
          // Front partial flaps (left & right corners leaving dark center entrance)
          -hw, 0, hd,   -hw * 0.38, 0, hd,   0, height, hd,
          hw * 0.38, 0, hd,  hw, 0, hd,      0, height, hd
        ]);
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.computeVertexNormals();
        return geom;
      }

      /**
       * Creates a lightweight 3-blade grass tuft geometry for InstancedMesh rendering.
       */
      _createGrassTuftGeometry() {
        const blades = [];
        const angles = [0, 2.1, 4.2];
        for (const a of angles) {
          const c = Math.cos(a);
          const s = Math.sin(a);
          const w = 0.12;
          const h = 0.55 + (a % 0.25);
          const lean = 0.16;
          blades.push(
            -w * c, 0, -w * s,
             w * c, 0,  w * s,
             lean * s, h, -lean * c
          );
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(blades, 3));
        geom.computeVertexNormals();
        return geom;
      }

      /**
       * Creates a low-poly wrecked/abandoned sedan using shared geometries.
       */
      createWreckedCar(colorIndex = 0) {
        const car = new THREE.Group();
        const bodyMat = this.materials.carBodies[colorIndex % this.materials.carBodies.length];

        // Chassis lower body
        const chassis = new THREE.Mesh(this.geometries.unitBox, bodyMat);
        chassis.scale.set(1.85, 0.62, 4.1);
        chassis.position.y = 0.56;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        car.add(chassis);

        // Cabin upper roof
        const cabin = new THREE.Mesh(this.geometries.unitBox, bodyMat);
        cabin.scale.set(1.62, 0.54, 1.95);
        cabin.position.set(0, 1.12, -0.15);
        cabin.castShadow = true;
        car.add(cabin);

        // Dark recessed windshield & rear glass strip
        const glass = new THREE.Mesh(this.geometries.unitBox, this.materials.carGlass);
        glass.scale.set(1.66, 0.36, 1.65);
        glass.position.set(0, 1.1, -0.15);
        car.add(glass);

        // 4 Wheels
        const wheelOffsets = [
          [-0.92, 0.34, 1.25],
          [0.92, 0.34, 1.25],
          [-0.92, 0.34, -1.25],
          [0.92, 0.34, -1.25]
        ];
        for (const [wx, wy, wz] of wheelOffsets) {
          const wheel = new THREE.Mesh(this.geometries.unitCyl, this.materials.carTire);
          wheel.rotation.z = Math.PI * 0.5;
          wheel.scale.set(0.68, 0.26, 0.68);
          wheel.position.set(wx, wy, wz);
          car.add(wheel);
        }
        return car;
      }

      dispose() {
        Object.values(this.geometries).forEach((g) => g.dispose());
        Object.values(this.materials).forEach((m) => {
          if (Array.isArray(m)) m.forEach((im) => im.dispose());
          else m.dispose();
        });
      }
    }

    /**
     * ============================================================================
     * 1B. CHARACTER BUILDER (ORGANIC STYLIZED LOW-POLY SURVIVORS)
     * Builds sculpted, proportional, non-boxy characters matching the gritty
     * comic-style survivor reference sheet using Capsule/Sphere/Cylinder/Lathe/
     * Torus geometries + lightweight shared procedural CanvasTextures.
     * ============================================================================
     */
    class CharacterBuilder {
      constructor() {
        this.geometries = {};
        this.textures = {};
        this.materials = {};

        this._initSharedGeometries();
        this._initProceduralTextures();
        this._initSharedMaterials();
      }

      _initSharedGeometries() {
        // Sculpted Head & Facial Structure
        this.geometries.head = new THREE.SphereGeometry(0.185, 14, 12);
        this.geometries.neck = new THREE.CylinderGeometry(0.068, 0.082, 0.13, 8);
        this.geometries.nose = new THREE.ConeGeometry(0.024, 0.068, 5);
        this.geometries.ear = new THREE.SphereGeometry(0.036, 6, 5);

        // Organic Proportional Torso, Pelvis & Articulated Limbs
        this.geometries.torsoMale = new THREE.CylinderGeometry(0.205, 0.162, 0.54, 10);
        this.geometries.torsoFemale = new THREE.CylinderGeometry(0.165, 0.142, 0.50, 10);
        this.geometries.torsoChild = new THREE.CylinderGeometry(0.17, 0.20, 0.56, 10);
        this.geometries.pelvis = new THREE.SphereGeometry(0.168, 10, 8);

        this.geometries.shoulder = new THREE.SphereGeometry(0.072, 8, 6);
        this.geometries.upperArm = new THREE.CapsuleGeometry(0.058, 0.185, 4, 8);
        this.geometries.foreArm = new THREE.CapsuleGeometry(0.048, 0.175, 4, 8);
        this.geometries.hand = new THREE.SphereGeometry(0.048, 7, 6);

        this.geometries.thigh = new THREE.CapsuleGeometry(0.078, 0.24, 4, 8);
        this.geometries.calf = new THREE.CapsuleGeometry(0.060, 0.23, 4, 8);
        this.geometries.bootAnkle = new THREE.CylinderGeometry(0.062, 0.066, 0.14, 8);
        this.geometries.bootFoot = new THREE.CapsuleGeometry(0.058, 0.11, 4, 7);

        // Hair, Helmet & Garment Geometry
        this.geometries.hairCap = new THREE.SphereGeometry(0.194, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62);
        this.geometries.hairTuft = new THREE.ConeGeometry(0.056, 0.165, 5);
        this.geometries.hairBun = new THREE.SphereGeometry(0.088, 9, 8);

        this.geometries.helmetDome = new THREE.SphereGeometry(0.218, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
        this.geometries.helmetBrim = new THREE.TorusGeometry(0.214, 0.022, 6, 16);
        this.geometries.chinStrap = new THREE.TorusGeometry(0.165, 0.011, 5, 14, Math.PI);

        this.geometries.headband = new THREE.TorusGeometry(0.188, 0.024, 6, 16);
        this.geometries.shawlWrap = new THREE.TorusGeometry(0.178, 0.066, 7, 14);
        this.geometries.shawlFlap = new THREE.ConeGeometry(0.17, 0.34, 5);
        this.geometries.belt = new THREE.CylinderGeometry(0.182, 0.184, 0.075, 12);
        this.geometries.pouch = new THREE.CapsuleGeometry(0.045, 0.04, 4, 6);

        // Flared Tattered Skirt via LatheGeometry
        this.geometries.skirt = new THREE.LatheGeometry([
          new THREE.Vector2(0.145, 0.64),
          new THREE.Vector2(0.185, 0.44),
          new THREE.Vector2(0.235, 0.22),
          new THREE.Vector2(0.270, 0.00)
        ], 12);

        // Backpacks, Bedroll, Satchel & Ragdoll Primitives
        this.geometries.packBody = new THREE.CapsuleGeometry(0.175, 0.26, 5, 10);
        this.geometries.bedroll = new THREE.CylinderGeometry(0.082, 0.082, 0.44, 10);
        this.geometries.strapBand = new THREE.TorusGeometry(0.26, 0.018, 5, 16);
        this.geometries.satchel = new THREE.CapsuleGeometry(0.11, 0.12, 4, 8);
        this.geometries.bundleBag = new THREE.SphereGeometry(0.17, 9, 8);
        this.geometries.dollHead = new THREE.SphereGeometry(0.088, 9, 8);
        this.geometries.dollDress = new THREE.ConeGeometry(0.085, 0.20, 7);
        this.geometries.dollLimb = new THREE.CapsuleGeometry(0.024, 0.08, 4, 5);

        // Rifle Low-Poly Sub-Parts
        this.geometries.cylUnit = new THREE.CylinderGeometry(0.5, 0.5, 1, 7);
        this.geometries.boxUnit = new THREE.BoxGeometry(1, 1, 1);
      }

      /**
       * Helper to generate a crisp CanvasTexture with SRGB color space.
       */
      _makeCanvasTex(size, drawFn) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, size);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
      }

      /**
       * Paints hand-drawn comic-style expressive faces onto 256x256 CanvasTextures.
       * Centered at u=0.5 (x=128) so rotating head mesh by -PI/2 puts the face directly at +Z.
       */
      _createFaceTexture({ skin, stubble = false, beard = false, female = false, child = false, dirt = 0.7 }) {
        return this._makeCanvasTex(256, (ctx, s) => {
          // Base skin tone
          ctx.fillStyle = skin;
          ctx.fillRect(0, 0, s, s);

          // Subtle side cheek & brow shading for comic volume
          const grad = ctx.createRadialGradient(128, 126, 20, 128, 134, 84);
          grad.addColorStop(0, 'rgba(255, 240, 220, 0.14)');
          grad.addColorStop(0.75, 'rgba(70, 45, 30, 0.14)');
          grad.addColorStop(1, 'rgba(35, 25, 20, 0.32)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, s, s);

          // Gritty dirt smudges on cheeks, forehead & chin
          const smudges = [
            [98, 145, 16, 10], [156, 148, 18, 11],
            [116, 100, 14, 7], [146, 164, 12, 8]
          ];
          for (const [sx, sy, rx, ry] of smudges) {
            const sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, rx);
            sg.addColorStop(0, `rgba(48, 36, 28, ${0.38 * dirt})`);
            sg.addColorStop(1, 'rgba(48, 36, 28, 0)');
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.ellipse(sx, sy, rx, ry, 0.25, 0, Math.PI * 2);
            ctx.fill();
          }

          // Beard / Stubble around jaw & upper lip
          if (stubble || beard) {
            ctx.fillStyle = beard ? 'rgba(44, 34, 26, 0.56)' : 'rgba(52, 42, 34, 0.34)';
            ctx.beginPath();
            ctx.ellipse(128, 174, 34, 24, 0, 0, Math.PI * 2);
            ctx.fill();

            // Comic ink stubble hatch strokes
            ctx.strokeStyle = beard ? 'rgba(24, 18, 14, 0.72)' : 'rgba(30, 24, 18, 0.45)';
            ctx.lineWidth = 1.4;
            for (let i = 0; i < (beard ? 55 : 32); i++) {
              const a = (i / (beard ? 55 : 32)) * Math.PI;
              const rx = 128 + Math.cos(a) * (12 + (i % 5) * 4.5);
              const ry = 164 + Math.sin(a) * (10 + (i % 3) * 5.5);
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx + (i % 2 ? 1.5 : -1.5), ry + 4.5);
              ctx.stroke();
            }
          }

          const eyeY = child ? 132 : 124;
          const eyeSpread = child ? 21 : 19;
          const eyeW = child ? 12.5 : (female ? 11.5 : 10.5);
          const eyeH = child ? 9.5 : (female ? 7.8 : 6.6);

          // Tired dark under-eye circles / exhaustion bags
          for (const side of [-1, 1]) {
            const ex = 128 + side * eyeSpread;
            ctx.fillStyle = 'rgba(42, 30, 36, 0.48)';
            ctx.beginPath();
            ctx.ellipse(ex, eyeY + eyeH * 0.65, eyeW * 1.15, eyeH * 0.78, side * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Eye sclera (off-white weathered tone)
            ctx.fillStyle = '#e7dfd4';
            ctx.beginPath();
            ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dark iris & pupil
            ctx.fillStyle = '#2c221b';
            ctx.beginPath();
            ctx.arc(ex, eyeY + 0.5, child ? 5.2 : 4.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0d0a09';
            ctx.beginPath();
            ctx.arc(ex, eyeY + 0.5, child ? 2.6 : 2.1, 0, Math.PI * 2);
            ctx.fill();

            // Tiny eye catchlight so eyes feel alive
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex - 1.5, eyeY - 1.5, 1.35, 0, Math.PI * 2);
            ctx.fill();

            // Heavy comic ink upper eyelid & tired lower crease
            ctx.strokeStyle = '#181310';
            ctx.lineWidth = female ? 2.8 : 2.4;
            ctx.beginPath();
            ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, Math.PI * 1.05, Math.PI * 1.95);
            ctx.stroke();

            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(ex, eyeY + eyeH * 0.55, eyeW * 0.85, 0.25, Math.PI - 0.25);
            ctx.stroke();

            // Worried / tired eyebrows slanted slightly upward in center
            ctx.strokeStyle = '#241a13';
            ctx.lineWidth = child ? 3.2 : (female ? 3.0 : 4.4);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ex - side * (eyeW * 0.9), eyeY - eyeH - 7.5);
            ctx.quadraticCurveTo(ex, eyeY - eyeH - 8.5, ex + side * (eyeW * 1.05), eyeY - eyeH - 3.5);
            ctx.stroke();
          }

          // Subtle comic nose shadow & nostrils
          ctx.strokeStyle = '#2c2018';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(127, eyeY + 4);
          ctx.lineTo(125, eyeY + 19);
          ctx.lineTo(131, eyeY + 20);
          ctx.stroke();

          // Expressive tired / solemn mouth
          const mouthY = child ? 162 : 160;
          ctx.strokeStyle = '#231814';
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(128 - (child ? 9 : 13), mouthY + 2);
          ctx.quadraticCurveTo(128, mouthY - 2.5, 128 + (child ? 9 : 13), mouthY + 2);
          ctx.stroke();

          if (female) {
            ctx.fillStyle = 'rgba(135, 72, 66, 0.45)';
            ctx.beginPath();
            ctx.ellipse(128, mouthY + 1.5, 9, 3.2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      /**
       * Paints weathered fabric textures with stitched patches, camo blotches, and comic ink seams.
       */
      _createFabricTexture({ base, camo = false, patches = true, patchColor = '#4e4639', seamColor = '#1c1815', stripe = false }) {
        return this._makeCanvasTex(128, (ctx, s) => {
          ctx.fillStyle = base;
          ctx.fillRect(0, 0, s, s);

          // Gritty comic grime & weave texture
          for (let i = 0; i < 340; i++) {
            const x = (i * 37) % s;
            const y = (i * 53) % s;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(20, 18, 15, 0.14)' : 'rgba(230, 220, 195, 0.07)';
            ctx.fillRect(x, y, 3, 2);
          }

          if (camo) {
            // Muted olive/brown military camo blotches
            const blobs = [
              ['#3a432d', 24, 26, 22, 14], ['#555941', 88, 34, 25, 16],
              ['#2d3324', 56, 78, 28, 15], ['#4d4534', 105, 96, 22, 18],
              ['#3a432d', 18, 102, 24, 15], ['#2d3324', 94, 12, 18, 12]
            ];
            for (const [col, bx, by, rx, ry] of blobs) {
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.ellipse(bx, by, rx, ry, 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          if (stripe) {
            // Woven scarf lines
            ctx.strokeStyle = 'rgba(42, 32, 24, 0.25)';
            ctx.lineWidth = 2;
            for (let y = 6; y < s; y += 12) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(s, y + 3);
              ctx.stroke();
            }
          }

          if (patches) {
            // Hand-drawn stitched square fabric patches matching the reference sheet
            const patchRects = [[18, 22, 26, 24], [76, 68, 28, 26]];
            for (const [px, py, pw, ph] of patchRects) {
              ctx.fillStyle = patchColor;
              ctx.fillRect(px, py, pw, ph);
              ctx.strokeStyle = seamColor;
              ctx.lineWidth = 2;
              ctx.strokeRect(px, py, pw, ph);

              // Stitch tick marks around patch perimeter
              ctx.lineWidth = 1.4;
              for (let x = px + 4; x < px + pw; x += 6) {
                ctx.beginPath();
                ctx.moveTo(x, py - 3); ctx.lineTo(x, py + 3);
                ctx.moveTo(x, py + ph - 3); ctx.lineTo(x, py + ph + 3);
                ctx.stroke();
              }
            }
          }

          // Comic ink fold creases
          ctx.strokeStyle = 'rgba(20, 16, 14, 0.34)';
          ctx.lineWidth = 1.6;
          for (let i = 0; i < 6; i++) {
            const x = 14 + i * 21;
            ctx.beginPath();
            ctx.moveTo(x, 8);
            ctx.quadraticCurveTo(x + (i % 2 ? 6 : -6), 64, x - 2, 118);
            ctx.stroke();
          }
        });
      }

      _initProceduralTextures() {
        // 5 Expressive Comic Faces
        this.textures.faceSoldier = this._createFaceTexture({ skin: '#b99374', stubble: true, dirt: 0.9 });
        this.textures.faceChild = this._createFaceTexture({ skin: '#c49d7e', child: true, dirt: 0.95 });
        this.textures.faceMale = this._createFaceTexture({ skin: '#bc9576', beard: true, dirt: 0.85 });
        this.textures.faceFemale = this._createFaceTexture({ skin: '#c7a285', female: true, dirt: 0.65 });
        this.textures.facePlayer = this._createFaceTexture({ skin: '#c09878', stubble: true, dirt: 0.55 });

        // Ragdoll Stitched Face Texture
        this.textures.faceRagdoll = this._makeCanvasTex(128, (ctx, s) => {
          ctx.fillStyle = '#a89275';
          ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = '#241b16';
          ctx.beginPath(); ctx.arc(52, 62, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(76, 62, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#241b16';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(56, 78); ctx.lineTo(72, 76); ctx.stroke();
          // Tiny stitch lines
          for (let x = 58; x <= 70; x += 4) {
            ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x, 80); ctx.stroke();
          }
        });

        // Gritty Weathered Fabric Textures
        this.textures.soldierCamo = this._createFabricTexture({ base: '#5f674b', camo: true, patches: true, patchColor: '#564e3b' });
        this.textures.helmetCamo = this._createFabricTexture({ base: '#585f46', camo: true, patches: false });
        this.textures.childTunic = this._createFabricTexture({ base: '#8e826f', patches: true, patchColor: '#6d6354' });
        this.textures.maleJacketA = this._createFabricTexture({ base: '#6e634c', patches: true, patchColor: '#554c3b' });
        this.textures.maleJacketB = this._createFabricTexture({ base: '#534d47', patches: true, patchColor: '#3f3a35' });
        this.textures.rippedJeans = this._createFabricTexture({ base: '#535d66', patches: true, patchColor: '#8d7560' });
        this.textures.femaleCoat = this._createFabricTexture({ base: '#5c6055', patches: true, patchColor: '#474a41' });
        this.textures.femaleSkirt = this._createFabricTexture({ base: '#7a6c58', patches: true, patchColor: '#5f5343' });
        this.textures.shawlA = this._createFabricTexture({ base: '#9e886c', patches: false, stripe: true });
        this.textures.shawlB = this._createFabricTexture({ base: '#9b7152', patches: false, stripe: true });
        this.textures.playerJacket = this._createFabricTexture({ base: '#3d5163', patches: true, patchColor: '#2e3e4d' });
        this.textures.backpackCanvas = this._createFabricTexture({ base: '#786c52', patches: false, stripe: true });
      }

      _initSharedMaterials() {
        const std = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.05, ...opts });
        const lamb = (opts) => new THREE.MeshLambertMaterial({ ...opts });

        // Faces & Skin
        this.materials.faceSoldier = lamb({ map: this.textures.faceSoldier });
        this.materials.faceChild = lamb({ map: this.textures.faceChild });
        this.materials.faceMale = lamb({ map: this.textures.faceMale });
        this.materials.faceFemale = lamb({ map: this.textures.faceFemale });
        this.materials.facePlayer = lamb({ map: this.textures.facePlayer });
        this.materials.faceRagdoll = lamb({ map: this.textures.faceRagdoll });

        this.materials.skin = lamb({ color: 0xba9476 });
        this.materials.skinChild = lamb({ color: 0xc29b7d });
        this.materials.hairDark = lamb({ color: 0x3a2b20, flatShading: true });
        this.materials.hairBrown = lamb({ color: 0x4b3828, flatShading: true });

        // Soldier Military Gear
        this.materials.soldierCamo = lamb({ map: this.textures.soldierCamo });
        this.materials.helmet = std({ map: this.textures.helmetCamo, roughness: 0.72, metalness: 0.14 });
        this.materials.backpack = lamb({ map: this.textures.backpackCanvas });
        this.materials.bedroll = lamb({ color: 0x625a45 });
        this.materials.leatherDark = lamb({ color: 0x3a2e25 });
        this.materials.pouchOlive = lamb({ color: 0x5c5742 });
        this.materials.boots = lamb({ color: 0x352920 });
        this.materials.rifleMetal = std({ color: 0x20252c, roughness: 0.5, metalness: 0.55 });
        this.materials.rifleWood = lamb({ color: 0x4f3826 });

        // Refugee Clothing & Props
        this.materials.childTunic = lamb({ map: this.textures.childTunic });
        this.materials.childShorts = lamb({ color: 0x675b49 });
        this.materials.dollDress = lamb({ color: 0x6b727a });
        this.materials.maleJacketA = lamb({ map: this.textures.maleJacketA });
        this.materials.maleJacketB = lamb({ map: this.textures.maleJacketB });
        this.materials.undershirt = lamb({ color: 0x9c8e78 });
        this.materials.rippedJeans = lamb({ map: this.textures.rippedJeans });
        this.materials.satchelLeather = lamb({ color: 0x6e543a });
        this.materials.femaleCoat = lamb({ map: this.textures.femaleCoat });
        this.materials.femaleSkirt = lamb({ map: this.textures.femaleSkirt, side: THREE.DoubleSide });
        this.materials.shawlA = lamb({ map: this.textures.shawlA });
        this.materials.shawlB = lamb({ map: this.textures.shawlB });
        this.materials.headband = lamb({ color: 0x9c8b70 });
        this.materials.bundleCloth = lamb({ color: 0x8c7b63 });

        // Player Scout Distinct Gear
        this.materials.playerJacket = lamb({ map: this.textures.playerJacket });
        this.materials.playerScarf = lamb({ color: 0xc96228 });
        this.materials.playerBeanie = lamb({ color: 0x2a333e });
      }

      /**
       * Creates the shared articulated humanoid rig (hips -> torso -> head, shoulders/elbows, hips/knees).
       */
      _createBaseRig({
        scale = 1.0,
        headScale = 1.0,
        torsoGeom = this.geometries.torsoMale,
        torsoScale = [1.16, 1.0, 0.76],
        faceMat,
        skinMat = this.materials.skin,
        torsoMat,
        sleeveMat,
        pantsMat,
        bootMat = this.materials.boots,
        showBareLegs = false
      }) {
        const root = new THREE.Group();
        root.scale.setScalar(scale);

        // Pelvis / Hips Pivot (height ~0.78 in unscaled human space)
        const hips = new THREE.Group();
        hips.position.y = 0.78;
        root.add(hips);

        const pelvisMesh = new THREE.Mesh(this.geometries.pelvis, pantsMat);
        pelvisMesh.scale.set(1.06, 0.72, 0.78);
        pelvisMesh.castShadow = true;
        hips.add(pelvisMesh);

        // Torso Group
        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = 0.04;
        hips.add(torsoGroup);

        const torsoMesh = new THREE.Mesh(torsoGeom, torsoMat);
        torsoMesh.scale.set(...torsoScale);
        torsoMesh.position.y = 0.27;
        torsoMesh.castShadow = true;
        torsoGroup.add(torsoMesh);

        // Neck + Sculpted Oval Head
        const neck = new THREE.Mesh(this.geometries.neck, skinMat);
        neck.position.y = 0.57;
        torsoGroup.add(neck);

        const headGroup = new THREE.Group();
        headGroup.position.y = 0.74;
        headGroup.scale.setScalar(headScale);
        torsoGroup.add(headGroup);

        // Head Sphere rotated -PI/2 so CanvasTexture u=0.5 faces directly +Z
        const headMesh = new THREE.Mesh(this.geometries.head, faceMat);
        headMesh.scale.set(0.94, 1.08, 0.88);
        headMesh.rotation.y = -Math.PI * 0.5;
        headMesh.castShadow = true;
        headGroup.add(headMesh);

        // Sculpted subtle nose & ears for organic 3D profile silhouette
        const nose = new THREE.Mesh(this.geometries.nose, skinMat);
        nose.position.set(0, -0.012, 0.175);
        nose.rotation.x = Math.PI * 0.42;
        headGroup.add(nose);

        for (const side of [-1, 1]) {
          const ear = new THREE.Mesh(this.geometries.ear, skinMat);
          ear.scale.set(0.55, 1.15, 0.72);
          ear.position.set(side * 0.165, -0.01, -0.01);
          headGroup.add(ear);
        }

        // Articulated Left & Right Arms (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand)
        const armOffsetX = torsoScale[0] * 0.22;
        const makeArm = (side) => {
          const shoulderPivot = new THREE.Group();
          shoulderPivot.position.set(side * armOffsetX, 0.47, 0);
          torsoGroup.add(shoulderPivot);

          const shoulderBall = new THREE.Mesh(this.geometries.shoulder, sleeveMat);
          shoulderPivot.add(shoulderBall);

          const upperArm = new THREE.Mesh(this.geometries.upperArm, sleeveMat);
          upperArm.position.y = -0.14;
          upperArm.castShadow = true;
          shoulderPivot.add(upperArm);

          const elbowPivot = new THREE.Group();
          elbowPivot.position.y = -0.27;
          shoulderPivot.add(elbowPivot);

          const foreArm = new THREE.Mesh(this.geometries.foreArm, showBareLegs ? skinMat : sleeveMat);
          foreArm.position.y = -0.12;
          foreArm.castShadow = true;
          elbowPivot.add(foreArm);

          const hand = new THREE.Mesh(this.geometries.hand, skinMat);
          hand.scale.set(0.86, 1.1, 0.7);
          hand.position.y = -0.255;
          elbowPivot.add(hand);

          return { shoulderPivot, elbowPivot, hand };
        };

        const leftArm = makeArm(-1);
        const rightArm = makeArm(1);

        // Articulated Left & Right Legs (Hip -> Thigh -> Knee -> Calf -> Boot)
        const makeLeg = (side) => {
          const hipPivot = new THREE.Group();
          hipPivot.position.set(side * 0.105, -0.04, 0);
          hips.add(hipPivot);

          const thigh = new THREE.Mesh(this.geometries.thigh, pantsMat);
          thigh.position.y = -0.18;
          thigh.castShadow = true;
          hipPivot.add(thigh);

          const kneePivot = new THREE.Group();
          kneePivot.position.y = -0.36;
          hipPivot.add(kneePivot);

          const calf = new THREE.Mesh(this.geometries.calf, showBareLegs ? skinMat : pantsMat);
          calf.position.y = -0.17;
          calf.castShadow = true;
          kneePivot.add(calf);

          // Combat boot / worn shoe
          const bootAnkle = new THREE.Mesh(this.geometries.bootAnkle, bootMat);
          bootAnkle.position.y = -0.30;
          kneePivot.add(bootAnkle);

          const bootFoot = new THREE.Mesh(this.geometries.bootFoot, bootMat);
          bootFoot.rotation.x = Math.PI * 0.5;
          bootFoot.position.set(0, -0.355, 0.048);
          kneePivot.add(bootFoot);

          return { hipPivot, kneePivot };
        };

        const leftLeg = makeLeg(-1);
        const rightLeg = makeLeg(1);

        return {
          root,
          hips,
          baseHipsY: 0.78,
          torsoGroup,
          headGroup,
          leftArmPivot: leftArm.shoulderPivot,
          rightArmPivot: rightArm.shoulderPivot,
          leftElbowPivot: leftArm.elbowPivot,
          rightElbowPivot: rightArm.elbowPivot,
          leftLegPivot: leftLeg.hipPivot,
          rightLegPivot: rightLeg.hipPivot,
          leftKneePivot: leftLeg.kneePivot,
          rightKneePivot: rightLeg.kneePivot
        };
      }

      /**
       * Adds layered spiky organic hair tufts matching the hand-drawn survivor reference.
       */
      _addMessySpikyHair(headGroup, hairMat, spikyScale = 1.0) {
        const cap = new THREE.Mesh(this.geometries.hairCap, hairMat);
        cap.position.set(0, 0.025, -0.015);
        cap.scale.set(0.95, 1.02, 0.98);
        headGroup.add(cap);

        const tufts = [
          // Crown & back spikes
          [0, 0.21, -0.04, -0.3, 0, 0, 1.15],
          [-0.09, 0.19, -0.02, -0.2, 0, 0.52, 1.05],
          [0.09, 0.19, -0.02, -0.2, 0, -0.52, 1.05],
          [-0.15, 0.12, -0.06, -0.2, 0, 0.95, 0.95],
          [0.15, 0.12, -0.06, -0.2, 0, -0.95, 0.95],
          [0, 0.14, -0.16, -1.0, 0, 0, 1.0],
          [-0.10, 0.07, -0.15, -1.1, 0, 0.45, 0.9],
          [0.10, 0.07, -0.15, -1.1, 0, -0.45, 0.9],
          // Forehead messy bangs
          [-0.07, 0.16, 0.12, 0.75, 0, 0.35, 0.85],
          [0.03, 0.165, 0.13, 0.8, 0, -0.18, 0.9],
          [0.10, 0.15, 0.11, 0.72, 0, -0.42, 0.82]
        ];
        for (const [x, y, z, rx, ry, rz, s] of tufts) {
          const tuft = new THREE.Mesh(this.geometries.hairTuft, hairMat);
          tuft.position.set(x, y, z);
          tuft.rotation.set(rx, ry, rz);
          tuft.scale.setScalar(s * spikyScale);
          headGroup.add(tuft);
        }
      }

      /**
       * Detailed low-poly rifle (stock, receiver, magazine, handguard, barrel).
       */
      _createRifle() {
        const rifle = new THREE.Group();

        const receiver = new THREE.Mesh(this.geometries.boxUnit, this.materials.rifleMetal);
        receiver.scale.set(0.065, 0.095, 0.34);
        rifle.add(receiver);

        const handguard = new THREE.Mesh(this.geometries.boxUnit, this.materials.rifleWood);
        handguard.scale.set(0.058, 0.075, 0.24);
        handguard.position.set(0, 0.0, 0.26);
        rifle.add(handguard);

        const barrel = new THREE.Mesh(this.geometries.cylUnit, this.materials.rifleMetal);
        barrel.rotation.x = Math.PI * 0.5;
        barrel.scale.set(0.036, 0.36, 0.036);
        barrel.position.set(0, 0.018, 0.48);
        rifle.add(barrel);

        const stock = new THREE.Mesh(this.geometries.boxUnit, this.materials.rifleWood);
        stock.scale.set(0.056, 0.115, 0.26);
        stock.position.set(0, -0.025, -0.27);
        stock.rotation.x = 0.08;
        rifle.add(stock);

        const mag = new THREE.Mesh(this.geometries.boxUnit, this.materials.rifleMetal);
        mag.scale.set(0.045, 0.15, 0.068);
        mag.position.set(0, -0.105, 0.08);
        mag.rotation.x = 0.22;
        rifle.add(mag);

        return rifle;
      }

      /**
       * ARCHETYPE A: ARMED SOLDIER / GUARD (Matches left character in reference sheet)
       * Rounded M1 helmet w/ chinstrap, camo uniform, tactical belt & ammo pouches,
       * big backpack + top bedroll, combat boots, and ready rifle.
       */
      createSoldierGuard() {
        const rig = this._createBaseRig({
          scale: 1.03,
          torsoGeom: this.geometries.torsoMale,
          torsoScale: [1.18, 1.02, 0.78],
          faceMat: this.materials.faceSoldier,
          torsoMat: this.materials.soldierCamo,
          sleeveMat: this.materials.soldierCamo,
          pantsMat: this.materials.soldierCamo,
          bootMat: this.materials.boots
        });

        // Rounded M1 Military Helmet + Flared Brim + Chinstrap
        const dome = new THREE.Mesh(this.geometries.helmetDome, this.materials.helmet);
        dome.position.set(0, 0.03, -0.01);
        dome.scale.set(0.98, 1.02, 1.05);
        dome.castShadow = true;
        rig.headGroup.add(dome);

        const brim = new THREE.Mesh(this.geometries.helmetBrim, this.materials.helmet);
        brim.rotation.x = Math.PI * 0.5 + 0.08;
        brim.position.set(0, 0.035, 0.005);
        brim.scale.set(0.98, 1.06, 1.0);
        rig.headGroup.add(brim);

        const strap = new THREE.Mesh(this.geometries.chinStrap, this.materials.leatherDark);
        strap.rotation.z = Math.PI;
        strap.position.set(0, -0.04, 0.04);
        rig.headGroup.add(strap);

        // Tactical Waist Belt + 5 Front/Side Ammo Pouches + Side Holster
        const belt = new THREE.Mesh(this.geometries.belt, this.materials.leatherDark);
        belt.scale.set(1.18, 1.0, 0.92);
        belt.position.y = 0.05;
        rig.torsoGroup.add(belt);

        const pouchAngles = [-0.95, -0.45, 0.45, 0.95, 1.48];
        for (const a of pouchAngles) {
          const pouch = new THREE.Mesh(this.geometries.pouch, this.materials.pouchOlive);
          pouch.position.set(Math.sin(a) * 0.22, 0.045, Math.cos(a) * 0.165);
          pouch.rotation.y = a;
          rig.torsoGroup.add(pouch);
        }

        // Large Olive-Tan Tactical Backpack + Top Rolled Sleeping Mat + Shoulder Straps
        const pack = new THREE.Mesh(this.geometries.packBody, this.materials.backpack);
        pack.scale.set(1.05, 1.08, 0.78);
        pack.position.set(0, 0.30, -0.25);
        pack.castShadow = true;
        rig.torsoGroup.add(pack);

        const bedroll = new THREE.Mesh(this.geometries.bedroll, this.materials.bedroll);
        bedroll.rotation.z = Math.PI * 0.5;
        bedroll.position.set(0, 0.58, -0.23);
        bedroll.castShadow = true;
        rig.torsoGroup.add(bedroll);

        for (const side of [-1, 1]) {
          const strapLoop = new THREE.Mesh(this.geometries.strapBand, this.materials.leatherDark);
          strapLoop.scale.set(0.22, 0.95, 0.68);
          strapLoop.rotation.y = Math.PI * 0.5;
          strapLoop.position.set(side * 0.145, 0.31, -0.02);
          rig.torsoGroup.add(strapLoop);
        }

        // Pose Articulated Arms holding the Rifle naturally across chest
        rig.rightArmPivot.rotation.set(-0.55, 0, 0.12);
        rig.rightElbowPivot.rotation.set(-0.85, -0.3, 0);
        rig.leftArmPivot.rotation.set(-0.68, 0, -0.25);
        rig.leftElbowPivot.rotation.set(-0.78, 0.42, 0);

        const rifle = this._createRifle();
        rifle.position.set(-0.14, -0.22, 0.15);
        rifle.rotation.set(0.95, -0.62, 0.25);
        rig.rightElbowPivot.add(rifle);

        return rig;
      }

      /**
       * ARCHETYPE B1: CHILD REFUGEE WITH RAGDOLL (2nd character in reference sheet)
       * Shorter child proportions, messy spiky brown hair, oversized tattered patched
       * tunic, torn shorts, and cute stitched ragdoll tucked under right arm.
       */
      createChildRefugee() {
        const rig = this._createBaseRig({
          scale: 0.64,
          headScale: 1.22,
          torsoGeom: this.geometries.torsoChild,
          torsoScale: [1.12, 1.16, 0.85],
          faceMat: this.materials.faceChild,
          skinMat: this.materials.skinChild,
          torsoMat: this.materials.childTunic,
          sleeveMat: this.materials.childTunic,
          pantsMat: this.materials.childShorts,
          bootMat: this.materials.boots,
          showBareLegs: true
        });

        this._addMessySpikyHair(rig.headGroup, this.materials.hairBrown, 1.18);

        // Cute Low-Poly Ragdoll tucked warmly under the Child's Right Arm
        const doll = new THREE.Group();
        const dHead = new THREE.Mesh(this.geometries.dollHead, this.materials.faceRagdoll);
        dHead.rotation.y = -Math.PI * 0.5;
        dHead.position.y = 0.21;
        doll.add(dHead);

        const dDress = new THREE.Mesh(this.geometries.dollDress, this.materials.dollDress);
        dDress.position.y = 0.05;
        doll.add(dDress);

        for (const s of [-1, 1]) {
          const dArm = new THREE.Mesh(this.geometries.dollLimb, this.materials.faceRagdoll);
          dArm.position.set(s * 0.08, 0.11, 0.01);
          dArm.rotation.z = s * 0.65;
          doll.add(dArm);

          const dLeg = new THREE.Mesh(this.geometries.dollLimb, this.materials.faceRagdoll);
          dLeg.position.set(s * 0.036, -0.09, 0);
          doll.add(dLeg);
        }

        // Attach ragdoll securely cradled against child's right side/chest
        doll.position.set(0.18, 0.26, 0.20);
        doll.rotation.set(0.18, -0.25, -0.22);
        rig.torsoGroup.add(doll);
        rig.isChild = true;

        return rig;
      }

      /**
       * ARCHETYPE B2: MALE ADULT REFUGEE (3rd character in reference sheet)
       * Tall proportions, messy spiky dark hair, bearded face, layered open weathered
       * jacket over beige shirt, crossbody messenger satchel bag, ripped jeans.
       */
      createMaleRefugee(variant = 0) {
        const jacketMat = variant === 0 ? this.materials.maleJacketA : this.materials.maleJacketB;
        const rig = this._createBaseRig({
          scale: 1.04,
          torsoGeom: this.geometries.torsoMale,
          torsoScale: [1.14, 1.02, 0.76],
          faceMat: this.materials.faceMale,
          torsoMat: jacketMat,
          sleeveMat: jacketMat,
          pantsMat: this.materials.rippedJeans,
          bootMat: this.materials.boots
        });

        this._addMessySpikyHair(rig.headGroup, this.materials.hairDark, 1.04);

        // Exposed worn beige undershirt down chest center (open jacket look)
        const shirtStrip = new THREE.Mesh(this.geometries.torsoMale, this.materials.undershirt);
        shirtStrip.scale.set(0.46, 0.96, 0.80);
        shirtStrip.position.set(0, 0.27, 0.032);
        rig.torsoGroup.add(shirtStrip);

        // Crossbody leather strap + Messenger Satchel Bag at left hip
        const crossStrap = new THREE.Mesh(this.geometries.strapBand, this.materials.leatherDark);
        crossStrap.scale.set(0.95, 1.25, 0.62);
        crossStrap.rotation.z = 0.58;
        crossStrap.position.set(0.0, 0.28, 0.01);
        rig.torsoGroup.add(crossStrap);

        const satchel = new THREE.Mesh(this.geometries.satchel, this.materials.satchelLeather);
        satchel.scale.set(0.72, 1.12, 1.15);
        satchel.position.set(-0.26, -0.02, -0.02);
        satchel.rotation.z = 0.14;
        satchel.castShadow = true;
        rig.torsoGroup.add(satchel);

        return rig;
      }

      /**
       * ARCHETYPE B3: FEMALE ADULT REFUGEE (4th character in reference sheet)
       * Slender proportions, low messy hair bun, beige cloth headband, draped weathered
       * tan/ochre shawl, open coat over flared LatheGeometry tattered skirt & cloth bundle.
       */
      createFemaleRefugee(variant = 0) {
        const shawlMat = variant === 0 ? this.materials.shawlA : this.materials.shawlB;
        const rig = this._createBaseRig({
          scale: 0.94,
          torsoGeom: this.geometries.torsoFemale,
          torsoScale: [1.08, 1.0, 0.72],
          faceMat: this.materials.faceFemale,
          torsoMat: this.materials.femaleCoat,
          sleeveMat: this.materials.femaleCoat,
          pantsMat: this.materials.femaleSkirt,
          bootMat: this.materials.boots
        });

        // Hair cap + messy low bun at back + stray bangs
        const hairCap = new THREE.Mesh(this.geometries.hairCap, this.materials.hairDark);
        hairCap.position.set(0, 0.02, -0.015);
        hairCap.scale.set(0.96, 1.03, 0.99);
        rig.headGroup.add(hairCap);

        const bun = new THREE.Mesh(this.geometries.hairBun, this.materials.hairDark);
        bun.position.set(0.02, -0.03, -0.21);
        bun.scale.set(1.05, 0.92, 0.95);
        rig.headGroup.add(bun);

        for (const side of [-1, 1]) {
          const strand = new THREE.Mesh(this.geometries.hairTuft, this.materials.hairDark);
          strand.position.set(side * 0.13, 0.04, 0.12);
          strand.rotation.set(0.45, 0, side * 0.25);
          strand.scale.set(0.55, 0.9, 0.55);
          rig.headGroup.add(strand);
        }

        // Weathered Beige Cloth Headband / Bandana wrapped around forehead
        const headband = new THREE.Mesh(this.geometries.headband, this.materials.headband);
        headband.rotation.x = Math.PI * 0.5 - 0.26;
        headband.position.set(0, 0.075, 0.005);
        headband.scale.set(0.98, 1.02, 1.15);
        rig.headGroup.add(headband);

        // Draped Weathered Tan/Ochre Scarf / Shawl around shoulders
        const shawlNeck = new THREE.Mesh(this.geometries.shawlWrap, shawlMat);
        shawlNeck.rotation.x = Math.PI * 0.5 + 0.12;
        shawlNeck.position.set(0, 0.49, 0.01);
        shawlNeck.scale.set(1.18, 0.95, 1.1);
        shawlNeck.castShadow = true;
        rig.torsoGroup.add(shawlNeck);

        const shawlFront = new THREE.Mesh(this.geometries.shawlFlap, shawlMat);
        shawlFront.rotation.x = Math.PI;
        shawlFront.scale.set(1.15, 0.85, 0.48);
        shawlFront.position.set(0, 0.35, 0.135);
        rig.torsoGroup.add(shawlFront);

        // Waist cloth sash + Flared LatheGeometry Tattered Skirt
        const sash = new THREE.Mesh(this.geometries.belt, this.materials.leatherDark);
        sash.scale.set(0.98, 1.25, 0.85);
        sash.position.y = 0.04;
        rig.torsoGroup.add(sash);

        const skirt = new THREE.Mesh(this.geometries.skirt, this.materials.femaleSkirt);
        skirt.position.set(0, -0.58, 0.01);
        skirt.castShadow = true;
        rig.hips.add(skirt);
        rig.skirtMesh = skirt;

        // Knotted Cloth Bundle Sling carried at left side
        const bundle = new THREE.Mesh(this.geometries.bundleBag, this.materials.bundleCloth);
        bundle.scale.set(0.85, 1.05, 1.12);
        bundle.position.set(-0.24, 0.08, 0.06);
        bundle.castShadow = true;
        rig.torsoGroup.add(bundle);

        return rig;
      }

      /**
       * ARCHETYPE C: PLAYABLE SURVIVOR SCOUT (Upgraded organic Player Character)
       * Stylized survivor scout with knit beanie/hair, dark weathered jacket, warm rust
       * scarf for night readability, survival pack w/ bedroll, and articulated stride.
       */
      createPlayerScout() {
        const rig = this._createBaseRig({
          scale: 1.0,
          torsoGeom: this.geometries.torsoMale,
          torsoScale: [1.14, 1.0, 0.76],
          faceMat: this.materials.facePlayer,
          torsoMat: this.materials.playerJacket,
          sleeveMat: this.materials.playerJacket,
          pantsMat: this.materials.rippedJeans,
          bootMat: this.materials.boots
        });

        // Messy front tufts + Dark Knit Beanie
        this._addMessySpikyHair(rig.headGroup, this.materials.hairDark, 0.72);
        const beanie = new THREE.Mesh(this.geometries.hairCap, this.materials.playerBeanie);
        beanie.position.set(0, 0.04, -0.02);
        beanie.scale.set(1.03, 1.12, 1.06);
        rig.headGroup.add(beanie);

        // Warm Rust Survivor Scarf around neck
        const scarf = new THREE.Mesh(this.geometries.shawlWrap, this.materials.playerScarf);
        scarf.rotation.x = Math.PI * 0.5;
        scarf.position.set(0, 0.52, 0.01);
        scarf.scale.set(0.95, 0.85, 0.85);
        rig.torsoGroup.add(scarf);

        // Tactical Scout Backpack + Compact Bedroll
        const pack = new THREE.Mesh(this.geometries.packBody, this.materials.backpack);
        pack.scale.set(0.88, 0.92, 0.65);
        pack.position.set(0, 0.30, -0.22);
        pack.castShadow = true;
        rig.torsoGroup.add(pack);

        const bedroll = new THREE.Mesh(this.geometries.bedroll, this.materials.bedroll);
        bedroll.rotation.z = Math.PI * 0.5;
        bedroll.scale.setScalar(0.8);
        bedroll.position.set(0, 0.53, -0.20);
        rig.torsoGroup.add(bedroll);

        return rig;
      }

      dispose() {
        Object.values(this.geometries).forEach((g) => g.dispose());
        Object.values(this.textures).forEach((t) => t.dispose());
        Object.values(this.materials).forEach((m) => m.dispose());
      }
    }

    /**
     * ============================================================================
     * 2. COLLISION SYSTEM
     * Lightweight 2D Circle + OBB (Oriented Bounding Box) collision manager.
     * Resolves player sliding smoothly without blocking gates or portal paths.
     * ============================================================================
     */
    class CollisionSystem {
      constructor(worldBounds = 44) {
        this.circles = [];
        this.obbs = [];
        this.worldBounds = worldBounds;
      }

      addCircle(x, z, r) {
        this.circles.push({ x, z, r });
      }

      addOBB(cx, cz, halfW, halfD, rotY = 0) {
        this.obbs.push({
          cx,
          cz,
          hw: halfW,
          hd: halfD,
          cos: Math.cos(-rotY),
          sin: Math.sin(-rotY),
          cosInv: Math.cos(rotY),
          sinInv: Math.sin(rotY)
        });
      }

      /**
       * Resolves a 2D circle entity (player) against all registered obstacles.
       */
      resolve(pos, radius = 0.48) {
        // Two iterations prevent corner snagging
        for (let iter = 0; iter < 2; iter++) {
          // Resolve against circle colliders
          for (let i = 0; i < this.circles.length; i++) {
            const c = this.circles[i];
            const dx = pos.x - c.x;
            const dz = pos.z - c.z;
            const minDist = radius + c.r;
            const distSq = dx * dx + dz * dz;
            if (distSq < minDist * minDist && distSq > 1e-6) {
              const dist = Math.sqrt(distSq);
              const push = minDist - dist;
              pos.x += (dx / dist) * push;
              pos.z += (dz / dist) * push;
            }
          }

          // Resolve against oriented box colliders
          for (let i = 0; i < this.obbs.length; i++) {
            const b = this.obbs[i];
            const relX = pos.x - b.cx;
            const relZ = pos.z - b.cz;
            // Transform into OBB local coordinates
            const localX = relX * b.cos - relZ * b.sin;
            const localZ = relX * b.sin + relZ * b.cos;

            const clampedX = Math.max(-b.hw, Math.min(b.hw, localX));
            const clampedZ = Math.max(-b.hd, Math.min(b.hd, localZ));

            let dx = localX - clampedX;
            let dz = localZ - clampedZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < radius * radius) {
              let pushLocalX = 0;
              let pushLocalZ = 0;
              if (distSq > 1e-6) {
                const dist = Math.sqrt(distSq);
                const push = radius - dist;
                pushLocalX = (dx / dist) * push;
                pushLocalZ = (dz / dist) * push;
              } else {
                // Inside box center fallback: push along shallowest axis
                const penX = b.hw - Math.abs(localX) + radius;
                const penZ = b.hd - Math.abs(localZ) + radius;
                if (penX < penZ) pushLocalX = localX >= 0 ? penX : -penX;
                else pushLocalZ = localZ >= 0 ? penZ : -penZ;
              }
              // Transform push vector back to world space
              pos.x += pushLocalX * b.cosInv - pushLocalZ * b.sinInv;
              pos.z += pushLocalX * b.sinInv + pushLocalZ * b.cosInv;
            }
          }
        }

        // Clamp within outer playable bounds
        pos.x = Math.max(-this.worldBounds, Math.min(this.worldBounds, pos.x));
        pos.z = Math.max(-this.worldBounds, Math.min(this.worldBounds, pos.z));
      }
    }

    /**
     * ============================================================================
     * 3. OUTPOST LIGHTING & ATMOSPHERE
     * Nighttime zombie-apocalypse mood with an efficient 5-6 light budget.
     * ============================================================================
     */
    class OutpostLighting {
      constructor(scene) {
        this.scene = scene;
        this.scene.background = new THREE.Color(0x101826);
        this.scene.fog = new THREE.FogExp2(0x131d2d, 0.0145);

        // 1. Base Cool Night Hemisphere + Subtle Ambient Fill
        this.hemiLight = new THREE.HemisphereLight(0x3f5c8a, 0x181c24, 1.15);
        this.scene.add(this.hemiLight);

        this.ambientLight = new THREE.AmbientLight(0x1c283d, 0.42);
        this.scene.add(this.ambientLight);

        // 2. Dim Moonlight DirectionalLight (Single 1024x1024 shadow map for 60 FPS)
        this.moonLight = new THREE.DirectionalLight(0x6c8ec4, 1.05);
        this.moonLight.position.set(-18, 32, -16);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 1024;
        this.moonLight.shadow.mapSize.height = 1024;
        this.moonLight.shadow.camera.near = 6;
        this.moonLight.shadow.camera.far = 78;
        const d = 29;
        this.moonLight.shadow.camera.left = -d;
        this.moonLight.shadow.camera.right = d;
        this.moonLight.shadow.camera.top = d;
        this.moonLight.shadow.camera.bottom = -d;
        this.moonLight.shadow.bias = -0.0007;
        this.scene.add(this.moonLight);

        // 3. Campfire Warm Flickering PointLight
        this.campfireLight = new THREE.PointLight(0xff7b24, 34, 17, 1.55);
        this.campfireLight.position.set(-7.2, 1.55, 0.4);
        this.scene.add(this.campfireLight);

        // 4. Watchtower Spotlight + Lightweight Volumetric Cone Mesh
        this.spotLight = new THREE.SpotLight(0xffe6a3, 62, 30, Math.PI / 5.4, 0.48, 1.3);
        this.spotLight.position.set(2.3, 7.6, -9.6);
        this.spotTarget = new THREE.Object3D();
        this.spotTarget.position.set(-4.6, 0.0, -4.4);
        this.scene.add(this.spotTarget);
        this.spotLight.target = this.spotTarget;
        this.scene.add(this.spotLight);

        // Lightweight Additive Volumetric Light Cone
        this.volumetricCone = this._createVolumetricBeam();
        this.scene.add(this.volumetricCone);

        // 5. Main Gate Warm Work-Lamp PointLight
        this.gateLight = new THREE.PointLight(0xffb86c, 18, 13, 1.45);
        this.gateLight.position.set(7.3, 3.6, 10.1);
        this.scene.add(this.gateLight);

        // 6. Purple Teleportation Portal PointLight
        this.portalLight = new THREE.PointLight(0xb84dff, 44, 19, 1.42);
        this.portalLight.position.set(18.6, 1.9, -4.5);
        this.scene.add(this.portalLight);
      }

      _createVolumetricBeam() {
        const start = new THREE.Vector3(2.3, 7.6, -9.6);
        const end = new THREE.Vector3(-4.2, 0.4, -4.6);
        const dist = start.distanceTo(end);

        // Cone pointing from apex (0,0,0) along +Z after geometry alignment
        const geom = new THREE.ConeGeometry(3.2, dist, 14, 1, true);
        geom.translate(0, -dist * 0.5, 0);
        geom.rotateX(-Math.PI * 0.5);

        const mat = new THREE.MeshBasicMaterial({
          color: 0xffeba8,
          transparent: true,
          opacity: 0.095,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(start);
        mesh.lookAt(end);
        return mesh;
      }

      update(time, portalPulse = 0) {
        // Organic warm campfire flicker
        const flicker =
          Math.sin(time * 9.5) * 2.2 +
          Math.sin(time * 17.3) * 1.4 +
          Math.cos(time * 5.2) * 1.2;
        this.campfireLight.intensity = 33 + flicker;

        // Subtle purple portal pulse + interactive boost
        this.portalLight.intensity = 42 + Math.sin(time * 3.1) * 4.5 + portalPulse * 38;
      }
    }

    /**
     * ============================================================================
     * 4. DEFENSIVE WALLS & MAIN GATE
     * InstancedMesh corrugated panels, posts, barbed wire, sandbags & gate gantry.
     * ============================================================================
     */
    class DefensiveWalls {
      constructor(scene, assets, collisions) {
        this.group = new THREE.Group();
        this.assets = assets;
        this.collisions = collisions;

        // Perimeter polylines matching reference composition:
        // Group A: Left of Main Gate -> Left -> Back -> Behind WatchTower -> Stops at right portal breach
        const wallArcA = [
          [4.1, 11.4],
          [-1.5, 12.6],
          [-8.5, 11.8],
          [-14.8, 9.2],
          [-19.2, 4.0],
          [-19.8, -2.2],
          [-16.5, -8.2],
          [-10.2, -12.0],
          [-2.5, -13.4],
          [5.2, -13.2],
          [11.8, -9.2]
        ];

        // Group B: Right of Main Gate -> Curves out below the Portal Road
        const wallArcB = [
          [10.3, 8.8],
          [15.6, 5.2],
          [21.2, 1.4],
          [25.2, -1.2]
        ];

        this._buildInstancedWalls([wallArcA, wallArcB]);
        this._buildMainGate();
        this._buildGateSandbagsAndDrums();

        scene.add(this.group);
      }

      _buildInstancedWalls(polylines) {
        const panelMatrices = [];
        const panelColors = [];
        const postMatrices = [];
        const coilMatrices = [];
        const dummy = new THREE.Object3D();
        const colorVar = new THREE.Color();

        const panelWidth = 1.65;

        for (const pts of polylines) {
          for (let i = 0; i < pts.length - 1; i++) {
            const [x1, z1] = pts[i];
            const [x2, z2] = pts[i + 1];
            const dx = x2 - x1;
            const dz = z2 - z1;
            const segLen = Math.hypot(dx, dz);
            const angle = Math.atan2(dx, dz); // Wall runs along local Z; wait: let's orient panel width along X!
            const rotY = Math.atan2(-dz, dx);

            // Register single clean OBB collider per straight fence section
            this.collisions.addOBB((x1 + x2) * 0.5, (z1 + z2) * 0.5, segLen * 0.5, 0.34, rotY);

            const count = Math.max(1, Math.round(segLen / panelWidth));
            const actualW = segLen / count;

            for (let j = 0; j < count; j++) {
              const t = (j + 0.5) / count;
              const px = x1 + dx * t;
              const pz = z1 + dz * t;

              // Corrugated metal sheet panel
              dummy.position.set(px, 1.18, pz);
              dummy.rotation.set(0, rotY, 0);
              dummy.scale.set(actualW * 0.98, 1.0 + ((i + j) % 2) * 0.04, 1);
              dummy.updateMatrix();
              panelMatrices.push(dummy.matrix.clone());

              // Subtle metallic weathering color variation
              const shade = 0.85 + ((i * 7 + j * 13) % 5) * 0.06;
              colorVar.setRGB(0.38 * shade, 0.45 * shade, 0.54 * shade);
              panelColors.push(colorVar.clone());

              // Barbed wire coils along top edge (2 coils per panel)
              for (let c = 0; c < 2; c++) {
                const ct = (j + (c + 0.5) * 0.5) / count;
                dummy.position.set(x1 + dx * ct, 2.52, z1 + dz * ct);
                dummy.rotation.set(0.35, rotY + c * 0.5, 0.25);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                coilMatrices.push(dummy.matrix.clone());
              }
            }

            // Wooden/steel vertical posts at segment joints & midpoints
            const postSteps = Math.max(2, Math.round(segLen / 3.2));
            for (let p = 0; p <= postSteps; p++) {
              const pt = p / postSteps;
              dummy.position.set(x1 + dx * pt, 1.38, z1 + dz * pt);
              dummy.rotation.set(0, rotY, 0);
              dummy.scale.set(1, 1, 1);
              dummy.updateMatrix();
              postMatrices.push(dummy.matrix.clone());
            }
          }
        }

        // InstancedMesh: Corrugated Metal Panels
        const panelInst = new THREE.InstancedMesh(
          this.assets.geometries.fencePanel,
          this.assets.materials.corrugatedWall,
          panelMatrices.length
        );
        panelInst.castShadow = true;
        panelInst.receiveShadow = true;
        for (let i = 0; i < panelMatrices.length; i++) {
          panelInst.setMatrixAt(i, panelMatrices[i]);
          panelInst.setColorAt(i, panelColors[i]);
        }
        panelInst.instanceMatrix.needsUpdate = true;
        if (panelInst.instanceColor) panelInst.instanceColor.needsUpdate = true;
        this.group.add(panelInst);

        // InstancedMesh: Fence Posts
        const postInst = new THREE.InstancedMesh(
          this.assets.geometries.fencePost,
          this.assets.materials.fencePost,
          postMatrices.length
        );
        postInst.castShadow = true;
        for (let i = 0; i < postMatrices.length; i++) {
          postInst.setMatrixAt(i, postMatrices[i]);
        }
        postInst.instanceMatrix.needsUpdate = true;
        this.group.add(postInst);

        // InstancedMesh: Barbed Wire Coils
        const coilInst = new THREE.InstancedMesh(
          this.assets.geometries.barbedCoil,
          this.assets.materials.barbedWire,
          coilMatrices.length
        );
        for (let i = 0; i < coilMatrices.length; i++) {
          coilInst.setMatrixAt(i, coilMatrices[i]);
        }
        coilInst.instanceMatrix.needsUpdate = true;
        this.group.add(coilInst);
      }

      /**
       * Builds the Main Gate gantry frame, overhead warm lamps, slightly open doors, and red-white pole.
       */
      _buildMainGate() {
        const gateCenter = new THREE.Vector3(7.2, 0, 10.1);
        const gateAngle = Math.atan2(-(8.8 - 11.4), 10.3 - 4.1); // ~0.40 rad

        const gateGroup = new THREE.Group();
        gateGroup.position.copy(gateCenter);
        gateGroup.rotation.y = gateAngle;

        // Left & Right tall gantry timber posts (spacing ~6.6m so center ~5m stays wide open)
        const postL = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.woodDark);
        postL.scale.set(0.32, 4.3, 0.32);
        postL.position.set(-3.2, 2.15, 0);
        postL.castShadow = true;
        gateGroup.add(postL);

        const postR = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.woodDark);
        postR.scale.set(0.32, 4.3, 0.32);
        postR.position.set(3.2, 2.15, 0);
        postR.castShadow = true;
        gateGroup.add(postR);

        // Overhead crossbar beam
        const beam = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.woodMedium);
        beam.scale.set(6.9, 0.28, 0.34);
        beam.position.set(0, 4.15, 0);
        beam.castShadow = true;
        gateGroup.add(beam);

        // Two overhead work lamp fixtures under crossbar
        for (const lx of [-1.4, 1.4]) {
          const hood = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.metalDark);
          hood.scale.set(0.45, 0.14, 0.32);
          hood.position.set(lx, 3.94, 0.12);
          gateGroup.add(hood);

          const bulb = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.lampWarmEmissive);
          bulb.scale.set(0.36, 0.08, 0.24);
          bulb.position.set(lx, 3.85, 0.12);
          gateGroup.add(bulb);
        }

        // Slightly swung-open corrugated gate leaves on both sides (leaving >4.6m passable center gap)
        const leafL = new THREE.Mesh(this.assets.geometries.fencePanel, this.assets.materials.corrugatedWall);
        leafL.scale.set(1.5, 0.96, 1);
        leafL.position.set(-2.55, 1.12, -0.55);
        leafL.rotation.y = 0.95;
        leafL.castShadow = true;
        gateGroup.add(leafL);

        const leafR = new THREE.Mesh(this.assets.geometries.fencePanel, this.assets.materials.corrugatedWall);
        leafR.scale.set(1.5, 0.96, 1);
        leafR.position.set(2.55, 1.12, -0.55);
        leafR.rotation.y = -0.95;
        leafR.castShadow = true;
        gateGroup.add(leafR);

        // Striped red-white warning barricade bollard near right inner post
        for (let s = 0; s < 4; s++) {
          const seg = new THREE.Mesh(
            this.assets.geometries.unitCyl,
            s % 2 === 0 ? this.assets.materials.stripeRed : this.assets.materials.stripeWhite
          );
          seg.scale.set(0.24, 0.32, 0.24);
          seg.position.set(2.35, 0.16 + s * 0.32, 0.85);
          gateGroup.add(seg);
        }

        this.group.add(gateGroup);

        // Colliders strictly for the left & right gate posts (center stays 100% walkable!)
        this.collisions.addCircle(4.2, 11.4, 0.55);
        this.collisions.addCircle(10.2, 8.8, 0.55);
      }

      /**
       * Builds InstancedMesh sandbag barricades flanking the main gate and nearby oil drums.
       */
      _buildGateSandbagsAndDrums() {
        const bagMatrices = [];
        const dummy = new THREE.Object3D();

        const addSandbagWall = (startX, startZ, endX, endZ, rows = 3) => {
          const dx = endX - startX;
          const dz = endZ - startZ;
          const len = Math.hypot(dx, dz);
          const rotY = Math.atan2(-dz, dx);
          const cols = Math.max(2, Math.round(len / 0.8));

          this.collisions.addOBB((startX + endX) * 0.5, (startZ + endZ) * 0.5, len * 0.5, 0.42, rotY);

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const offset = (r % 2) * 0.32;
              const t = (c + 0.5 + (offset / cols)) / cols;
              if (t > 1.0) continue;
              dummy.position.set(
                startX + dx * t,
                0.14 + r * 0.25,
                startZ + dz * t + (r % 2 === 0 ? 0.03 : -0.03)
              );
              dummy.rotation.set(0, rotY + (r % 2 - 0.5) * 0.08, 0);
              dummy.scale.set(1, 1, 1);
              dummy.updateMatrix();
              bagMatrices.push(dummy.matrix.clone());
            }
          }
        };

        // Left gate barricade wall (outside gate)
        addSandbagWall(2.6, 13.6, 5.7, 12.3, 3);
        // Right gate barricade wall (outside gate)
        addSandbagWall(10.8, 10.2, 13.8, 8.9, 3);
        // Inner guard checkpoint mini-stack
        addSandbagWall(1.4, 12.6, 3.2, 12.4, 2);

        const bagInst = new THREE.InstancedMesh(
          this.assets.geometries.sandbag,
          this.assets.materials.sandbag,
          bagMatrices.length
        );
        bagInst.castShadow = true;
        bagInst.receiveShadow = true;
        bagMatrices.forEach((m, idx) => bagInst.setMatrixAt(idx, m));
        bagInst.instanceMatrix.needsUpdate = true;
        this.group.add(bagInst);

        // Oil drums grouped left of gate sandbags
        const drumPositions = [
          [-0.5, 13.6], [0.45, 13.8], [1.4, 13.7],
          [8.6, 7.6]
        ];
        const drumInst = new THREE.InstancedMesh(
          this.assets.geometries.oilDrum,
          this.assets.materials.oilDrum,
          drumPositions.length
        );
        drumInst.castShadow = true;
        drumPositions.forEach(([x, z], i) => {
          dummy.position.set(x, 0.52, z);
          dummy.rotation.set(0, i * 0.7, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          drumInst.setMatrixAt(i, dummy.matrix);
          this.collisions.addCircle(x, z, 0.48);
        });
        drumInst.instanceMatrix.needsUpdate = true;
        this.group.add(drumInst);
      }
    }

    /**
     * ============================================================================
     * 5. SURVIVOR CAMP
     * Central campfire + animated flames/embers, 4 A-frame tents, wooden benches,
     * stacked crates, oil drums, supply sacks, and survival gear.
     * ============================================================================
     */
    class SurvivorCamp {
      constructor(scene, assets, collisions) {
        this.group = new THREE.Group();
        this.assets = assets;
        this.collisions = collisions;
        this.fireCenter = new THREE.Vector3(-7.2, 0, 0.4);
        this.flames = [];

        this._buildCampfire();
        this._buildTents();
        this._buildBenches();
        this._buildCampProps();

        scene.add(this.group);
      }

      _buildCampfire() {
        const fc = this.fireCenter;
        const fireGroup = new THREE.Group();
        fireGroup.position.copy(fc);

        // Stone ring around fire
        const stoneCount = 10;
        for (let i = 0; i < stoneCount; i++) {
          const a = (i / stoneCount) * Math.PI * 2;
          const stone = new THREE.Mesh(this.assets.geometries.rock, this.assets.materials.stone);
          stone.position.set(Math.cos(a) * 0.85, 0.14, Math.sin(a) * 0.85);
          stone.scale.set(0.85, 0.55, 0.8);
          stone.rotation.y = a;
          fireGroup.add(stone);
        }

        // Glowing ember bed
        const embers = new THREE.Mesh(this.assets.geometries.unitCyl, this.assets.materials.emberBed);
        embers.scale.set(1.25, 0.08, 1.25);
        embers.position.y = 0.05;
        fireGroup.add(embers);

        // Crossed charred firewood logs
        for (let i = 0; i < 4; i++) {
          const log = new THREE.Mesh(this.assets.geometries.unitCyl, this.assets.materials.charredLog);
          log.scale.set(0.18, 1.15, 0.18);
          log.position.y = 0.24;
          log.rotation.z = Math.PI * 0.36;
          log.rotation.y = (i / 4) * Math.PI * 2 + 0.3;
          fireGroup.add(log);
        }

        // 3 Animated Low-Poly Flame Cones
        const flameSpecs = [
          { x: 0, z: 0, s: 1.05, mat: this.assets.materials.flameOuter, phase: 0 },
          { x: 0.14, z: -0.1, s: 0.78, mat: this.assets.materials.flameInner, phase: 2.1 },
          { x: -0.15, z: 0.12, s: 0.72, mat: this.assets.materials.flameOuter, phase: 4.3 }
        ];
        for (const f of flameSpecs) {
          const cone = new THREE.Mesh(this.assets.geometries.flameCone, f.mat);
          cone.position.set(f.x, 0.65 * f.s, f.z);
          cone.scale.setScalar(f.s);
          fireGroup.add(cone);
          this.flames.push({ mesh: cone, baseScale: f.s, phase: f.phase });
        }

        // 14 Lightweight Rising Ember Sparks (THREE.Points)
        this.sparkCount = 14;
        const sparkPos = new Float32Array(this.sparkCount * 3);
        this.sparkData = [];
        for (let i = 0; i < this.sparkCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 0.45;
          const y = Math.random() * 2.4;
          sparkPos[i * 3] = Math.cos(angle) * r;
          sparkPos[i * 3 + 1] = 0.4 + y;
          sparkPos[i * 3 + 2] = Math.sin(angle) * r;
          this.sparkData.push({
            angle,
            r,
            speed: 0.55 + Math.random() * 0.65,
            phase: Math.random() * Math.PI * 2
          });
        }
        const sparkGeom = new THREE.BufferGeometry();
        sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        const sparkMat = new THREE.PointsMaterial({
          color: 0xffaa33,
          size: 0.13,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.sparks = new THREE.Points(sparkGeom, sparkMat);
        fireGroup.add(this.sparks);

        this.group.add(fireGroup);
        this.collisions.addCircle(fc.x, fc.z, 1.3);
      }

      /**
       * Places 4 A-Frame survival tents in a semicircle matching the reference layout.
       */
      _buildTents() {
        const tentLayout = [
          { x: -14.2, z: 0.8, rotY: 1.48, mat: this.assets.materials.tentCanvasOlive },
          { x: -11.4, z: -5.6, rotY: 0.62, mat: this.assets.materials.tentCanvasOlive },
          { x: -4.8, z: -6.5, rotY: -0.18, mat: this.assets.materials.tentCanvasKhaki },
          { x: 0.8, z: -2.2, rotY: -1.12, mat: this.assets.materials.tentCanvasKhaki }
        ];

        for (const t of tentLayout) {
          const tentGroup = new THREE.Group();
          tentGroup.position.set(t.x, 0, t.z);
          tentGroup.rotation.y = t.rotY;

          // Main prism canvas
          const canvas = new THREE.Mesh(this.assets.geometries.tentPrism, t.mat);
          canvas.castShadow = true;
          canvas.receiveShadow = true;
          tentGroup.add(canvas);

          // Dark interior backing triangle so opening has depth
          const interior = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.tentInterior);
          interior.scale.set(1.5, 1.5, 0.25);
          interior.position.set(0, 0.78, 1.4);
          tentGroup.add(interior);

          // Front & back wooden ridge support poles
          for (const pz of [-2.05, 2.05]) {
            const pole = new THREE.Mesh(this.assets.geometries.unitCyl, this.assets.materials.woodDark);
            pole.scale.set(0.09, 2.45, 0.09);
            pole.position.set(0, 1.22, pz);
            tentGroup.add(pole);
          }

          this.group.add(tentGroup);
          // Register OBB collision for each tent
          this.collisions.addOBB(t.x, t.z, 1.78, 2.15, t.rotY);
        }
      }

      /**
       * Places 5 simple wooden benches around the campfire (also stores seating transforms for RefugeeNPCs).
       */
      _buildBenches() {
        this.benchSeats = [
          { x: -9.1, z: -1.65, rotY: 0.72 },
          { x: -5.3, z: -1.75, rotY: -0.68 },
          { x: -4.3, z: 0.85, rotY: -1.65 },
          { x: -7.4, z: 3.15, rotY: 3.05 },
          { x: -10.1, z: 1.05, rotY: 1.72 }
        ];

        for (const b of this.benchSeats) {
          const bench = new THREE.Group();
          bench.position.set(b.x, 0, b.z);
          bench.rotation.y = b.rotY;

          // Plank seat
          const plank = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.woodMedium);
          plank.scale.set(1.55, 0.14, 0.48);
          plank.position.y = 0.46;
          plank.castShadow = true;
          plank.receiveShadow = true;
          bench.add(plank);

          // Support blocks
          for (const lx of [-0.55, 0.55]) {
            const leg = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.woodDark);
            leg.scale.set(0.18, 0.42, 0.42);
            leg.position.set(lx, 0.21, 0);
            bench.add(leg);
          }

          this.group.add(bench);
          this.collisions.addOBB(b.x, b.z, 0.82, 0.34, b.rotY);
        }
      }

      /**
       * Places wooden supply crates, InstancedMesh oil drums, survival sacks, and sandbags inside camp.
       */
      _buildCampProps() {
        const dummy = new THREE.Object3D();

        // Stacked wooden supply crates (matching reference zones)
        const crateSpecs = [
          // Behind Tent 2 & 3
          { x: -8.6, y: 0.45, z: -9.2, s: [1.3, 0.9, 1.0], r: 0.2 },
          { x: -8.5, y: 1.25, z: -9.2, s: [0.95, 0.7, 0.8], r: 0.35 },
          { x: -7.1, y: 0.35, z: -9.3, s: [0.85, 0.7, 0.85], r: -0.1 },
          // Front-left supply stack
          { x: -14.1, y: 0.45, z: 4.8, s: [1.35, 0.9, 1.0], r: 0.4 },
          { x: -14.2, y: 1.22, z: 4.7, s: [0.9, 0.65, 0.8], r: 0.15 },
          { x: -12.8, y: 0.38, z: 5.5, s: [0.95, 0.76, 0.85], r: -0.25 },
          // Right of Tent 4
          { x: 3.4, y: 0.45, z: 0.3, s: [1.25, 0.9, 0.95], r: -0.5 },
          { x: 3.5, y: 1.2, z: 0.25, s: [0.85, 0.62, 0.75], r: -0.3 }
        ];

        for (const c of crateSpecs) {
          const crate = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.woodCrate);
          crate.position.set(c.x, c.y, c.z);
          crate.scale.set(...c.s);
          crate.rotation.y = c.r;
          crate.castShadow = true;
          crate.receiveShadow = true;
          this.group.add(crate);

          // Add ground-level collision once per stack
          if (c.y < 0.7) {
            this.collisions.addOBB(c.x, c.z, c.s[0] * 0.52, c.s[2] * 0.52, c.r);
          }
        }

        // InstancedMesh Camp Oil Drums
        const campDrums = [
          [-11.8, 6.9], [-11.0, 6.4], [-10.9, 7.3],
          [-15.6, -2.8], [-16.3, -2.2],
          [-7.6, -8.2],
          [-1.2, -9.8], [-0.4, -10.3]
        ];
        const drumInst = new THREE.InstancedMesh(
          this.assets.geometries.oilDrum,
          this.assets.materials.oilDrum,
          campDrums.length
        );
        drumInst.castShadow = true;
        campDrums.forEach(([x, z], i) => {
          dummy.position.set(x, 0.52, z);
          dummy.rotation.set(0, i * 0.6, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          drumInst.setMatrixAt(i, dummy.matrix);
          this.collisions.addCircle(x, z, 0.48);
        });
        drumInst.instanceMatrix.needsUpdate = true;
        this.group.add(drumInst);

        // InstancedMesh Camp Sandbag / Food Supply Piles
        const supplyPiles = [
          // Bottom-left sandbag & food ration pile
          [-8.8, 7.6, 0.25], [-8.0, 7.7, 0.15], [-8.4, 7.5, 0.2, 0.28],
          [-9.5, 7.2, 0.4], [-9.2, 7.8, -0.1, 0.28],
          // Next to Tent 4
          [2.1, 1.3, -0.4], [2.7, 1.1, 0.3], [2.4, 1.2, 0.1, 0.28],
          // Behind Tent 3
          [-1.6, -8.6, 0.5], [-0.9, -8.9, -0.2]
        ];
        const sackInst = new THREE.InstancedMesh(
          this.assets.geometries.sandbag,
          this.assets.materials.supplySack,
          supplyPiles.length
        );
        sackInst.castShadow = true;
        supplyPiles.forEach((p, i) => {
          dummy.position.set(p[0], 0.16 + (p[3] || 0), p[1]);
          dummy.rotation.set(0, p[2], 0);
          dummy.scale.set(1.05, 1.2, 1.1);
          dummy.updateMatrix();
          sackInst.setMatrixAt(i, dummy.matrix);
        });
        sackInst.instanceMatrix.needsUpdate = true;
        this.group.add(sackInst);

        // Colliders for main camp supply piles
        this.collisions.addCircle(-8.8, 7.5, 1.15);
        this.collisions.addCircle(2.4, 1.2, 0.8);
      }

      update(time, delta) {
        // Animate low-poly campfire flames
        for (const f of this.flames) {
          const wobble = Math.sin(time * 11 + f.phase) * 0.12 + Math.cos(time * 18 + f.phase) * 0.08;
          f.mesh.scale.set(
            f.baseScale * (1 - wobble * 0.4),
            f.baseScale * (1 + wobble),
            f.baseScale * (1 - wobble * 0.4)
          );
          f.mesh.rotation.y = time * 1.4 + f.phase;
        }

        // Animate lightweight rising ember sparks
        const posAttr = this.sparks.geometry.attributes.position;
        for (let i = 0; i < this.sparkCount; i++) {
          const d = this.sparkData[i];
          let y = posAttr.getY(i) + d.speed * delta;
          if (y > 2.9) {
            y = 0.4;
          }
          const swirl = d.angle + time * 0.9 + d.phase;
          const radius = d.r * (1 + (y - 0.4) * 0.35);
          posAttr.setXYZ(i, Math.cos(swirl) * radius, y, Math.sin(swirl) * radius);
        }
        posAttr.needsUpdate = true;
      }
    }

    /**
     * ============================================================================
     * 6. REFUGEE NPCS
     * 5 stylized organic refugees seated around the campfire (Child w/ Ragdoll,
     * 2 Male Adult variations w/ Satchels, 2 Female Adult variations w/ Shawls,
     * Headbands, Buns & Skirts) with natural bent-knee seating & hand-warming motion.
     * ============================================================================
     */
    class RefugeeNPCs {
      constructor(scene, characterBuilder, benchSeats) {
        this.group = new THREE.Group();
        this.npcs = [];

        // Map the 5 campfire seats cleanly so Male 1, Female 1, and Child (w/ Ragdoll)
        // form the prime hero cluster facing the fire for Inspect Refugees mode.
        const builders = [
          () => characterBuilder.createMaleRefugee(0),   // Seat 0: Back-left (Olive jacket + satchel)
          () => characterBuilder.createFemaleRefugee(0), // Seat 1: Back-right (Tan shawl + headband + bun)
          () => characterBuilder.createChildRefugee(),   // Seat 2: Right of fire (Child hugging ragdoll!)
          () => characterBuilder.createMaleRefugee(1),   // Seat 3: Front (Charcoal jacket + satchel)
          () => characterBuilder.createFemaleRefugee(1)  // Seat 4: Left (Ochre shawl + headband + bun)
        ];

        benchSeats.forEach((seat, idx) => {
          const rig = builders[idx % builders.length]();
          rig.root.position.set(seat.x, 0.0, seat.z);
          rig.root.rotation.y = seat.rotY;

          // Configure natural seated posture on wooden bench (~0.48m seat height)
          const seatedHipsY = rig.isChild ? 0.62 : 0.53;
          rig.hips.position.y = seatedHipsY;
          rig.baseHipsY = seatedHipsY;

          // Bent organic thighs forward & calves downward so boots rest on dirt ground
          rig.leftLegPivot.rotation.x = -1.32;
          rig.rightLegPivot.rotation.x = -1.32;
          rig.leftKneePivot.rotation.x = 1.24;
          rig.rightKneePivot.rotation.x = 1.24;

          // Slight skirt tilt forward when Female Refugee sits
          if (rig.skirtMesh) {
            rig.skirtMesh.rotation.x = -0.35;
            rig.skirtMesh.position.set(0, -0.52, 0.14);
          }

          // Natural warming-hands posture (Child hugs ragdoll with right arm, warms left hand)
          if (rig.isChild) {
            rig.rightArmPivot.rotation.set(-0.55, 0, -0.25);
            rig.rightElbowPivot.rotation.set(-1.15, -0.5, 0);
            rig.leftArmPivot.rotation.set(-0.72, 0, -0.1);
            rig.leftElbowPivot.rotation.set(-0.52, 0.2, 0);
          } else {
            rig.leftArmPivot.rotation.set(-0.75, 0, -0.14);
            rig.leftElbowPivot.rotation.set(-0.55, 0.25, 0);
            rig.rightArmPivot.rotation.set(-0.75, 0, 0.14);
            rig.rightElbowPivot.rotation.set(-0.55, -0.25, 0);
          }

          this.group.add(rig.root);
          this.npcs.push({ ...rig, phase: idx * 1.45 });
        });

        scene.add(this.group);
      }

      update(time) {
        for (let i = 0; i < this.npcs.length; i++) {
          const n = this.npcs[i];
          const t = time * 1.65 + n.phase;

          // Subtle breathing, gentle torso sway & occasional curious head turns
          n.torsoGroup.rotation.x = 0.08 + Math.sin(t * 0.7) * 0.035;
          n.torsoGroup.rotation.z = Math.sin(t * 0.45) * 0.022;
          n.headGroup.rotation.y = Math.sin(t * 0.38) * 0.18;
          n.headGroup.rotation.x = Math.sin(t * 0.55) * 0.05;

          if (n.isChild) {
            // Child gently rocks ragdoll & warms left hand
            n.leftArmPivot.rotation.x = -0.72 + Math.sin(t * 1.4) * 0.07;
            n.rightElbowPivot.rotation.x = -1.15 + Math.sin(t * 0.9) * 0.04;
          } else {
            n.leftArmPivot.rotation.x = -0.75 + Math.sin(t * 1.25) * 0.06;
            n.rightArmPivot.rotation.x = -0.75 + Math.cos(t * 1.25) * 0.06;
          }
        }
      }
    }

    /**
     * ============================================================================
     * 7. WATCHTOWER
     * Tall timber tower with cross-bracing, ladder, elevated platform, roof, and spotlight.
     * ============================================================================
     */
    class WatchTower {
      constructor(scene, assets, collisions) {
        this.group = new THREE.Group();
        this.position = new THREE.Vector3(3.6, 0, -10.8);
        this.group.position.copy(this.position);
        this.group.rotation.y = 0.18;

        const w = 3.1;
        const hw = w * 0.5;
        const deckY = 5.4;
        const roofY = 8.0;

        // 4 Main Vertical Timber Corner Posts (slight inward taper feels authentic)
        const corners = [
          [-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]
        ];
        for (const [cx, cz] of corners) {
          const post = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodDark);
          post.scale.set(0.24, roofY, 0.24);
          post.position.set(cx, roofY * 0.5, cz);
          post.castShadow = true;
          post.receiveShadow = true;
          this.group.add(post);
        }

        // Horizontal Perimeter Girder Beams at mid-level & platform level
        const levels = [2.6, deckY - 0.15];
        for (const ly of levels) {
          const b1 = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodMedium);
          b1.scale.set(w + 0.2, 0.2, 0.16);
          b1.position.set(0, ly, hw);
          this.group.add(b1);

          const b2 = b1.clone();
          b2.position.set(0, ly, -hw);
          this.group.add(b2);

          const b3 = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodMedium);
          b3.scale.set(0.16, 0.2, w + 0.2);
          b3.position.set(hw, ly, 0);
          this.group.add(b3);

          const b4 = b3.clone();
          b4.position.set(-hw, ly, 0);
          this.group.add(b4);
        }

        // Diagonal X-Bracing Struts on 4 sides (2 tiers)
        const tiers = [1.3, 4.0];
        for (const ty of tiers) {
          for (let side = 0; side < 4; side++) {
            const braceGroup = new THREE.Group();
            braceGroup.position.y = ty;
            braceGroup.rotation.y = side * (Math.PI * 0.5);

            const strutA = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodDark);
            strutA.scale.set(3.85, 0.12, 0.1);
            strutA.position.set(0, 0, hw);
            strutA.rotation.z = 0.68;
            braceGroup.add(strutA);

            const strutB = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodDark);
            strutB.scale.set(3.85, 0.12, 0.1);
            strutB.position.set(0, 0, hw);
            strutB.rotation.z = -0.68;
            braceGroup.add(strutB);

            this.group.add(braceGroup);
          }
        }

        // Elevated Guard Platform Floor
        const deck = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodLight);
        deck.scale.set(w + 0.55, 0.22, w + 0.55);
        deck.position.y = deckY;
        deck.castShadow = true;
        deck.receiveShadow = true;
        this.group.add(deck);

        // Waist-High Wooden Parapet Walls around Platform
        const parapetH = 1.05;
        const parapetY = deckY + parapetH * 0.5 + 0.1;
        const pSides = [
          { pos: [0, parapetY, hw + 0.2], scale: [w + 0.55, parapetH, 0.14] },
          { pos: [0, parapetY, -hw - 0.2], scale: [w + 0.55, parapetH, 0.14] },
          { pos: [hw + 0.2, parapetY, 0], scale: [0.14, parapetH, w + 0.55] },
          { pos: [-hw - 0.2, parapetY, 0], scale: [0.14, parapetH, w + 0.55] }
        ];
        for (const ps of pSides) {
          const wall = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodMedium);
          wall.position.set(...ps.pos);
          wall.scale.set(...ps.scale);
          wall.castShadow = true;
          this.group.add(wall);
        }

        // Simple Pitched Timber Roof
        const roof = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodDark);
        roof.scale.set(w + 1.05, 0.18, w + 1.05);
        roof.position.y = roofY + 0.08;
        roof.rotation.z = 0.06;
        roof.castShadow = true;
        this.group.add(roof);

        // Interior Vertical Wooden Ladder reaching platform
        const ladderGroup = new THREE.Group();
        ladderGroup.position.set(-0.65, 0, 0.65);
        ladderGroup.rotation.y = 0.4;
        for (const rx of [-0.26, 0.26]) {
          const rail = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodLight);
          rail.scale.set(0.08, deckY + 0.2, 0.08);
          rail.position.set(rx, deckY * 0.5, 0);
          ladderGroup.add(rail);
        }
        for (let r = 0; r < 11; r++) {
          const rung = new THREE.Mesh(assets.geometries.unitBox, assets.materials.woodLight);
          rung.scale.set(0.56, 0.06, 0.06);
          rung.position.set(0, 0.45 + r * 0.47, 0);
          ladderGroup.add(rung);
        }
        this.group.add(ladderGroup);

        // Mounted Spotlight Housing on Front-Left Corner
        const lampHousing = new THREE.Mesh(assets.geometries.unitCyl, assets.materials.metalDark);
        lampHousing.scale.set(0.36, 0.45, 0.36);
        lampHousing.position.set(-hw - 0.1, roofY - 0.45, hw + 0.1);
        lampHousing.rotation.set(0.75, -0.45, 0.45);
        this.group.add(lampHousing);

        const lampLens = new THREE.Mesh(assets.geometries.unitCyl, assets.materials.lampWarmEmissive);
        lampLens.scale.set(0.3, 0.08, 0.3);
        lampLens.position.set(-hw - 0.22, roofY - 0.55, hw + 0.22);
        lampLens.rotation.set(0.75, -0.45, 0.45);
        this.group.add(lampLens);

        scene.add(this.group);

        // Tower base collision
        collisions.addOBB(this.position.x, this.position.z, 1.85, 1.85, 0.18);
      }
    }

    /**
     * ============================================================================
     * 8. ARMED GUARDS (6 Total)
     * 2 at Main Gate, 1 on WatchTower, 2 patrolling courtyard, 1 watching Portal.
     * Built with sculpted organic Soldier archetype + natural stride knee bends.
     * ============================================================================
     */
    class ArmedGuards {
      constructor(scene, characterBuilder) {
        this.group = new THREE.Group();
        this.guards = [];

        // 1 & 2: Two Guards flanking the Main Gate outside the sandbags
        this._spawnGuard(characterBuilder, { x: 6.4, y: 0, z: 13.6, rotY: 0.35, type: 'stationary' });
        this._spawnGuard(characterBuilder, { x: 13.2, y: 0, z: 10.9, rotY: 0.65, type: 'stationary' });

        // 3: One Guard atop the WatchTower scanning perimeter
        this._spawnGuard(characterBuilder, { x: 3.6, y: 5.52, z: -10.7, rotY: -0.65, type: 'tower' });

        // 4: Patrol Guard A (Patrolling central-right courtyard)
        this._spawnGuard(characterBuilder, {
          x: 4.5, y: 0, z: 3.8, rotY: 0,
          type: 'patrol',
          waypoints: [
            new THREE.Vector3(4.5, 0, 3.8),
            new THREE.Vector3(-0.5, 0, 6.2),
            new THREE.Vector3(1.8, 0, 8.8),
            new THREE.Vector3(6.2, 0, 6.4)
          ],
          speed: 1.55
        });

        // 5: Patrol Guard B (Patrolling watchtower / right inner perimeter)
        this._spawnGuard(characterBuilder, {
          x: 6.8, y: 0, z: -1.5, rotY: 0,
          type: 'patrol',
          waypoints: [
            new THREE.Vector3(6.8, 0, -1.5),
            new THREE.Vector3(5.6, 0, -6.2),
            new THREE.Vector3(1.5, 0, -7.2),
            new THREE.Vector3(4.8, 0, -2.5)
          ],
          speed: 1.45
        });

        // 6: Guard stationed near the right opening watching the Purple Portal
        this._spawnGuard(characterBuilder, { x: 11.4, y: 0, z: -1.4, rotY: 1.25, type: 'stationary' });

        scene.add(this.group);
      }

      _spawnGuard(characterBuilder, cfg) {
        const rig = characterBuilder.createSoldierGuard();
        rig.root.position.set(cfg.x, cfg.y, cfg.z);
        rig.root.rotation.y = cfg.rotY;
        this.group.add(rig.root);

        this.guards.push({
          ...rig,
          type: cfg.type,
          baseRotY: cfg.rotY,
          waypoints: cfg.waypoints || null,
          wpIndex: 0,
          speed: cfg.speed || 1.5,
          phase: this.guards.length * 1.25
        });
      }

      update(time, delta) {
        for (let i = 0; i < this.guards.length; i++) {
          const g = this.guards[i];

          if (g.type === 'patrol' && g.waypoints) {
            const target = g.waypoints[g.wpIndex];
            const pos = g.root.position;
            const dx = target.x - pos.x;
            const dz = target.z - pos.z;
            const dist = Math.hypot(dx, dz);

            if (dist < 0.25) {
              g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
            } else {
              const step = Math.min(dist, g.speed * delta);
              pos.x += (dx / dist) * step;
              pos.z += (dz / dist) * step;

              const targetAngle = Math.atan2(dx, dz);
              let diff = targetAngle - g.root.rotation.y;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              g.root.rotation.y += diff * Math.min(1, delta * 6);
            }

            // Smooth organic hip + knee walk cycle
            const walkPhase = time * 5.8 + g.phase;
            const swing = Math.sin(walkPhase) * 0.44;
            g.leftLegPivot.rotation.x = swing;
            g.rightLegPivot.rotation.x = -swing;
            g.leftKneePivot.rotation.x = Math.max(0, -swing * 0.85);
            g.rightKneePivot.rotation.x = Math.max(0, swing * 0.85);
            g.hips.position.y = g.baseHipsY + Math.abs(Math.cos(walkPhase)) * 0.032;
            g.torsoGroup.rotation.y = swing * 0.1;
          } else if (g.type === 'tower') {
            // Tower lookout slowly sweeps side-to-side
            g.root.rotation.y = g.baseRotY + Math.sin(time * 0.55) * 0.5;
            g.headGroup.rotation.y = Math.sin(time * 0.9) * 0.24;
          } else {
            // Stationary perimeter guard alert head scan & gentle breathing
            g.headGroup.rotation.y = Math.sin(time * 0.75 + g.phase) * 0.24;
            g.torsoGroup.rotation.x = Math.sin(time * 1.9 + g.phase) * 0.018;
            g.hips.position.y = g.baseHipsY + Math.sin(time * 1.9 + g.phase) * 0.009;
          }
        }
      }
    }

    /**
     * ============================================================================
     * 9. TELEPORTATION PORTAL
     * ~2.45m tall vertical oval purple energy rift at the far-right end of the map.
     * Pure optimized Three.js geometry & lightweight 36-particle point cloud.
     * ============================================================================
     */
    class Portal {
      constructor(scene, assets, collisions) {
        this.group = new THREE.Group();
        this.position = new THREE.Vector3(19.6, 0, -4.8);
        this.group.position.copy(this.position);
        // Angled nicely toward camp and reference camera
        this.group.rotation.y = -0.82;

        this.pulseEnergy = 0;

        // Weathered low stone base plinth
        const plinth = new THREE.Mesh(assets.geometries.unitBox, assets.materials.portalFrame);
        plinth.scale.set(2.35, 0.24, 0.85);
        plinth.position.y = 0.12;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        this.group.add(plinth);

        // Vertical Oval Portal Assembly (~2.45m tall, ~1.8m wide)
        this.portalOval = new THREE.Group();
        this.portalOval.position.y = 1.48;
        this.portalOval.scale.set(0.84, 1.18, 1.0); // Creates clean vertical oval proportion
        this.group.add(this.portalOval);

        // Dark weathered outer stone/metal torus frame
        const outerFrame = new THREE.Mesh(
          new THREE.TorusGeometry(1.06, 0.15, 7, 20),
          assets.materials.portalFrame
        );
        outerFrame.castShadow = true;
        this.portalOval.add(outerFrame);

        // Bright white-violet glowing inner rim
        const innerRim = new THREE.Mesh(
          new THREE.TorusGeometry(0.93, 0.055, 6, 20),
          assets.materials.portalRimGlow
        );
        this.portalOval.add(innerRim);

        // Deep violet core membrane
        const coreDisc = new THREE.Mesh(
          new THREE.CircleGeometry(0.92, 18),
          assets.materials.portalCore
        );
        this.portalOval.add(coreDisc);

        // Counter-rotating energy swirl rings (pure geometry, no heavy shaders)
        this.swirlOuter = new THREE.Mesh(
          new THREE.RingGeometry(0.45, 0.91, 14, 1),
          assets.materials.portalSwirlOuter
        );
        this.swirlOuter.position.z = 0.03;
        this.portalOval.add(this.swirlOuter);

        this.swirlInner = new THREE.Mesh(
          new THREE.RingGeometry(0.18, 0.62, 10, 1),
          assets.materials.portalSwirlInner
        );
        this.swirlInner.position.z = -0.03;
        this.portalOval.add(this.swirlInner);

        // Subtle volumetric outer aura ring
        this.auraRing = new THREE.Mesh(
          new THREE.RingGeometry(0.95, 1.38, 18),
          new THREE.MeshBasicMaterial({
            color: 0xb84dff,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        this.portalOval.add(this.auraRing);

        // 36 Lightweight Orbiting & Rising Purple Energy Particles
        this.particleCount = 36;
        const pPositions = new Float32Array(this.particleCount * 3);
        this.pMeta = [];
        for (let i = 0; i < this.particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.8 + Math.random() * 1.15;
          const yOff = Math.random() * 2.8;
          const zOff = (Math.random() - 0.5) * 1.1;
          pPositions[i * 3] = Math.cos(angle) * radius;
          pPositions[i * 3 + 1] = 0.3 + yOff;
          pPositions[i * 3 + 2] = zOff;
          this.pMeta.push({
            angle,
            radius,
            y: 0.3 + yOff,
            zOff,
            speed: 0.6 + Math.random() * 0.9,
            rise: 0.35 + Math.random() * 0.45
          });
        }
        const pGeom = new THREE.BufferGeometry();
        pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0xe38aff,
          size: 0.2,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.particles = new THREE.Points(pGeom, pMat);
        this.group.add(this.particles);

        scene.add(this.group);

        // Plinth collision so player can walk right up to it without clipping through
        collisions.addOBB(this.position.x, this.position.z, 1.15, 0.45, -0.82);
      }

      triggerPulse() {
        this.pulseEnergy = 1.0;
      }

      update(time, delta) {
        if (this.pulseEnergy > 0) {
          this.pulseEnergy = Math.max(0, this.pulseEnergy - delta * 0.65);
        }

        const speedMult = 1 + this.pulseEnergy * 4.5;
        this.swirlOuter.rotation.z += delta * 1.15 * speedMult;
        this.swirlInner.rotation.z -= delta * 1.85 * speedMult;

        // Subtle breathing pulse on aura & swirl scale
        const pulse = 1 + Math.sin(time * 3.4) * 0.045 + this.pulseEnergy * 0.16;
        this.auraRing.scale.setScalar(pulse);
        this.auraRing.material.opacity = 0.22 + Math.sin(time * 3.4) * 0.05 + this.pulseEnergy * 0.25;

        // Update 36 orbiting/floating purple particles
        const pos = this.particles.geometry.attributes.position;
        for (let i = 0; i < this.particleCount; i++) {
          const m = this.pMeta[i];
          m.angle += delta * m.speed * speedMult * 0.65;
          m.y += delta * m.rise * speedMult;
          if (m.y > 3.5) m.y = 0.25;

          const spread = 1 + this.pulseEnergy * 0.35;
          pos.setXYZ(
            i,
            Math.cos(m.angle) * m.radius * 0.85 * spread,
            m.y,
            m.zOff + Math.sin(m.angle) * 0.45 * spread
          );
        }
        pos.needsUpdate = true;
      }
    }

    /**
     * ============================================================================
     * 10. BACKGROUND ENVIRONMENT
     * Ground with procedural dirt/camp/road tones, abandoned ruined buildings,
     * wrecked cars, dead gnarled trees, InstancedMesh grass tufts & rubble rocks.
     * ============================================================================
     */
    class BackgroundEnvironment {
      constructor(scene, assets, collisions) {
        this.group = new THREE.Group();
        this.assets = assets;
        this.collisions = collisions;

        this._buildGround();
        this._buildRuinedBuildings();
        this._buildWreckedCars();
        this._buildDeadTrees();
        this._buildInstancedFoliageAndRocks();

        scene.add(this.group);
      }

      /**
       * Creates a lightweight procedural 256x256 dirt/road ground canvas texture (zero external requests).
       */
      _buildGround() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base dark cool post-apocalyptic earth
        ctx.fillStyle = '#2a3340';
        ctx.fillRect(0, 0, 256, 256);

        // Subtle noise speckles
        for (let i = 0; i < 1800; i++) {
          const x = Math.random() * 256;
          const y = Math.random() * 256;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(20, 26, 35, 0.28)' : 'rgba(95, 92, 84, 0.16)';
          ctx.fillRect(x, y, 2, 2);
        }

        // Helper mapping world (x, z) in [-64, 64] -> canvas [0, 256]
        const toUV = (wx, wz) => [((wx + 64) / 128) * 256, ((wz + 64) / 128) * 256];

        // Dusty compound interior dirt patch
        const [cx, cz] = toUV(-5, 0);
        const campGrad = ctx.createRadialGradient(cx, cz, 4, cx, cz, 38);
        campGrad.addColorStop(0, 'rgba(105, 92, 76, 0.72)');
        campGrad.addColorStop(0.65, 'rgba(84, 78, 70, 0.48)');
        campGrad.addColorStop(1, 'rgba(42, 51, 64, 0)');
        ctx.fillStyle = campGrad;
        ctx.beginPath();
        ctx.arc(cx, cz, 38, 0, Math.PI * 2);
        ctx.fill();

        // Dirt road through Main Gate out toward bottom-right
        ctx.strokeStyle = 'rgba(106, 94, 80, 0.55)';
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const [r1x, r1z] = toUV(2, 4);
        const [r2x, r2z] = toUV(8, 11);
        const [r3x, r3z] = toUV(22, 28);
        ctx.moveTo(r1x, r1z);
        ctx.quadraticCurveTo(r2x, r2z, r3x, r3z);
        ctx.stroke();

        // Branch dirt path heading out right to Purple Portal
        ctx.lineWidth = 8.5;
        ctx.beginPath();
        const [p1x, p1z] = toUV(5, 2);
        const [p2x, p2z] = toUV(14, -2);
        const [p3x, p3z] = toUV(21, -5);
        ctx.moveTo(p1x, p1z);
        ctx.quadraticCurveTo(p2x, p2z, p3x, p3z);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const groundMat = new THREE.MeshLambertMaterial({ map: tex });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(128, 128), groundMat);
        ground.rotation.x = -Math.PI * 0.5;
        ground.receiveShadow = true;
        this.group.add(ground);
      }

      /**
       * Builds 5 abandoned ruined city buildings around the perimeter background.
       */
      _buildRuinedBuildings() {
        const ruins = [
          // Top-left tall ruin
          { x: -16, z: -25, w: 7.5, h: 12.5, d: 6.5, rotY: 0.12, floors: 4, damagedRight: false },
          // Top-right broken ruin behind watchtower
          { x: 13.5, z: -23.5, w: 8.5, h: 10.5, d: 6.8, rotY: -0.22, floors: 3, damagedRight: true },
          // Bottom-left ruin framing foreground left
          { x: -25.5, z: 18.5, w: 8.0, h: 9.5, d: 7.2, rotY: 0.25, floors: 3, damagedRight: false },
          // Far-left background ruin
          { x: -31, z: -12, w: 7.0, h: 10.0, d: 7.0, rotY: 0.08, floors: 3, damagedRight: true },
          // Far-right background ruin behind portal
          { x: 31, z: -15, w: 7.8, h: 9.0, d: 6.4, rotY: -0.35, floors: 3, damagedRight: false }
        ];

        for (const r of ruins) {
          const bldg = new THREE.Group();
          bldg.position.set(r.x, 0, r.z);
          bldg.rotation.y = r.rotY;

          // Main concrete structure
          const main = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.ruinConcrete);
          main.scale.set(r.w, r.h, r.d);
          main.position.y = r.h * 0.5;
          main.castShadow = true;
          main.receiveShadow = true;
          bldg.add(main);

          // Stepped broken roof chunks (simulating collapsed concrete upper corner)
          const cap = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.ruinConcreteDark);
          cap.scale.set(r.w * 0.58, 1.4, r.d * 0.62);
          cap.position.set(r.damagedRight ? -r.w * 0.18 : r.w * 0.16, r.h + 0.55, -r.d * 0.12);
          bldg.add(cap);

          // Recessed dark windows on front & side facades
          for (let f = 0; f < r.floors; f++) {
            const wy = 2.0 + f * 2.6;
            if (wy > r.h - 1.2) continue;
            for (const wx of [-r.w * 0.26, 0, r.w * 0.26]) {
              const winF = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.ruinWindow);
              winF.scale.set(1.15, 1.45, 0.16);
              winF.position.set(wx, wy, r.d * 0.5 + 0.02);
              bldg.add(winF);
            }
            for (const wz of [-r.d * 0.24, r.d * 0.24]) {
              const winS = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.ruinWindow);
              winS.scale.set(0.16, 1.45, 1.15);
              winS.position.set(r.w * 0.5 + 0.02, wy, wz);
              bldg.add(winS);
            }
          }

          // Base rubble debris slab
          const rubble = new THREE.Mesh(this.assets.geometries.unitBox, this.assets.materials.ruinConcreteDark);
          rubble.scale.set(r.w * 0.65, 0.55, 2.1);
          rubble.position.set(r.w * 0.1, 0.26, r.d * 0.5 + 0.8);
          rubble.rotation.y = 0.2;
          bldg.add(rubble);

          this.group.add(bldg);
          this.collisions.addOBB(r.x, r.z, r.w * 0.52, r.d * 0.52, r.rotY);
        }
      }

      /**
       * Places 6 abandoned wrecked low-poly cars matching the reference composition.
       */
      _buildWreckedCars() {
        const cars = [
          // Right side near Watchtower & Portal approach
          { x: 9.8, z: -4.6, rotY: 0.62, tiltZ: 0.04, c: 0 },
          // Inside front wall
          { x: -4.8, z: 9.6, rotY: 1.48, tiltZ: -0.03, c: 1 },
          // Outside front-left wall
          { x: -10.8, z: 14.6, rotY: 1.12, tiltZ: 0.05, c: 2 },
          // Bottom-right outside gate road
          { x: 18.8, z: 12.8, rotY: -0.68, tiltZ: -0.02, c: 1 },
          // Left perimeter outside wall
          { x: -23.5, z: 7.8, rotY: -0.58, tiltZ: 0.04, c: 0 },
          // Back-left outside wall
          { x: -23.0, z: -7.5, rotY: 0.78, tiltZ: -0.05, c: 3 }
        ];

        for (const spec of cars) {
          const car = this.assets.createWreckedCar(spec.c);
          car.position.set(spec.x, -0.04, spec.z);
          car.rotation.y = spec.rotY;
          car.rotation.z = spec.tiltZ;
          this.group.add(car);
          this.collisions.addOBB(spec.x, spec.z, 1.05, 2.12, spec.rotY);
        }
      }

      /**
       * Places 7 low-poly dead gnarled trees around the outskirts and ruins.
       */
      _buildDeadTrees() {
        const treePositions = [
          { x: -19.5, z: -15.5, s: 1.15, r: 0.4 },
          { x: -5.5, z: -19.5, s: 1.25, r: 1.2 },
          { x: 13.8, z: -13.2, s: 1.1, r: 2.3 },
          { x: -18.5, z: 17.5, s: 1.05, r: 0.9 },
          { x: 23.2, z: 5.5, s: 1.1, r: 3.1 },
          { x: -25.8, z: -1.5, s: 0.95, r: 1.8 },
          { x: 26.5, z: -9.5, s: 1.0, r: 0.2 }
        ];

        for (const tp of treePositions) {
          const tree = new THREE.Group();
          tree.position.set(tp.x, 0, tp.z);
          tree.rotation.y = tp.r;
          tree.scale.setScalar(tp.s);

          // Main tapered trunk
          const trunk = new THREE.Mesh(this.assets.geometries.unitCyl, this.assets.materials.deadTree);
          trunk.scale.set(0.45, 3.6, 0.45);
          trunk.position.y = 1.8;
          trunk.rotation.z = 0.06;
          trunk.castShadow = true;
          tree.add(trunk);

          // 4 Gnarled bare branches
          const branches = [
            { y: 2.5, ry: 0.2, rz: 0.65, len: 2.2, w: 0.2 },
            { y: 2.9, ry: 2.2, rz: 0.58, len: 2.0, w: 0.18 },
            { y: 3.3, ry: 4.1, rz: 0.72, len: 1.8, w: 0.16 },
            { y: 3.6, ry: 5.4, rz: 0.42, len: 1.5, w: 0.13 }
          ];
          for (const b of branches) {
            const br = new THREE.Mesh(this.assets.geometries.unitCyl, this.assets.materials.deadTree);
            br.scale.set(b.w, b.len, b.w);
            br.position.set(
              Math.cos(b.ry) * 0.45,
              b.y + Math.cos(b.rz) * b.len * 0.3,
              Math.sin(b.ry) * 0.45
            );
            br.rotation.y = -b.ry;
            br.rotation.z = -b.rz;
            tree.add(br);
          }

          this.group.add(tree);
          this.collisions.addCircle(tp.x, tp.z, 0.48 * tp.s);
        }
      }

      /**
       * Scatters InstancedMesh wild grass tufts & rocks/rubble chunks with zero draw-call bloat.
       */
      _buildInstancedFoliageAndRocks() {
        const dummy = new THREE.Object3D();

        // Deterministic pseudo-random helper for consistent, clean layout
        let seed = 4217;
        const rand = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };

        // 130 Wild Grass Tufts placed primarily outside the compound & along road edges
        const grassCount = 130;
        const grassInst = new THREE.InstancedMesh(
          this.assets.geometries.grassTuft,
          this.assets.materials.grass,
          grassCount
        );
        let placed = 0;
        while (placed < grassCount) {
          const x = (rand() - 0.5) * 66;
          const z = (rand() - 0.5) * 56;
          // Keep dense center of survivor camp and main road mostly clear
          const distCamp = Math.hypot(x + 6, z);
          const onGateRoad = x > 4 && x < 16 && z > 7 && z < 20;
          if (distCamp < 14.5 || onGateRoad) continue;

          const s = 0.75 + rand() * 0.95;
          dummy.position.set(x, 0, z);
          dummy.rotation.set(0, rand() * Math.PI * 2, 0);
          dummy.scale.set(s, s * (0.8 + rand() * 0.5), s);
          dummy.updateMatrix();
          grassInst.setMatrixAt(placed, dummy.matrix);
          placed++;
        }
        grassInst.instanceMatrix.needsUpdate = true;
        this.group.add(grassInst);

        // 110 Scattered Rocks, Pebbles & Ruin Rubble Chunks
        const rockCount = 110;
        const rockInst = new THREE.InstancedMesh(
          this.assets.geometries.rock,
          this.assets.materials.rock,
          rockCount
        );
        for (let i = 0; i < rockCount; i++) {
          let x, z, scale;
          if (i < 42) {
            // Small pebbles scattered inside the dusty camp yard & near portal
            x = -12 + rand() * 34;
            z = -8 + rand() * 18;
            scale = 0.25 + rand() * 0.32;
          } else {
            // Larger rubble chunks outside walls and around ruined buildings
            x = (rand() - 0.5) * 62;
            z = (rand() - 0.5) * 52;
            scale = 0.45 + rand() * 0.95;
          }
          dummy.position.set(x, scale * 0.18, z);
          dummy.rotation.set(rand() * 2, rand() * 3, rand() * 2);
          dummy.scale.set(scale * 1.2, scale * 0.65, scale);
          dummy.updateMatrix();
          rockInst.setMatrixAt(i, dummy.matrix);
        }
        rockInst.instanceMatrix.needsUpdate = true;
        this.group.add(rockInst);
      }
    }

    /**
     * ============================================================================
     * 11. PLAYER CONTROLLER
     * Playable organic survivor scout with camera-relative WASD/Arrow + Touch
     * movement, Sprint, smooth turning, articulated knee/elbow stride, and collisions.
     * ============================================================================
     */


// ============================================================================
// ZOMBIE OUTPOST WORLD ORCHESTRATOR
// ============================================================================
export class ZombieOutpostWorld {
  constructor(scene) {
    this.scene = scene;
    this.assets = new AssetLibrary();
    this.characterBuilder = new CharacterBuilder();
    this.collisions = new CollisionSystem(40);
    this.lighting = new OutpostLighting(this.scene);

    this.walls = new DefensiveWalls(this.scene, this.assets, this.collisions);
    this.camp = new SurvivorCamp(this.scene, this.assets, this.collisions);
    this.refugees = new RefugeeNPCs(this.scene, this.characterBuilder, this.camp.benchSeats);
    this.watchTower = new WatchTower(this.scene, this.assets, this.collisions);
    this.guards = new ArmedGuards(this.scene, this.characterBuilder);
    this.portal = new Portal(this.scene, this.assets, this.collisions);
    this.background = new BackgroundEnvironment(this.scene, this.assets, this.collisions);

    // Interactive NPCs list for dialogue interaction
    this.interactiveNPCs = [
      {
        name: 'Sersan Hendra',
        role: 'Komandan Pos Gerbang',
        avatar: '🪖',
        pos: new THREE.Vector3(5.8, 0, 10.4),
        dialogues: [
          'Siap gerak! Pos Pertahanan Penyintas ini adalah garis batas terakhir sebelum Dead Zone.',
          'Portal anomali ungu di sudut timur menghubungkan markas ini ke zona berbahaya.',
          'Pastikan bidikan senjatamu akurat dan selalu perhatikan sisa peluru di senjatamu!'
        ]
      },
      {
        name: 'Prajurit Rangga',
        role: 'Penembak Runduk Menara',
        avatar: '🎖️',
        pos: new THREE.Vector3(2.3, 0, -8.6),
        dialogues: [
          'Lampu sorot menara kami terus menyapu kabut di luar dinding pembatas.',
          'Zombie mutan sering berkeliaran mendekati dinding kayu saat tengah malam tiba.',
          'Jika kamu berniat menembus portal Dead Zone, jangan lupa bawa amunisi cadangan!'
        ]
      },
      {
        name: 'Nenek Sari',
        role: 'Penyintas Api Unggun',
        avatar: '👵',
        pos: new THREE.Vector3(-7.2, 0, 0.4),
        dialogues: [
          'Hangatkan badanmu di dekat api unggun, nak. Malam ini dingin sekali.',
          'Kami bersyukur para tentara berhasil mendirikan dinding pertahanan yang kokoh di sini.',
          'Hati-hati kalau kamu mendekati portal ungu itu... energinya terasa sangat misterius.'
        ]
      },
      {
        name: 'Budi Kecil',
        role: 'Anak Pengungsi',
        avatar: '🧒',
        pos: new THREE.Vector3(-6.2, 0, 1.2),
        dialogues: [
          'Kakak terlihat kuat sekali! Apa kakak tentara yang bertugas membasmi monster?',
          'Aku suka melihat cahaya ungu di portal timur, tapi kata paman tentara itu sangat berbahaya!'
        ]
      }
    ];
  }

  update(delta, elapsed) {
    this.camp.update(elapsed, delta);
    this.refugees.update(elapsed);
    this.guards.update(elapsed, delta);
    this.portal.update(elapsed, delta);
    this.lighting.update(elapsed, this.portal.pulseEnergy);
  }

  resolveCollisions(pos) {
    this.collisions.resolve(pos, 0.45);
  }

  getNearestNPC(pos, maxDist = 3.6) {
    let nearest = null;
    let minDist = maxDist;
    for (const npc of this.interactiveNPCs) {
      const dist = Math.hypot(pos.x - npc.pos.x, pos.z - npc.pos.z);
      if (dist < minDist) {
        minDist = dist;
        nearest = { npc, dist };
      }
    }
    return nearest;
  }
}

// ==================== SINGLETON INSTANCE & EXPORTS ====================
export let zombieOutpostInstance = null;

export function createZombieOutpostWorld(scene) {
  zombieOutpostInstance = new ZombieOutpostWorld(scene);
  return zombieOutpostInstance;
}

export function updateZombieOutpostWorld(delta, elapsed) {
  if (zombieOutpostInstance) {
    zombieOutpostInstance.update(delta, elapsed);
  }
}

export function resolveOutpostCollisions(pos) {
  if (zombieOutpostInstance) {
    zombieOutpostInstance.resolveCollisions(pos);
  }
}

export function getOutpostPortalLight() {
  return zombieOutpostInstance && zombieOutpostInstance.lighting ? zombieOutpostInstance.lighting.portalLight : null;
}
