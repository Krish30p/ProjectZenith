"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { env } from "@/lib/config";
import { SatelliteCategory, TleData } from "@/lib/satellites";
import * as satellite from "satellite.js";

if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
  Cesium.Ion.defaultAccessToken = env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
}

interface Props {
  satellitesMap: Record<SatelliteCategory, LayerPayload | null>;
  activeLayers: Record<SatelliteCategory, boolean>;
  selectedSatelliteId: string | null;
  onLocationSelect: (lat: number, lon: number) => void;
  onSatelliteSelect: (id: string) => void;
  selectedLocation: { lat: number; lon: number } | null;
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
  onLocationSelect,
  onSatelliteSelect,
  selectedLocation,
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

    (Object.keys(satellitesMap) as SatelliteCategory[]).forEach(category => {
      if (!activeLayers[category] || !satellitesMap[category]) return;
      
      const payload = satellitesMap[category]!;
      const sats = payload.satellites;
      // For dense layers like starlink, we cap visible count to keep performance smooth
      const limit = category === 'starlink' ? 300 : sats.length;
      const visibleSats = sats.slice(0, limit);

      visibleSats.forEach(sat => {
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
        if (!entity) {
          // Create new SampledPositionProperty
          const posProp = new Cesium.SampledPositionProperty();
          posProp.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;

          const isStation = category === 'stations';
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
            label: isStation ? {
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

  }, [satellitesMap, activeLayers]);

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
            entity.point.outlineColor = new Cesium.ConstantProperty(Cesium.Color.WHITE);
            entity.point.outlineWidth = new Cesium.ConstantProperty(3);
          } else {
            const isStation = meta.category === 'stations';
            entity.point.pixelSize = new Cesium.ConstantProperty(isStation ? 14 : 6);
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

  // ── Orbit Trails ────────────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (orbitEntityRef.current) {
      viewer.entities.remove(orbitEntityRef.current);
      orbitEntityRef.current = null;
    }

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

    // Generate past and future orbit segments
    const positions: Cesium.Cartesian3[] = [];
    const nowMs = Date.now();
    
    // -45 mins to +45 mins (roughly one orbit)
    for (let offsetMs = -45 * 60 * 1000; offsetMs <= 45 * 60 * 1000; offsetMs += 60 * 1000) {
      const t = new Date(nowMs + offsetMs);
      const posVel = satellite.propagate(meta.satrec, t);
      if (typeof posVel.position !== 'boolean') {
        const gmst = satellite.gstime(t);
        const geo = satellite.eciToGeodetic(posVel.position, gmst);
        positions.push(Cesium.Cartesian3.fromRadians(geo.longitude, geo.latitude, geo.height * 1000));
      }
    }

    const colorStr = CATEGORY_COLORS[meta.category] || "#FFFFFF";

    orbitEntityRef.current = viewer.entities.add({
      polyline: {
        positions,
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString(colorStr).withAlpha(0.6),
          dashLength: 16,
        }),
        arcType: Cesium.ArcType.NONE,
      },
    });

  }, [selectedSatelliteId]);

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

  return <div ref={containerRef} className="w-full h-full" style={{ background: "#020617" }} />;
}
