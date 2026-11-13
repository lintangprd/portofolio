/* ═══════════════════════════════════════════
   GIS ANALYST PORTFOLIO — APP.JS
   ═══════════════════════════════════════════ */

// ── Project Modes Definition ─────────────────
const PROJECT_MODES = {
  'drone-mapping': {
    id: 'drone-mapping',
    title: 'Drone Survey Locations & Flight Corridors',
    tag: 'UAV Photogrammetry & Remote Sensing',
    paragraphs: [
      'High-resolution unmanned aerial vehicle (UAV) spatial surveys conducted across critical geographic hubs in Indonesia. Flight missions captured centimeter-grade ground sampling distance (GSD) imagery to generate dense 3D point clouds, digital surface models (DSM), and high-precision orthomosaics.',
      'Survey waypoints include Tabanan (Bali), Banyuwangi (East Java), Garut (West Java), Flores & Sumba (East Nusa Tenggara), and Mimika (Central Papua), serving terrain analysis, infrastructure inspection, and environmental baseline monitoring.'
    ],
    meta: [
      { label: 'Spatial Reference', val: 'EPSG:4326 (WGS 84)' },
      { label: 'Survey Points', val: '6 Survey Sites' },
      { label: 'Sensor Payload', val: 'RGB 4K + Multispectral' },
      { label: 'Geographic Extent', val: 'Indonesia Nationwide' }
    ],
    center: [-1.8, 116.15],
    zoom: 5,
    layers: [
      {
        id: 'ov-drone-locations',
        name: 'Drone Survey Locations',
        color: '#0F766E',
        type: 'geojson',
        url: 'data/Location_Drone.geojson',
        visible: true,
      },

    ]
  },

  'program-tracking': {
    id: 'program-tracking',
    title: 'Field Program Tracking & Implementation Status',
    tag: 'Operational GIS & Implementation Monitoring',
    paragraphs: [
      'A synchronized operational dashboard tracking field project deployments, spatial verification milestones, and regional ground activities across Indonesia. Each site integrates telemetry from field staff, automated spatial checkpoints, and periodic deliverable audits.',
      'Programs range from peatland hydrology monitoring in Riau and canopy carbon stock assessments in Central Kalimantan, to coastal mangrove mapping in South Sulawesi and highland agroforestry verification in Papua.'
    ],
    meta: [
      { label: 'Average Progress', val: '77% Completed' },
      { label: 'Monitored Sites', val: '7 Strategic Hubs' },
      { label: 'Project Status', val: '3 Done, 3 Active, 1 Planning' },
      { label: 'Field Specialists', val: '14 Specialists Deployed' }
    ],
    center: [-1.2, 116.5],
    zoom: 5,
    layers: [
      {
        id: 'ov-program-tracking',
        name: 'Active Field Programs',
        color: '#2563EB',
        type: 'geojson',
        url: 'data/Program_Tracking.geojson',
        visible: true,
      },
 
    ]
  },

  'potential-analysis': {
    id: 'potential-analysis',
    title: 'Regional Resource & Land Suitability Analysis',
    tag: 'Spatial Multi-Criteria Evaluation (SMCE)',
    paragraphs: [
      'Multi-Criteria Decision Analysis (MCDA) combining analytical hierarchy process (AHP) weighting, terrain modeling (slope, aspect, elevation), soil quality classifications, and environmental buffer exclusions to evaluate optimal development and conservation zones.',
      'High-potential clusters highlight strategic opportunities for renewable energy siting, agro-ecological expansion, and sustainable land management while preserving sensitive ecological corridors and watershed boundaries.'
    ],
    meta: [
      { label: 'Evaluation Model', val: 'Weighted Overlay / AHP' },
      { label: 'High Potential Area', val: '68.4% of Target Zones' },
      { label: 'Evaluated Factors', val: 'Slope, Soil, Hydrology, Road' },
      { label: 'Exclusion Buffer', val: '500m Conservation Buffer' }
    ],
    center: [-4.5, 118.0],
    zoom: 5,
    layers: [
      {
        id: 'ov-potential-zones',
        name: 'Suitability Potential Zones',
        color: '#D97706',
        type: 'geojson',
        url: 'data/Potential_Analysis.geojson',
        visible: true,
      },

    ]
  },

  'bamboo-identification': {
    id: 'bamboo-identification',
    title: 'Bamboo Species Identification & Canopy Mapping',
    tag: 'Remote Sensing & Botanical Classification',
    paragraphs: [
      'Spectral band ratioing (NDVI, NDRE, SAVI) fused with high-resolution UAV multispectral imagery to isolate bamboo canopy phenology from surrounding broadleaf rainforests and agricultural vegetation.',
      'Classified stands identify key economic and ecological species—including Dendrocalamus asper (Petung), Gigantochloa apus (Tali), and Gigantochloa atter (Black Bamboo)—quantifying canopy density, clump area, and biomass potential for rural community empowerment.'
    ],
    meta: [
      { label: 'Classifier', val: 'Random Forest (UAV + S2)' },
      { label: 'Identified Species', val: '5 Distinct Genera' },
      { label: 'Mapped Canopy', val: '244.5 Hectares' },
      { label: 'Classification Accuracy', val: '92.8% Producer Acc.' }
    ],
    center: [-7.8, 115.5],
    zoom: 6,
    layers: [
      {
        id: 'ov-bamboo-stands',
        name: 'Bamboo Canopy & Species',
        color: '#16A34A',
        type: 'geojson',
        url: 'data/Bamboo_Identification.geojson',
        visible: true,
      },

    ]
  }
};

