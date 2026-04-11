"use client";

import { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const FallingLeaves = () => {
  const [init, setInit] = useState(false);

  // Initialize the tsParticles engine only once
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // loadFull provides all required plugins, specifically for shapes and move animations
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = (container) => {
    // You can access the internal engine container if needed
    console.log("Particles engine loaded successfully", container);
  };

  const options = useMemo(
    () => ({
      // By setting fullScreen to false, the canvas respects the CSS properties applied
      // to it (absolute positioning over the viewport).
      fullScreen: { enable: false },
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      particles: {
        number: {
          value: 30, // Number of falling leaves (adjust to taste)
          density: {
            enable: true,
            width: 1920,
            height: 1080,
          },
        },
        // We use a custom image shape for the leaf
        shape: {
          type: "image",
          options: {
            image: {
              src: "/leaf.png",
              width: 100,
              height: 100, // Adjust depending on actual aspect ratio
            },
          },
        },
        // Opacity adds depth, with some leaves more transparent
        opacity: {
          value: { min: 0.5, max: 1 },
        },
        // Random varying sizes for depth perception
        size: {
          value: { min: 15, max: 40 },
        },
        // 360-degree rotation slowly revolving
        rotate: {
          value: { min: 0, max: 360 },
          direction: "random",
          animation: {
            enable: true,
            speed: { min: 3, max: 10 }, // Slow, natural rotation
          },
        },
        // Wobble/Sway creates a gentle horizontal rocking motion
        wobble: {
          enable: true,
          distance: 25, // How far it sways left/right
          speed: 2, // How fast the sway oscillates
        },
        // Anti-Gravity / Falling movement physics
        move: {
          enable: true,
          direction: "bottom", // Fall downwards
          speed: { min: 0.1, max: 0.3 }, // Extremely slow, graceful descent
          straight: false, // Required for wobble effect to look organic
          // When a leaf goes "out" of the screen at the bottom, it'll naturally
          // despawn and a new one will spawn elsewhere (usually at the top when
          // direction is bottom) to maintain the max particle count.
          outModes: {
            default: "out",
          },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (!init) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none", // Makes sure it never blocks clicks to your navbar/ui
        overflow: "hidden", // Keeps overlapping particles cleanly cropped
        // This CSS mask softly squashes the visibility of the leaves on the right side
        // while keeping them fully visible on the left side where the tree is absent.
        maskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.1) 85%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.1) 85%, rgba(0,0,0,0) 100%)",
      }}
    >
      <Particles
        id="tsparticles-falling-leaves"
        particlesLoaded={particlesLoaded}
        options={options}
        // Force the canvas container itself to take 100% of this perfectly sized absolute div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      />
      {/* Blanket of static resting leaves at the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "-2px", // Moved up from -20px
          left: 0,
          width: "100%",
          height: "150px",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 150 }).map((_, i) => {
          // 3 Distinct layers for realistic depth of field
          const layer = i % 3; // 0 = back, 1 = mid, 2 = front
          const itemsPerLayer = 50; // 90 total / 3
          const indexInLayer = Math.floor(i / 3);

          // Spread evenly with slight organic jitter
          const spread = (100 / itemsPerLayer) * indexInLayer;
          const jitter = Math.random() * 4 - 2;
          const left = `${spread + jitter}%`;

          // Stagger baseline height to build the "pile", randomly vary
          const baseBottom = layer === 0 ? 10 : layer === 1 ? 0 : -10;
          const bottom = `${baseBottom + (Math.random() * 20 - 10)}px`;

          // Natural rotation and random flips to break up repeating patterns
          const rotate = `${Math.random() * 360}deg`;
          const flip = Math.random() > 0.5 ? 1 : -1;

          // Scale based on distance from camera
          const baseScale = layer === 0 ? 0.4 : layer === 1 ? 0.65 : 0.9;
          const scale = baseScale + Math.random() * 0.2;

          // Distant leaves are darker and blurred (depth of field)
          const brightness = layer === 0 ? 0.4 : layer === 1 ? 0.65 : 0.9;
          const blur =
            layer === 0 ? "blur(3px)" : layer === 1 ? "blur(1px)" : "blur(0px)";
          const dropShadow =
            layer === 2
              ? "drop-shadow(0 10px 15px rgba(0,0,0,0.5))"
              : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))";

          return (
            <img
              key={i}
              src="/leaf.png"
              alt=""
              style={{
                position: "absolute",
                left,
                bottom,
                width: "70px",
                height: "70px",
                transform: `rotate(${rotate}) scale(${scale}) scaleX(${flip})`,
                filter: `brightness(${brightness}) ${blur} ${dropShadow}`,
                zIndex: layer, // proper stacking
                objectFit: "contain",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FallingLeaves;
