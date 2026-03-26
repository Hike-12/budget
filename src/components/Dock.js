"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useDragControls,
  useMotionValue,
  animate,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaCalendarAlt } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdDragIndicator } from "react-icons/md";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Dashboard", href: "/dashboard", icon: LuLayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: FaCalendarAlt },
];

export default function Dock() {
  const pathname = usePathname();
  const [position, setPosition] = useState("left");
  const [mounted, setMounted] = useState(false);
  const [dragOrientation, setDragOrientation] = useState(null);
  const dragControls = useDragControls();
  const containerRef = useRef(null);

  // Restrict dock to only Dashboard and Calendar pages
  const isAllowedPath = pathname === "/dashboard" || pathname === "/calendar";

  // THE FIX: Use explicit motion values so we can manually reset them to 0
  // after each snap. Without this, Framer retains the drag offset and the dock
  // re-renders at: new CSS position + stale old drag offset = off screen!
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const saved = localStorage.getItem("dockPosition");
    if (saved && ["left", "right", "top", "bottom"].includes(saved)) {
      setPosition(saved);
    }
    setMounted(true);
  }, []);

  // Reset the accumulated drag offset whenever the snapped position changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("dockPosition", position);
    // Animate smoothly back to 0,0 so there's no jerk
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    animate(y, 0, { type: "spring", stiffness: 400, damping: 30 });
  }, [position, mounted, x, y]);

  // If not mounted or not on allowed path, don't render anything
  if (!mounted || !isAllowedPath) return null;

  const handleDrag = (event, info) => {
    const px = event.clientX ?? info.point.x;
    const py = event.clientY ?? info.point.y;
    const { innerWidth, innerHeight } = window;

    const distLeft = px;
    const distRight = innerWidth - px;
    const distTop = py;
    const distBottom = innerHeight - py;

    const min = Math.min(distLeft, distRight, distTop, distBottom);
    const newOrientation =
      min === distLeft || min === distRight ? "vertical" : "horizontal";

    if (dragOrientation !== newOrientation) {
      setDragOrientation(newOrientation);
    }
  };

  const handleDragEnd = (event, info) => {
    const px = event.clientX ?? info.point.x;
    const py = event.clientY ?? info.point.y;
    const { innerWidth, innerHeight } = window;

    const distLeft = px;
    const distRight = innerWidth - px;
    const distTop = py;
    const distBottom = innerHeight - py;

    const min = Math.min(distLeft, distRight, distTop, distBottom);

    if (min === distLeft) setPosition("left");
    else if (min === distRight) setPosition("right");
    else if (min === distTop) setPosition("top");
    else setPosition("bottom");

    setDragOrientation(null);
  };

  const currentOrientation =
    dragOrientation ||
    (position === "left" || position === "right" ? "vertical" : "horizontal");
  const isVertical = currentOrientation === "vertical";

  // Pure flex-based alignment inside a fixed full-screen flex container.
  // No CSS transforms, no absolute inset positioning — eliminates all conflicts.
  const getPositionClasses = () => {
    switch (position) {
      case "left":
        return "mr-auto my-auto";
      case "right":
        return "ml-auto my-auto";
      case "top":
        return "mb-auto mx-auto";
      case "bottom":
        return "mt-auto mx-auto";
      default:
        return "";
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-4 pointer-events-none z-100 flex"
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={containerRef}
        dragElastic={0.05}
        style={{ x, y, touchAction: "none", pointerEvents: "auto" }}
        onDrag={handleDrag}
        onDragStart={() =>
          setDragOrientation(isVertical ? "vertical" : "horizontal")
        }
        onDragEnd={handleDragEnd}
        className={`w-fit h-fit flex items-center gap-2 p-2 bg-[#0e0e0e]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-2xl ${getPositionClasses()} ${isVertical ? "flex-col" : "flex-row"}`}
      >
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label="Drag dock"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPosition("left");
            if (e.key === "ArrowRight") setPosition("right");
            if (e.key === "ArrowUp") setPosition("top");
            if (e.key === "ArrowDown") setPosition("bottom");
          }}
          className="cursor-grab active:cursor-grabbing p-1.5 text-white/30 hover:text-white/90 transition-colors flex items-center justify-center rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <MdDragIndicator
            size={20}
            className={
              isVertical
                ? "transition-transform duration-300"
                : "rotate-90 transition-transform duration-300"
            }
          />
        </button>

        <div
          className={`flex gap-2 transition-all duration-300 ${isVertical ? "flex-col" : "flex-row"}`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.name}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
              >
                <motion.div
                  whileHover={{
                    scale: 1.06,
                    backgroundColor: isActive ? "" : "rgba(255,255,255,0.08)",
                  }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-linear-to-tr from-primary to-secondary text-dark shadow-sm"
                      : "text-white/60 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  }`}
                  title={item.name}
                >
                  <item.icon size={20} />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