// ── State ───────────────────────────────────
let currentMode = 'drone-mapping';
let OVERLAYS = [...PROJECT_MODES['drone-mapping'].layers];

// ── State ───────────────────────────────────
let map;
let overlayLayers = {};

// ── Initialise Map ──────────────────────────
function initMap() {
  map = L.map('map', {
    center: [-1.8, 116.15],
    zoom: 5,
    zoomControl: true,
    attributionControl: true,
  });

  // Temporarily hidden OSM basemap layer
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    eferrerPolicy: 'no-referrer-when-downgrade',
  }).addTo(map);

  // Map events
  map.on('moveend zoomend', updateMapInfo);
  updateMapInfo();

  // Build UI
  buildOverlayList();

  // Auto-activate default visible overlays on load
  OVERLAYS.forEach(ov => {
    if (ov.visible) {
      toggleOverlay(ov.id, true);
    }
  });

  setTimeout(() => { if (map) map.invalidateSize(); }, 200);
}

// ── Build overlay list ──────────────────────
function buildOverlayList() {
  const list = document.getElementById('overlay-list');
  list.innerHTML = '';
  OVERLAYS.forEach(ov => {
    const item = document.createElement('label');
    item.className = 'layer-item' + (ov.visible ? ' active' : '');
    item.innerHTML = `
      <input type="checkbox" class="layer-checkbox" value="${ov.id}" ${ov.visible ? 'checked' : ''} />
      <span class="layer-preview" style="background:${ov.color}"></span>
      <span class="layer-label">${ov.name}</span>
    `;
    item.querySelector('input').addEventListener('change', (e) => {
      item.classList.toggle('active', e.target.checked);
      toggleOverlay(ov.id, e.target.checked);
    });
    list.appendChild(item);
  });
}

// ── Toggle overlay ──────────────────────────
async function toggleOverlay(id, visible) {
  const ov = OVERLAYS.find(o => o.id === id);
  if (!ov) return;

  ov.visible = visible;

  if (visible) {
    if (!overlayLayers[id]) {
      await loadOverlay(ov);
    }
    if (overlayLayers[id]) {
      overlayLayers[id].addTo(map);
    }
  } else {
    if (overlayLayers[id]) {
      map.removeLayer(overlayLayers[id]);
    }
  }

  updateMapInfo();
}

