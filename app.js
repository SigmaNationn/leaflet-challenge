var map = L.map('map').setView([0, 0], 3);

// Define the base layers
var satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 19,
}).addTo(map);

var terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
});

var openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
});

// Create an object to hold the base layers
var baseLayers = {
    "Satellite": satelliteLayer,
    "Terrain": terrainLayer,
    "OpenStreetMap": openStreetMapLayer,
};

// Add the layers control to the map
L.control.layers(baseLayers).addTo(map);

function fetchAndRefreshData() {
    var url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var earthquakeLayer = createEarthquakeMarkers(data);
            earthquakeLayer.addTo(map);
        });
}

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.place) {
        var popupContent = `
            <strong>Location:</strong> ${feature.properties.place}<br>
            <strong>Magnitude:</strong> ${feature.properties.mag}<br>
            <strong>Depth:</strong> ${feature.geometry.coordinates[2]} km
        `;
        layer.bindPopup(popupContent);
    }
}

function createEarthquakeMarkers(data) {
    return L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            var depth = feature.geometry.coordinates[2];
            var markerOptions = {
                radius: feature.properties.mag * 5,
                fillColor: getColor(depth),
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
            };
            return L.circleMarker(latlng, markerOptions);
        },
        onEachFeature: onEachFeature,
    });
}

// Fetch and refresh data every 5 minutes (300,000 milliseconds)
fetchAndRefreshData();
setInterval(fetchAndRefreshData, 300000);

var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    var depths = [-10, 10, 30, 50, 70, 90];
    var labels = [];

    for (var i = 0; i < depths.length; i++) {
        div.innerHTML += '<i style="background:' + getColor(depths[i] + 1) + '"></i> ' +
            depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);

function getColor(depth) {
    var colors = ["#00ff00", "#ffff00", "#ff9900", "#ff3300", "#990000"];
    var depthIndex = Math.floor(depth / 50);
    return colors[depthIndex >= 4 ? 4 : depthIndex];
}