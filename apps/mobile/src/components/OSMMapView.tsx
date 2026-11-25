// src/components/OSMMapView.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, UrlTile, Circle, Region } from 'react-native-maps';
import type { Report } from '../types';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const SEVERITY_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const CATEGORY_ICON: Record<string, string> = {
  pothole: '🕳️',
  streetlight: '💡',
  water_leak: '💧',
  trash: '🗑️',
  sidewalk: '🚶',
  graffiti: '🎨',
  traffic_signal: '🚦',
  other: '📌',
};

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export interface OSMMapViewProps {
  reports: Report[];
  selectedId?: string | null;
  onSelectReport?: (r: Report) => void;
  height?: number;
  showHotspots?: boolean;
  showClusters?: boolean;
  clusterRadiusMeters?: number;
}
export function OSMMapView({
  reports,
  selectedId,
  onSelectReport,
  height = 400,
  showHotspots = true,
  showClusters = true,
  clusterRadiusMeters = 120,
}: OSMMapViewProps) {
  const validReports = reports.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));

  const clusters = React.useMemo(() => {
    if (!showClusters) return validReports.map((r) => ({ center: { lat: r.lat, lng: r.lng }, reports: [r] }));
    const used = new Set<string>();
    const out: { center: { lat: number; lng: number }; reports: Report[] }[] = [];
    for (const r of validReports) {
      if (used.has(r.id)) continue;
      const group = [r];
      used.add(r.id);
      for (const other of validReports) {
        if (used.has(other.id)) continue;
        if (distanceMeters(r, other) <= clusterRadiusMeters) {
          group.push(other);
          used.add(other.id);
        }
      }
      const center = {
        lat: group.reduce((s, x) => s + x.lat, 0) / group.length,
        lng: group.reduce((s, x) => s + x.lng, 0) / group.length,
      };
      out.push({ center, reports: group });
    }
    return out;
  }, [validReports, showClusters, clusterRadiusMeters]);

  const hotspots = React.useMemo(() => {
    if (!showHotspots) return [];
    const centers: { lat: number; lng: number; count: number }[] = [];
    for (const r of validReports) {
      const nearby = validReports.filter((o) => distanceMeters(r, o) <= 250);
      if (nearby.length >= 3) {
        if (!centers.some((c) => distanceMeters(c, r) <= 120)) {
          centers.push({ lat: r.lat, lng: r.lng, count: nearby.length });
        }
      }
    }
    return centers;
  }, [validReports, showHotspots]);

  const initialRegion = React.useMemo(() => {
    if (!validReports.length) {
      return { latitude: 40.7128, longitude: -74.006, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    const lats = validReports.map((r) => r.lat);
    const lngs = validReports.map((r) => r.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5 + 0.01),
      longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5 + 0.01),
    };
  }, [validReports]);

  return (
    <View style={[styles.container, { height }]}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
        {hotspots.map((h, i) => (
          <Circle
            key={`hs-${i}`}
            center={{ latitude: h.lat, longitude: h.lng }}
            radius={250}
            strokeColor="rgba(239,68,68,0.6)"
            fillColor="rgba(239,68,68,0.15)"
          />
        ))}
        {clusters.map((cl, i) => {
          if (cl.reports.length === 1) {
            const r = cl.reports[0];
            return (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.lat, longitude: r.lng }}
                title={r.title}
                description={`${r.category} · ${r.severityLabel}`}
                pinColor={SEVERITY_COLOR[r.severityLabel] || '#6b7280'}
                onPress={() => onSelectReport?.(r)}
              >
                <View style={styles.marker}>
                  <Text style={styles.markerText}>{CATEGORY_ICON[r.category] || '📌'}</Text>
                </View>
              </Marker>
            );
          }
          return (
            <Marker
              key={`cluster-${i}`}
              coordinate={{ latitude: cl.center.lat, longitude: cl.center.lng }}
              title={`${cl.reports.length} reports`}
              description="Clustered reports"
              onPress={() => {
                if (cl.reports[0]) onSelectReport?.(cl.reports[0]);
              }}
            >
              <View style={[styles.cluster, { backgroundColor: SEVERITY_COLOR[cl.reports[0].severityLabel] || '#6b7280' }]}>
                <Text style={styles.clusterText}>{cl.reports.length}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
      <View style={styles.attribution}>
        <Text style={styles.attrText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', margin: 12, backgroundColor: '#e5e7eb' },
  map: { flex: 1 },
  marker: { padding: 2 },
  markerText: { fontSize: 18 },
  cluster: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  clusterText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  attribution: { position: 'absolute', bottom: 4, right: 6, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 4, borderRadius: 4 },
  attrText: { fontSize: 9, color: '#374151' },
});