// ── Feature Popup Formatter ─────────────────
function formatFeaturePopup(feature, layerName, color) {
  const props = feature.properties || {};
  const coords = feature.geometry && feature.geometry.coordinates;

  let rows = '';
  for (const [key, val] of Object.entries(props)) {
    if (val !== null && val !== undefined) {
      rows += `<tr>
        <td style="color:#6B7F6A;padding:3px 8px 3px 0;font-weight:600;white-space:nowrap;">${key}:</td>
        <td style="color:#263B25;padding:3px 0;font-weight:500;">${val}</td>
      </tr>`;
    }
  }

  let coordStr = '';
  if (coords && coords.length >= 2) {
    const lat = typeof coords[1] === 'number' ? coords[1].toFixed(5) : coords[1];
    const lng = typeof coords[0] === 'number' ? coords[0].toFixed(5) : coords[0];
    coordStr = `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6B7F6A;margin-top:6px;border-top:1px dashed #CDCFCD;padding-top:4px;">📍 ${lat}, ${lng}</div>`;
  }

  const title = props.Project || props.Zone || props.Species || props.Location || props.name || props.title || layerName || 'Feature Details';

  return `
    <div style="font-family:'Inter',system-ui,sans-serif;font-size:13px;min-width:180px;line-height:1.4;">
      <div style="font-weight:700;font-size:13px;color:${color || '#0F766E'};border-bottom:1.5px solid #CDCFCD;padding-bottom:5px;margin-bottom:6px;">
        ${title}
      </div>
      ${rows ? `<table style="font-size:12px;width:100%;border-collapse:collapse;">${rows}</table>` : '<div style="color:#6B7F6A;font-style:italic;">No attributes</div>'}
      ${coordStr}
    </div>
  `;
}

// ── Generic GeoJSON Layer Factory ───────────
function createGeoJsonLayer(data, ov) {
  const layerColor = ov.color || '#0F766E';
  return L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      // Dynamic status coloring if present
      let markerColor = layerColor;
      if (feature.properties?.Status === 'Completed') markerColor = '#10B981';
      else if (feature.properties?.Status === 'In Progress') markerColor = '#2563EB';
      else if (feature.properties?.Status === 'Planning') markerColor = '#A855F7';
      else if (feature.properties?.Classification?.includes('High Potential')) markerColor = '#D97706';

      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });
    },
    style: {
      color: layerColor,
      weight: 2,
      opacity: 0.85,
      fillColor: layerColor,
      fillOpacity: 0.15,
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(formatFeaturePopup(feature, ov.name, layerColor));
      layer.on({
        click: () => {
          const selEl = document.getElementById('meta-selected-feature');
          if (selEl) {
            const name = feature.properties?.Project || feature.properties?.Zone || feature.properties?.Species || feature.properties?.Location || feature.properties?.name || ov.name;
            selEl.textContent = name;
            selEl.style.color = layerColor;
          }
        },
        mouseover: () => {
          if (layer.setRadius) layer.setRadius(10);
          if (layer.setStyle) layer.setStyle({ weight: 3, opacity: 1, fillOpacity: 0.3 });
        },
        mouseout: () => {
          if (layer.setRadius) layer.setRadius(8);
          if (layer.setStyle) layer.setStyle({ weight: 2, opacity: 0.85, fillOpacity: 0.15 });
        }
      });
    }
  });
}

