"use client";

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { Viewer, Entity, PointGraphics, LabelGraphics } from 'resium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { env } from '@/lib/config';

// Set Cesium Base URL
if (typeof window !== 'undefined') {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium';
  Cesium.Ion.defaultAccessToken = env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
}

interface Props {
  coordinates: { lat: number; lon: number };
  issPosition?: { latitude: number; longitude: number } | null;
}

export default function CesiumViewer({ coordinates, issPosition }: Props) {
  const viewerRef = useRef<React.ComponentRef<typeof Viewer> | null>(null);

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement as Cesium.Viewer;
      
      // Fly to user location smoothly
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(coordinates.lon, coordinates.lat, 10000000),
        duration: 3,
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0
        }
      });
    }
  }, [coordinates]);

  return (
    <Viewer 
      ref={viewerRef}
      full 
      timeline={false} 
      animation={false} 
      baseLayerPicker={false}
      homeButton={false}
      geocoder={false}
      navigationHelpButton={false}
      sceneModePicker={false}
      infoBox={false}
      selectionIndicator={false}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    >
      
      {/* User Location */}
      <Entity position={Cesium.Cartesian3.fromDegrees(coordinates.lon, coordinates.lat)}>
        <PointGraphics pixelSize={15} color={Cesium.Color.CYAN} outlineColor={Cesium.Color.WHITE} outlineWidth={2} />
        <LabelGraphics 
          text="YOU ARE HERE" 
          font="12pt monospace" 
          fillColor={Cesium.Color.WHITE}
          style={Cesium.LabelStyle.FILL_AND_OUTLINE}
          outlineWidth={2}
          verticalOrigin={Cesium.VerticalOrigin.BOTTOM}
          pixelOffset={new Cesium.Cartesian2(0, -20)}
        />
      </Entity>

      {/* ISS Location */}
      {issPosition && (
        <Entity position={Cesium.Cartesian3.fromDegrees(issPosition.longitude, issPosition.latitude, 400000)}>
          <PointGraphics pixelSize={10} color={Cesium.Color.RED} outlineColor={Cesium.Color.WHITE} outlineWidth={2} />
          <LabelGraphics 
            text="ISS" 
            font="14pt monospace" 
            fillColor={Cesium.Color.RED}
            style={Cesium.LabelStyle.FILL_AND_OUTLINE}
            outlineWidth={2}
            verticalOrigin={Cesium.VerticalOrigin.BOTTOM}
            pixelOffset={new Cesium.Cartesian2(0, -20)}
          />
        </Entity>
      )}
    </Viewer>
  );
}
