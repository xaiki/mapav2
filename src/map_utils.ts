export const URLs = {
    "CartoDB Voyager": (x, y, z) => `https://${"abc"[Math.abs(x + y) % 3]}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}.png`,
    "Stamen Terrain": (x, y, z) => `https://stamen-tiles-${"abc"[Math.abs(x + y) % 3]}.a.ssl.fastly.net/terrain/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}.png`,
    "Stamen Toner": (x, y, z) => `https://stamen-tiles-${"abc"[Math.abs(x + y) % 3]}.a.ssl.fastly.net/toner/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}.png`,
    "Stamen Toner (hybrid)": (x, y, z) => `https://stamen-tiles-${"abc"[Math.abs(x + y) % 3]}.a.ssl.fastly.net/toner-hybrid/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}.png`,
    "Stamen Toner (lite)": (x, y, z) => `https://stamen-tiles-${"abc"[Math.abs(x + y) % 3]}.a.ssl.fastly.net/toner-lite/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}.png`,
    "Stamen Watercolor": (x, y, z) => `https://stamen-tiles-${"abc"[Math.abs(x + y) % 3]}.a.ssl.fastly.net/watercolor/${z}/${x}/${y}.png`,
    "OSM Mapnik": (x, y, z) => `https://${"abc"[Math.abs(x + y) % 3]}.tile.osm.org/${z}/${x}/${y}.png`,
    "Wikimedia Maps": (x, y, z) => `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}.png`
}

