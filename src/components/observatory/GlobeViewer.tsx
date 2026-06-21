"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { env } from "@/lib/config";
import { SatelliteCategory, TleData, LayerPayload } from "@/lib/satellites";
import * as satellite from "satellite.js";

if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
  Cesium.Ion.defaultAccessToken = env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
}

interface Props {
  satellitesMap: Record<SatelliteCategory, LayerPayload | null>;
  activeLayers: Record<SatelliteCategory, boolean>;
  selectedSatelliteId: string | null;
  trackedSatelliteId?: string | null;
  orbitTrailsEnabled?: boolean;
  onLocationSelect: (lat: number, lon: number) => void;
  onSatelliteSelect: (id: string) => void;
  selectedLocation: { lat: number; lon: number } | null;
  isLensActive?: boolean;
  onLensLoaded?: () => void;
}

const CATEGORY_COLORS: Record<SatelliteCategory, string> = {
  stations: "#FF4444", // Red
  gps: "#3B82F6",      // Blue
  weather: "#10B981",  // Green
  starlink: "#00E5FF", // Cyan
  iridium: "#8B5CF6",  // Purple
};

export default function GlobeViewer({
  satellitesMap,
  activeLayers,
  selectedSatelliteId,
  trackedSatelliteId,
  orbitTrailsEnabled = true,
  onLocationSelect,
  onSatelliteSelect,
  selectedLocation,
  isLensActive = false,
  onLensLoaded,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Cesium.Viewer | null>(null);
  const dsRef        = useRef<Cesium.CustomDataSource | null>(null);

  const clickLocationCbRef = useRef(onLocationSelect);
  const clickSatelliteCbRef = useRef(onSatelliteSelect);
  useLayoutEffect(() => { clickLocationCbRef.current = onLocationSelect; }, [onLocationSelect]);
  useLayoutEffect(() => { clickSatelliteCbRef.current = onSatelliteSelect; }, [onSatelliteSelect]);

  const markerEntityRef = useRef<Cesium.Entity | null>(null);
  const ringEntityRef   = useRef<Cesium.Entity | null>(null);
  const orbitEntityRef  = useRef<Cesium.Entity | null>(null);

  // Map to store parsed satrecs for performance
  const satrecsRef = useRef<Map<string, { satrec: any; category: SatelliteCategory; name: string }>>(new Map());

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

    viewer.scene.globe.enableLighting = true;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0002;
    if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;

    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.shouldAnimate = true; // Required for SampledPositionProperty

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(78, 20, 22_000_000),
    });

    const ds = new Cesium.CustomDataSource("satellites");
    viewer.dataSources.add(ds);
    dsRef.current = ds;

    // Click Handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((evt: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(evt.position);
      if (Cesium.defined(picked) && picked.id && picked.id.id && typeof picked.id.id === "string" && picked.id.id.startsWith("sat_")) {
        const noradId = picked.id.id.replace("sat_", "");
        clickSatelliteCbRef.current(noradId);
        return;
      }

      const cart = viewer.camera.pickEllipsoid(evt.position, viewer.scene.globe.ellipsoid);
      if (!cart) return;
      const carto = Cesium.Cartographic.fromCartesian(cart);
      clickLocationCbRef.current(Cesium.Math.toDegrees(carto.latitude), Cesium.Math.toDegrees(carto.longitude));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // ── Sync Entities with active layers ──────────────────────────────────────
  useEffect(() => {
    const ds = dsRef.current;
    if (!ds) return;

    const currentSatIds = new Set<string>();
    const seenNames = new Set<string>(); // Keep track of rendered labels to avoid text overlay

    (Object.keys(satellitesMap) as SatelliteCategory[]).forEach(category => {
      if (!activeLayers[category] || !satellitesMap[category]) return;
      
      const payload = satellitesMap[category]!;
      const sats = payload.satellites;
      // For dense layers like starlink, we cap visible count to keep performance smooth
      const limit = category === 'starlink' ? 300 : sats.length;
      const visibleSats = sats.slice(0, limit);

      visibleSats.forEach((sat: TleData) => {
        const entityId = `sat_${sat.id}`;
        currentSatIds.add(entityId);

        if (!satrecsRef.current.has(sat.id)) {
          satrecsRef.current.set(sat.id, {
            satrec: satellite.twoline2satrec(sat.tleLine1, sat.tleLine2),
            category: sat.category,
            name: sat.name
          });
        }

        let entity = ds.entities.getById(entityId);
        
        const isStation = category === 'stations';
        const isFirstOfName = !seenNames.has(sat.name);
        if (isStation) {
          seenNames.add(sat.name);
        }

        if (!entity) {
          // Create new SampledPositionProperty
          const posProp = new Cesium.SampledPositionProperty();
          posProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;

          const color = Cesium.Color.fromCssColorString(CATEGORY_COLORS[category] || "#FFFFFF");

          entity = ds.entities.add({
            id: entityId,
            position: posProp,
            point: {
              pixelSize: isStation ? 14 : 6,
              color: color,
              outlineColor: isStation ? Cesium.Color.WHITE : Cesium.Color.BLACK,
              outlineWidth: isStation ? 2 : 1,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: (isStation && isFirstOfName) ? {
              text: sat.name,
              font: "bold 11px monospace",
              fillColor: color,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -14),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            } : undefined,
          });
        }
        
        // Hide normal markers when Orbital Lens is active, except stations
        entity.show = isLensActive ? isStation : true;
      });
    });

    // Remove entities that are no longer active
    const entitiesToRemove: Cesium.Entity[] = [];
    ds.entities.values.forEach(entity => {
      if (!currentSatIds.has(entity.id)) {
        entitiesToRemove.push(entity);
      }
    });
    entitiesToRemove.forEach(e => {
      ds.entities.remove(e);
      const noradId = e.id.replace("sat_", "");
      satrecsRef.current.delete(noradId);
    });

  }, [satellitesMap, activeLayers, isLensActive]);

  // ── High-Performance Propagation Loop ─────────────────────────────────────
  useEffect(() => {
    const ds = dsRef.current;
    if (!ds) return;

    let fastTick = 0;

    const propagate = () => {
      const now = new Date();
      const time = Cesium.JulianDate.fromDate(now);
      const gmst = satellite.gstime(now);

      const isSlowTick = fastTick % 2 === 0; // Every 2s

      ds.entities.values.forEach(entity => {
        const noradId = entity.id.replace("sat_", "");
        const meta = satrecsRef.current.get(noradId);
        if (!meta) return;

        const isFastGroup = meta.category === 'stations' || noradId === selectedSatelliteId;
        
        // Skip propagation if entity is hidden and not selected
        if (!entity.show && noradId !== selectedSatelliteId) return;

        // Propagate fast group every 1s, others every 2s
        if (isFastGroup || isSlowTick) {
          const posVel = satellite.propagate(meta.satrec, now);
          if (typeof posVel.position !== 'boolean') {
            const geo = satellite.eciToGeodetic(posVel.position, gmst);
            const cartesian = Cesium.Cartesian3.fromRadians(geo.longitude, geo.latitude, geo.height * 1000);
            const posProp = entity.position as Cesium.SampledPositionProperty;
            posProp.addSample(time, cartesian);
          }
        }

        // Highlight selected satellite
        if (entity.point) {
          if (noradId === selectedSatelliteId) {
            entity.point.pixelSize = new Cesium.ConstantProperty(18);
            entity.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString("#34D399"));
            entity.point.outlineColor = new Cesium.ConstantProperty(Cesium.Color.WHITE);
            entity.point.outlineWidth = new Cesium.ConstantProperty(3);
          } else {
            const isStation = meta.category === 'stations';
            const catColor = Cesium.Color.fromCssColorString(CATEGORY_COLORS[meta.category] || "#FFFFFF");
            entity.point.pixelSize = new Cesium.ConstantProperty(isStation ? 14 : 6);
            entity.point.color = new Cesium.ConstantProperty(catColor);
            entity.point.outlineColor = new Cesium.ConstantProperty(isStation ? Cesium.Color.WHITE : Cesium.Color.BLACK);
            entity.point.outlineWidth = new Cesium.ConstantProperty(isStation ? 2 : 1);
          }
        }
      });

      fastTick++;
    };

    propagate(); // initial burst
    const interval = setInterval(propagate, 1000);
    return () => clearInterval(interval);
  }, [selectedSatelliteId]);

  // ── Orbital Lens Heatmap Logic ───────────────────────────────────────────
  const heatmapLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!isLensActive) {
      if (heatmapLayerRef.current) {
        viewer.imageryLayers.remove(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      return;
    }

    const generateHeatmapCanvas = (): HTMLCanvasElement | null => {
      const width = 1024;
      const height = 512;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const requiredForLens: SatelliteCategory[] = ['stations', 'gps', 'weather', 'iridium', 'starlink'];
      const now = new Date();
      const gmst = satellite.gstime(now);

      const maxRadius = 16;
      ctx.globalCompositeOperation = 'lighter';

      const spotCanvas = document.createElement('canvas');
      spotCanvas.width = maxRadius * 2;
      spotCanvas.height = maxRadius * 2;
      const spotCtx = spotCanvas.getContext('2d');
      if (spotCtx) {
        const grad = spotCtx.createRadialGradient(maxRadius, maxRadius, 0, maxRadius, maxRadius, maxRadius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        spotCtx.fillStyle = grad;
        spotCtx.beginPath();
        spotCtx.arc(maxRadius, maxRadius, maxRadius, 0, Math.PI * 2);
        spotCtx.fill();
      }

      requiredForLens.forEach(category => {
        const payload = satellitesMap[category];
        if (!payload) return;
        
        const sats = payload.satellites;
        // Cap very dense networks slightly to ensure smooth generation
        const limit = category === 'starlink' ? 1800 : sats.length;
        
        for (let i = 0; i < Math.min(sats.length, limit); i++) {
          const sat = sats[i];
          let meta = satrecsRef.current.get(sat.id);
          
          if (!meta) {
            // Compute satrec on the fly if not in active tracking
            meta = {
              satrec: satellite.twoline2satrec(sat.tleLine1, sat.tleLine2),
              category: sat.category,
              name: sat.name
            };
          }

          const posVel = satellite.propagate(meta.satrec, now);
          if (typeof posVel.position !== 'boolean') {
            const geo = satellite.eciToGeodetic(posVel.position, gmst);
            const lat = satellite.radiansToDegrees(geo.latitude);
            const lon = satellite.radiansToDegrees(geo.longitude);

            const x = ((lon + 180) / 360) * width;
            const y = ((90 - lat) / 180) * height;

            ctx.drawImage(spotCanvas, x - maxRadius, y - maxRadius);
            
            // Handle horizontal wrapping for spots near longitude +/- 180
            if (x < maxRadius) ctx.drawImage(spotCanvas, x + width - maxRadius, y - maxRadius);
            if (x > width - maxRadius) ctx.drawImage(spotCanvas, x - width - maxRadius, y - maxRadius);
          }
        }
      });

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Congestion Color Ramp
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue;

        const v = alpha / 255;
        
        if (v < 0.25) {
          // Deep Indigo/Purple -> Dark Blue
          data[i] = 100 * v * 4;       // R
          data[i+1] = 0;               // G
          data[i+2] = 200 + (55 * v * 4); // B
          data[i+3] = alpha * 0.9;
        } else if (v < 0.6) {
          // Blue -> Cyan
          const t = (v - 0.25) / 0.35;
          data[i] = 100 * (1 - t);
          data[i+1] = 229 * t;         // G ramps to E5
          data[i+2] = 255;             // B is max
          data[i+3] = alpha;
        } else if (v < 0.85) {
          // Cyan -> Yellow
          const t = (v - 0.6) / 0.25;
          data[i] = 255 * t;           // R ramps to 255
          data[i+1] = 229 + (26 * t);  // G ramps to 255
          data[i+2] = 255 * (1 - t);   // B ramps down
          data[i+3] = alpha;
        } else {
          // Bright White/Red Hot Core
          data[i] = 255;
          data[i+1] = 255 * (1 - (v - 0.85)/0.15);
          data[i+2] = 0;
          data[i+3] = alpha;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    };

    let active = true;
    const refreshHeatmap = async () => {
      const startTime = Date.now();
      // Yield to main thread for the loading UI to render before heavy computation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!viewer || viewer.isDestroyed() || !active) return;
      
      const canvas = generateHeatmapCanvas();
      if (!canvas) return;

      const provider = await Cesium.SingleTileImageryProvider.fromUrl(canvas.toDataURL(), {
        rectangle: Cesium.Rectangle.MAX_VALUE,
      });

      if (!viewer || viewer.isDestroyed() || !active) return;

      const newLayer = viewer.imageryLayers.addImageryProvider(provider);
      newLayer.alpha = 0.8; // Blend with the globe underneath

      if (heatmapLayerRef.current) {
        viewer.imageryLayers.remove(heatmapLayerRef.current);
      }
      heatmapLayerRef.current = newLayer;

      // Ensure the cinematic overlay stays visible for at least 3 seconds
      const elapsed = Date.now() - startTime;
      const minDuration = 3000;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }

      if (onLensLoaded) onLensLoaded();
    };

    refreshHeatmap();

    // Live refresh cadence: 45 seconds
    const interval = setInterval(refreshHeatmap, 45_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isLensActive, satellitesMap, onLensLoaded]);

  // ── Orbit Trails (Past / Future Segments) ────────────────────────────────
  const orbitPastRef = useRef<Cesium.Entity | null>(null);
  const orbitFutureRef = useRef<Cesium.Entity | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clean up previous orbit entities
    if (orbitPastRef.current) { viewer.entities.remove(orbitPastRef.current); orbitPastRef.current = null; }
    if (orbitFutureRef.current) { viewer.entities.remove(orbitFutureRef.current); orbitFutureRef.current = null; }
    if (orbitEntityRef.current) { viewer.entities.remove(orbitEntityRef.current); orbitEntityRef.current = null; }

    if (!orbitTrailsEnabled) return;

    let targetId = selectedSatelliteId;
    if (!targetId) {
      for (const [id, meta] of satrecsRef.current.entries()) {
        if (meta.category === 'stations' && meta.name.includes('ISS')) {
          targetId = id;
          break;
        }
      }
    }

    if (!targetId) return;
    const meta = satrecsRef.current.get(targetId);
    if (!meta) return;

    const nowMs = Date.now();
    const pastPositions: Cesium.Cartesian3[] = [];
    const futurePositions: Cesium.Cartesian3[] = [];

    // Past: -45 mins to now
    for (let offsetMs = -45 * 60 * 1000; offsetMs <= 0; offsetMs += 30 * 1000) {
      const t = new Date(nowMs + offsetMs);
      const posVel = satellite.propagate(meta.satrec, t);
      if (typeof posVel.position !== 'boolean') {
        const gmst = satellite.gstime(t);
        const geo = satellite.eciToGeodetic(posVel.position, gmst);
        pastPositions.push(Cesium.Cartesian3.fromRadians(geo.longitude, geo.latitude, geo.height * 1000));
      }
    }

    // Future: now to +45 mins
    for (let offsetMs = 0; offsetMs <= 45 * 60 * 1000; offsetMs += 30 * 1000) {
      const t = new Date(nowMs + offsetMs);
      const posVel = satellite.propagate(meta.satrec, t);
      if (typeof posVel.position !== 'boolean') {
        const gmst = satellite.gstime(t);
        const geo = satellite.eciToGeodetic(posVel.position, gmst);
        futurePositions.push(Cesium.Cartesian3.fromRadians(geo.longitude, geo.latitude, geo.height * 1000));
      }
    }

    // Past orbit: white, dashed
    orbitPastRef.current = viewer.entities.add({
      id: `orbit_past_${targetId}`,
      polyline: {
        positions: pastPositions,
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.WHITE.withAlpha(0.35),
          dashLength: 16,
        }),
        arcType: Cesium.ArcType.NONE,
      },
    });

    // Future orbit: category-colored, solid
    const futureColor = Cesium.Color.fromCssColorString(CATEGORY_COLORS[meta.category] || "#00E5FF");
    orbitFutureRef.current = viewer.entities.add({
      id: `orbit_future_${targetId}`,
      polyline: {
        positions: futurePositions,
        width: 2.5,
        material: futureColor.withAlpha(0.7),
        arcType: Cesium.ArcType.NONE,
      },
    });

  }, [selectedSatelliteId, orbitTrailsEnabled]);

  // ── Orbit Segment Hover Tooltip ─────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Create the tooltip DOM element
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute; pointer-events: none; z-index: 100;
      background: rgba(2,6,23,0.92); color: white;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 6px; padding: 5px 10px;
      font: bold 11px 'JetBrains Mono', monospace;
      letter-spacing: 0.5px; white-space: nowrap;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      display: none; transition: opacity 0.15s;
    `;
    viewer.container.appendChild(tooltip);
    tooltipRef.current = tooltip;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    const showTooltip = (position: Cesium.Cartesian2) => {
      const picked = viewer.scene.pick(position);
      if (Cesium.defined(picked) && picked.id && typeof picked.id.id === "string") {
        const entityId = picked.id.id as string;
        let label = '';
        let dotColor = '';

        if (entityId.startsWith('orbit_past_')) {
          label = '◀ PAST ORBIT';
          dotColor = 'rgba(255,255,255,0.6)';
        } else if (entityId.startsWith('orbit_future_')) {
          label = 'FUTURE ORBIT ▶';
          dotColor = '#00E5FF';
        } else if (entityId.startsWith('sat_')) {
          const noradId = entityId.replace('sat_', '');
          const meta = satrecsRef.current.get(noradId);
          if (noradId === selectedSatelliteId) {
            label = '● CURRENT POSITION';
            dotColor = '#10B981';
          } else if (meta) {
            label = meta.name;
            dotColor = CATEGORY_COLORS[meta.category] || '#FFFFFF';
          }
        }

        if (label) {
          tooltip.innerHTML = `<span style="color:${dotColor}; margin-right:4px;">●</span>${label}`;
          tooltip.style.display = 'block';
          tooltip.style.left = `${position.x + 16}px`;
          tooltip.style.top = `${position.y - 12}px`;
          return;
        }
      }
      tooltip.style.display = 'none';
    };

    handler.setInputAction((evt: { endPosition: Cesium.Cartesian2 }) => {
      showTooltip(evt.endPosition);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Touch support: show on touch start, hide on touch end
    handler.setInputAction((evt: { position: Cesium.Cartesian2 }) => {
      showTooltip(evt.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    return () => {
      handler.destroy();
      if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      tooltipRef.current = null;
    };
  }, []);

  // ── Location Marker ──────────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedLocation) return;

    if (markerEntityRef.current) { viewer.entities.remove(markerEntityRef.current); markerEntityRef.current = null; }
    if (ringEntityRef.current)   { viewer.entities.remove(ringEntityRef.current);   ringEntityRef.current = null;   }

    const { lat, lon } = selectedLocation;
    const pos = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

    markerEntityRef.current = viewer.entities.add({
      position: pos,
      point: {
        pixelSize: 16,
        color: Cesium.Color.fromCssColorString("#00E5FF"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      ellipse: {
        semiMinorAxis: 80_000,
        semiMajorAxis: 80_000,
        height: 0,
        material: Cesium.Color.fromCssColorString("#00E5FF").withAlpha(0.08),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#00E5FF").withAlpha(0.5),
        outlineWidth: 2,
      },
    });

    const scanStart = Date.now();
    ringEntityRef.current = viewer.entities.add({
      position: pos,
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const t = (Date.now() - scanStart) / 3000;
          return Math.max(1, Math.min(600_000, t * 600_000)) + 5000;
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const t = (Date.now() - scanStart) / 3000;
          return Math.max(1, Math.min(600_000, t * 600_000));
        }, false),
        height: 0,
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const t = (Date.now() - scanStart) / 3000;
            return Cesium.Color.fromCssColorString("#00E5FF").withAlpha(Math.max(0, 0.4 - t * 0.4));
          }, false)
        ),
      },
    });

    setTimeout(() => {
      if (ringEntityRef.current && viewerRef.current) {
        viewerRef.current.entities.remove(ringEntityRef.current);
        ringEntityRef.current = null;
      }
    }, 3200);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 9_000_000),
      duration: 2.5,
      orientation: {
        heading: 0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0,
      },
    });
  }, [selectedLocation]);

  // ── Tracked Entity Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (!viewerRef.current || !dsRef.current) return;
    if (trackedSatelliteId) {
      const actualId = trackedSatelliteId.split('_')[0];
      const entity = dsRef.current.entities.getById(`sat_${actualId}`);
      if (entity) {
        viewerRef.current.trackedEntity = entity;
      }
    } else {
      viewerRef.current.trackedEntity = undefined;
    }
  }, [trackedSatelliteId]);

  return <div ref={containerRef} className="w-full h-full" style={{ background: "#020617" }} />;
}
