/**
 * RescueMap - Live map visualization for RescueChain
 * Plots: Active complaints, Assigned NGOs, Resolved complaints
 * Shows EXIF-verified vs user-entered location
 * Role-restricted layers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getMapComplaints, getMapNGOs, getNearestNGOs } from '../../services/api/mapApi';
import 'leaflet/dist/leaflet.css';
import './RescueMap.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_COLORS = {
    submitted: '#dc2626',
    accepted: '#ea580c',
    arriving: '#f59e0b',
    in_progress: '#2563eb',
    resolved: '#16a34a',
    fake_information: '#6b7280',
};

const createStatusIcon = (status) => {
    const color = STATUS_COLORS[status] || '#6b7280';
    return L.divIcon({
        className: 'rescue-marker',
        html: `<span class="marker-pin marker-status" style="--marker-color: ${color}"></span>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
    });
};

const NGO_ICON = L.divIcon({
    className: 'rescue-marker',
    html: '<span class="marker-pin marker-ngo">🏛️</span>',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
});

function MapBounds({ complaints, ngos }) {
    const map = useMap();
    useEffect(() => {
        const points = [
            ...complaints.map((c) => [c.latitude, c.longitude]),
            ...ngos.map((n) => [n.latitude, n.longitude]),
        ];
        if (points.length === 0) return;
        if (points.length === 1) {
            map.setView(points[0], 14);
            return;
        }
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [map, complaints, ngos]);
    return null;
}

export default function RescueMap({
    userType = 'victim',
    onComplaintSelect,
    onViewDetails,
    selectedComplaintId,
    height = '400px',
    showLayerControl = true,
}) {
    const [complaints, setComplaints] = useState([]);
    const [ngos, setNgos] = useState([]);
    const [nearestNGOs, setNearestNGOs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [layers, setLayers] = useState({
        active: true,
        resolved: true,
        ngos: userType === 'ddma' || userType === 'sdma',
    });

    const activeStatuses = ['submitted', 'accepted', 'arriving', 'in_progress'];
    const activeComplaints = complaints.filter((c) => activeStatuses.includes(c.status));
    const resolvedComplaints = complaints.filter((c) => c.status === 'resolved');
    const canViewNGOs = userType === 'ddma' || userType === 'sdma';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [complaintsRes, ngosRes] = await Promise.all([
                getMapComplaints(),
                canViewNGOs ? getMapNGOs().catch(() => ({ data: { ngos: [] } })) : Promise.resolve({ data: { ngos: [] } }),
            ]);
            setComplaints(complaintsRes.data?.complaints || []);
            setNgos(ngosRes.data?.ngos || []);
        } catch (err) {
            setError(err.message || 'Failed to load map data');
            setComplaints([]);
            setNgos([]);
        } finally {
            setLoading(false);
        }
    }, [canViewNGOs]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Fetch nearest NGOs when a complaint is selected (DDMA/SDMA only)
    useEffect(() => {
        if (!canViewNGOs || !selectedComplaintId) {
            setNearestNGOs([]);
            return;
        }
        const complaint = complaints.find((c) => c.id === selectedComplaintId);
        if (!complaint?.latitude || !complaint?.longitude) {
            setNearestNGOs([]);
            return;
        }
        getNearestNGOs(complaint.latitude, complaint.longitude, 5)
            .then((res) => setNearestNGOs(res.data?.ngos || []))
            .catch(() => setNearestNGOs([]));
    }, [canViewNGOs, selectedComplaintId, complaints]);

    const handleMarkerClick = (complaintId) => {
        if (onComplaintSelect) onComplaintSelect(complaintId, { source: 'marker' });
    };

    const handleViewDetails = (e, complaintId) => {
        e.stopPropagation();
        if (onViewDetails) onViewDetails(complaintId);
        else if (onComplaintSelect) onComplaintSelect(complaintId, { source: 'popup-button' });
    };

    if (loading) {
        return (
            <div className="rescue-map rescue-map-loading" style={{ height }}>
                <div className="map-loading-spinner" />
                <p>Loading map...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rescue-map rescue-map-error" style={{ height }}>
                <p>{error}</p>
                <button type="button" onClick={fetchData} className="btn-retry">
                    Retry
                </button>
            </div>
        );
    }

    const displayActive = activeComplaints.filter(() => layers.active);
    const displayResolved = resolvedComplaints.filter(() => layers.resolved);
    const displayNGOs = layers.ngos ? ngos : [];

    const allPoints = [
        ...displayActive.map((c) => [c.latitude, c.longitude]),
        ...displayResolved.map((c) => [c.latitude, c.longitude]),
        ...displayNGOs.map((n) => [n.latitude, n.longitude]),
    ];
    const center = allPoints.length
        ? allPoints.reduce(
              (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
              [0, 0]
          ).map((v) => v / allPoints.length)
        : [28.6139, 77.209]; // Default: Delhi

    return (
        <div className="rescue-map-wrapper" style={{ height }}>
            <MapContainer
                center={center}
                zoom={10}
                className="rescue-map"
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBounds complaints={displayActive.concat(displayResolved)} ngos={displayNGOs} />

                {displayActive.map((c) => (
                    <Marker
                        key={c.id}
                        position={[c.latitude, c.longitude]}
                        icon={createStatusIcon(c.status)}
                        eventHandlers={{ click: () => handleMarkerClick(c.id) }}
                    >
                        <Popup>
                            <div className="map-popup">
                                <div className="popup-status" style={{ color: STATUS_COLORS[c.status] }}>
                                    {c.status.replace('_', ' ').toUpperCase()}
                                </div>
                                <p className="popup-location">{c.location}</p>
                                <p className="popup-text">{c.complaintText?.slice(0, 100)}...</p>
                                <div className="popup-meta">
                                    <span className={`popup-verified ${c.exifVerified ? 'verified' : 'user-entered'}`}>
                                        {c.exifVerified ? '✓ EXIF GPS verified' : '📍 User-entered location'}
                                    </span>
                                    {c.assignedToName && (
                                        <span className="popup-assigned">Assigned: {c.assignedToName}</span>
                                    )}
                                </div>
                                {(onComplaintSelect || onViewDetails) && (
                                    <button
                                        type="button"
                                        className="popup-action"
                                        onClick={(e) => handleViewDetails(e, c.id)}
                                    >
                                        View details
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {displayResolved.map((c) => (
                    <Marker
                        key={c.id}
                        position={[c.latitude, c.longitude]}
                        icon={createStatusIcon('resolved')}
                        eventHandlers={{ click: () => handleMarkerClick(c.id) }}
                    >
                        <Popup>
                            <div className="map-popup">
                                <div className="popup-status resolved">RESOLVED</div>
                                <p className="popup-location">{c.location}</p>
                                <p className="popup-text">{c.complaintText?.slice(0, 100)}...</p>
                                <div className="popup-meta">
                                    <span className={`popup-verified ${c.exifVerified ? 'verified' : 'user-entered'}`}>
                                        {c.exifVerified ? '✓ EXIF GPS verified' : '📍 User-entered location'}
                                    </span>
                                </div>
                                {(onComplaintSelect || onViewDetails) && (
                                    <button
                                        type="button"
                                        className="popup-action"
                                        onClick={(e) => handleViewDetails(e, c.id)}
                                    >
                                        View details
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {displayNGOs.map((n) => (
                    <Marker key={n.id} position={[n.latitude, n.longitude]} icon={NGO_ICON}>
                        <Popup>
                            <div className="map-popup map-popup-ngo">
                                <div className="popup-ngo-name">{n.name}</div>
                                {n.address && <p className="popup-address">{n.address}</p>}
                                {n.activeComplaintsCount > 0 && (
                                    <span className="popup-active">Active: {n.activeComplaintsCount}</span>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {showLayerControl && (
                <div className="map-layer-control">
                    <div className="layer-control-title">Layers</div>
                    <label className="layer-checkbox">
                        <input
                            type="checkbox"
                            checked={layers.active}
                            onChange={(e) => setLayers((prev) => ({ ...prev, active: e.target.checked }))}
                        />
                        Active complaints
                    </label>
                    <label className="layer-checkbox">
                        <input
                            type="checkbox"
                            checked={layers.resolved}
                            onChange={(e) => setLayers((prev) => ({ ...prev, resolved: e.target.checked }))}
                        />
                        Resolved
                    </label>
                    {canViewNGOs && (
                        <label className="layer-checkbox">
                            <input
                                type="checkbox"
                                checked={layers.ngos}
                                onChange={(e) => setLayers((prev) => ({ ...prev, ngos: e.target.checked }))}
                            />
                            NGOs
                        </label>
                    )}
                </div>
            )}

            {canViewNGOs && selectedComplaintId && nearestNGOs.length > 0 && (
                <div className="map-nearest-ngos">
                    <div className="nearest-title">Nearest NGOs</div>
                    <ul className="nearest-list">
                        {nearestNGOs.map((n) => (
                            <li key={n.id}>
                                <strong>{n.name}</strong>
                                <span className="nearest-distance">{n.distanceKm} km</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
