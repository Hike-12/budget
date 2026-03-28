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
    </div>
  );
};

export default FallingLeaves;