// ── Load overlay data ───────────────────────
async function loadOverlay(ov) {
  try {
    if (ov.id === 'ov-boundaries') {
      let resp;
      try {
        resp = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        if (!resp.ok) throw new Error();
      } catch (e) {
        resp = await fetch('https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson');
      }
      const data = await resp.json();
      overlayLayers[ov.id] = L.geoJSON(data, {
        style: {
          color: '#f59e0b',
          weight: 1.5,
          opacity: 0.7,
          fillOpacity: 0.03,
          fillColor: '#f59e0b',
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div style="font-family:'Inter',sans-serif;font-size:13px;">
              <strong style="font-size:14px;">${feature.properties.ADMIN || feature.properties.name || 'Unknown'}</strong><br/>
              <b>ISO:</b> ${feature.properties.ISO_A3 || 'N/A'}
            </div>
          `);
          layer.on('click', () => {
            const selEl = document.getElementById('meta-selected-feature');
            if (selEl) {
              selEl.textContent = feature.properties.ADMIN || feature.properties.name || 'Boundary';
              selEl.style.color = '#f59e0b';
            }
          });
        },
      });
    } else if (ov.type === 'geojson') {
      if (!ov.url) throw new Error(`No GeoJSON file configured for overlay ${ov.id}`);
      const resp = await fetch(ov.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} loading ${ov.url}`);
      const data = await resp.json();
      overlayLayers[ov.id] = createGeoJsonLayer(data, ov);
    }
  } catch (err) {
    console.error(`Failed to load overlay ${ov.id}:`, err);
  }
}

// ── Update map info panel ───────────────────
function updateMapInfo() {
  const center = map.getCenter();
  document.getElementById('info-zoom').textContent = map.getZoom();
  document.getElementById('info-center').textContent =
    `${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`;

  const activeLayers = OVERLAYS.filter(o => o.visible).length; // OSM basemap temporarily hidden
  document.getElementById('info-layers').textContent = activeLayers;
}

// ── Panel collapse toggle ───────────────────
function initPanelCollapse() {
  const panel = document.getElementById('layer-panel');
  const btn = document.getElementById('panel-collapse');
  btn.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    setTimeout(() => { if (map) map.invalidateSize(); }, 350);
  });
}

// ── Scroll animations ───────────────────────
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    '.skill-card, .project-card, .about-text, .about-image, .contact-item, .contact-form'
  );
  elements.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

// ── Project Mode Switcher ───────────────────
function switchProjectMode(modeKey) {
  const mode = PROJECT_MODES[modeKey];
  if (!mode) return;
  currentMode = modeKey;

  // 1. Remove layers of previous mode from map
  OVERLAYS.forEach(ov => {
    if (overlayLayers[ov.id] && map.hasLayer(overlayLayers[ov.id])) {
      map.removeLayer(overlayLayers[ov.id]);
    }
  });

  // 2. Set new OVERLAYS
  OVERLAYS = [...mode.layers];

  // 3. Pan / zoom to mode focus
  if (mode.center && mode.zoom) {
    map.flyTo(mode.center, mode.zoom, { duration: 1.2 });
  }

  // 4. Update UI layer panel
  buildOverlayList();

  // 5. Load and display active layers
  OVERLAYS.forEach(ov => {
    if (ov.visible) {
      toggleOverlay(ov.id, true);
    }
  });

  // 6. Update Sidebar Information
  updateSidebarInfo(mode);

  // 7. Update Map Info
  updateMapInfo();
}

function updateSidebarInfo(mode) {
  const sidebar = document.querySelector('.map-sidebar');
  if (!sidebar) return;

  const tagEl = sidebar.querySelector('.sidebar-tag');
  const titleEl = sidebar.querySelector('.sidebar-title');
  const bodyEl = sidebar.querySelector('.sidebar-body');
  const metaEl = sidebar.querySelector('.sidebar-meta');

  if (tagEl) tagEl.textContent = mode.tag;
  if (titleEl) titleEl.textContent = mode.title;

  if (bodyEl) {
    bodyEl.innerHTML = mode.paragraphs.map(p => `<p>${p}</p>`).join('');
  }

  if (metaEl) {
    const rows = mode.meta.map(m => `
      <div class="meta-item">
        <span class="meta-label">${m.label}</span>
        <span class="meta-val">${m.val}</span>
      </div>
    `).join('');

    metaEl.innerHTML = rows + `
      <div class="meta-item">
        <span class="meta-label">Selected Node</span>
        <span class="meta-val" id="meta-selected-feature" style="color:var(--text-dim);font-weight:normal;">Click a waypoint</span>
      </div>
    `;
  }
}

function initModeSwitcher() {
  const container = document.getElementById('project-modes');
  if (!container) return;

  const buttons = container.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modeKey = btn.dataset.mode;
      if (modeKey === currentMode) return;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      switchProjectMode(modeKey);
    });
  });
}

// ── Init everything ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initPanelCollapse();
  initModeSwitcher();
  initScrollAnimations();
});
