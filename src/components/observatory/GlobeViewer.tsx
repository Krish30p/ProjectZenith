"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { env } from "@/lib/config";

// Initialize Cesium token
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
  Cesium.Ion.defaultAccessToken = env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
}

interface OrbitPoint { lat: number; lon: number; }

interface Props {
  onLocationSelect: (lat: number, lon: number) => void;
  selectedLocation: { lat: number; lon: number } | null;
  issPosition: { latitude: number; longitude: number } | null;
  issOrbitPath: OrbitPoint[] | null;
}

export default function GlobeViewer({
  onLocationSelect,
  selectedLocation,
  issPosition,
  issOrbitPath,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Cesium.Viewer | null>(null);
  const clickCbRef   = useRef(onLocationSelect);
  // Keep ref in sync without triggering re-render
  useLayoutEffect(() => { clickCbRef.current = onLocationSelect; }, [onLocationSelect]);

  // Refs for entities so we can update without recreating
  const issEntityRef    = useRef<Cesium.Entity | null>(null);
  const orbitEntityRef  = useRef<Cesium.Entity | null>(null);
  const markerEntityRef = useRef<Cesium.Entity | null>(null);
  const ringEntityRef   = useRef<Cesium.Entity | null>(null);

  // ── Initialize Cesium viewer once ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation            : false,
      baseLayerPicker      : false,
      fullscreenButton     : false,
      geocoder             : false,
      homeButton           : false,
      infoBox              : false,
      sceneModePicker      : false,
      selectionIndicator   : false,
      timeline             : false,
      navigationHelpButton : false,
      creditContainer      : document.createElement("div"), // hide credits
    });

    viewerRef.current = viewer;

    // ── Globe visuals ──────────────────────────────────────────────────────
    viewer.scene.globe.enableLighting = true;          // Day/Night terminator
    viewer.scene.skyAtmosphere.show   = true;          // Atmospheric glow
    viewer.scene.globe.showGroundAtmosphere = true;    // Ground haze
    viewer.scene.fog.enabled          = true;
    viewer.scene.fog.density          = 0.0002;
    viewer.scene.skyBox.show          = true;          // Stars

    // Sync clock to real time for accurate day/night
    viewer.clock.currentTime    = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.shouldAnimate  = false;

    // ── Initial camera ─────────────────────────────────────────────────────
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(78, 20, 22_000_000),
    });

    // ── Click handler ──────────────────────────────────────────────────────
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((evt: { position: Cesium.Cartesian2 }) => {
      const cart = viewer.camera.pickEllipsoid(evt.position, viewer.scene.globe.ellipsoid);
      if (!cart) return;
      const carto = Cesium.Cartographic.fromCartesian(cart);
      clickCbRef.current(
        Cesium.Math.toDegrees(carto.latitude),
        Cesium.Math.toDegrees(carto.longitude)
      );
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // ── Update ISS position ──────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !issPosition) return;

    // Remove old ISS entity
    if (issEntityRef.current) {
      viewer.entities.remove(issEntityRef.current);
      issEntityRef.current = null;
    }

    const pos = Cesium.Cartesian3.fromDegrees(
      issPosition.longitude, issPosition.latitude, 408_000
    );

    issEntityRef.current = viewer.entities.add({
      position: pos,
      point: {
        pixelSize    : 14,
        color        : Cesium.Color.fromCssColorString("#FF4444"),
        outlineColor : Cesium.Color.WHITE,
        outlineWidth : 2,
        heightReference: Cesium.HeightReference.NONE,
      },
      label: {
        text              : "ISS",
        font              : "bold 11px monospace",
        fillColor         : Cesium.Color.fromCssColorString("#FF4444"),
        outlineColor      : Cesium.Color.BLACK,
        outlineWidth      : 2,
        style             : Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin    : Cesium.VerticalOrigin.BOTTOM,
        pixelOffset       : new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }, [issPosition]);

  // ── Update ISS orbit path ────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (orbitEntityRef.current) {
      viewer.entities.remove(orbitEntityRef.current);
      orbitEntityRef.current = null;
    }

    if (!issOrbitPath || issOrbitPath.length < 2) return;

    // Build polyline positions — split on antimeridian crossings
    const positions = issOrbitPath.map(p =>
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 408_000)
    );

    orbitEntityRef.current = viewer.entities.add({
      polyline: {
        positions,
        width    : 2,
        material : new Cesium.PolylineDashMaterialProperty({
          color    : Cesium.Color.fromCssColorString("#FF4444").withAlpha(0.6),
          dashLength: 16,
        }),
        arcType: Cesium.ArcType.NONE,
      },
    });
  }, [issOrbitPath]);

  // ── Update selected location marker ─────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedLocation) return;

    // Remove previous markers
    if (markerEntityRef.current) { viewer.entities.remove(markerEntityRef.current); markerEntityRef.current = null; }
    if (ringEntityRef.current)   { viewer.entities.remove(ringEntityRef.current);   ringEntityRef.current = null;   }

    const { lat, lon } = selectedLocation;
    const pos = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

    // Persistent glow marker
    markerEntityRef.current = viewer.entities.add({
      position: pos,
      point: {
        pixelSize    : 16,
        color        : Cesium.Color.fromCssColorString("#00E5FF"),
        outlineColor : Cesium.Color.WHITE,
        outlineWidth : 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      ellipse: {
        semiMinorAxis: 80_000,
        semiMajorAxis: 80_000,
        height       : 0,
        material     : Cesium.Color.fromCssColorString("#00E5FF").withAlpha(0.08),
        outline      : true,
        outlineColor : Cesium.Color.fromCssColorString("#00E5FF").withAlpha(0.5),
        outlineWidth : 2,
      },
    });

    // Expanding scan ring (fades out in 3s)
    const scanStart = Date.now();
    ringEntityRef.current = viewer.entities.add({
      position: pos,
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const t = (Date.now() - scanStart) / 3000;
          return Math.max(1, Math.min(600_000, t * 600_000)) + 1; // +1 ensures > minor
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const t = (Date.now() - scanStart) / 3000;
          return Math.max(1, Math.min(600_000, t * 600_000));
        }, false),
        height  : 0,
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const t = (Date.now() - scanStart) / 3000;
            return Cesium.Color.fromCssColorString("#00E5FF").withAlpha(Math.max(0, 0.4 - t * 0.4));
          }, false)
        ),
      },
    });

    // Remove scan ring after animation
    setTimeout(() => {
      if (ringEntityRef.current && viewerRef.current) {
        viewerRef.current.entities.remove(ringEntityRef.current);
        ringEntityRef.current = null;
      }
    }, 3200);

    // Fly to selected location
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 9_000_000),
      duration   : 2.5,
      orientation: {
        heading: 0,
        pitch  : -Cesium.Math.PI_OVER_TWO,
        roll   : 0,
      },
    });
  }, [selectedLocation]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#020617" }}
    />
  );
}
