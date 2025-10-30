// Define the cities and their coordinates

function displayCitiesOnMap(locations) {
    console.log(locations);
    const cities = locations;

    // Create the map and center roughly on Minnesota
    const map = L.map("map").setView([46.0, -94.0], 6);

    // Add OpenStreetMap tiles (no API key required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add city markers with popups
    const bounds = [];
    cities.forEach((city) => {
    L.marker([city.lat, city.lng]).addTo(map).bindPopup(`<b>${city.name}</b>`);
    bounds.push([city.lat, city.lng]);
    });

    // Fit map to include all cities
    map.fitBounds(bounds);
}
