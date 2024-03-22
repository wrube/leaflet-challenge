const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// Variables for use in code
const earthquakePromise = d3.json(url);
const earthquakeData = [];
const minDepth = 0  //km
const maxDepth = 250 //km
const colorScale = d3.scaleLinear()
                      .domain([minDepth, maxDepth]) 
                      .range(["yellow", "black"])

// load earthquake
earthquakePromise.then(data => {
    createMarkers(data);
})


/**
 * Creates a leaflet map and plots layers.
 * @param {Array} earthquakes Earthquake array of layers
 */
function createMap(earthquakes) {
    const initCoords = [-14, 125];
    const mapZoomLevel = 3;

    // Create the tile layers for background
    // Default tile
    const Esri_WorldPhysical = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
      maxZoom: 8
    });
    // alternate tile layer
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
  

    // // Load and display tectonic plates
    d3.json('static/data/plates.json').then(data => {
    
    const boundaries = data.features;

    const boundariesLayer = L.geoJSON(boundaries, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`${feature.properties.PlateName}`)
        },
        style: function (feature) {
          return {
            color: "yellow",
            fillOpacity: 0,
            weight: 0.8
          }
        }
      })

      // Create a baseMaps object to hold the lightmap layer.
      const baseMaps = {
        "Topographic Map": Esri_WorldPhysical,
        "Street Map": street,
      };

      // Create an overlayMaps object to hold the earthquakes layer.
      const overlayMaps = {
        "Tectonic Boundaries": boundariesLayer,
        "Earthquakes": earthquakes,
      };

    
      // Create the map object with options.
      let myMap = L.map("map", {
        center: initCoords,
        zoom: mapZoomLevel,
        layers: [Esri_WorldPhysical, earthquakes]
      });
    
      // Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map.
      L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
      }).addTo(myMap);

      // Add legend for colour
      const legend = addColorBar(myMap);
      legend.addTo(myMap);
    })
  }

  
  
/**
 * Creates earthquake circle markers from JSON file.
 * @param {JSON} response Earthquake geoJSON object from USGS
 */
function createMarkers(response) {

  // Pull earthquake data from response
  const earthquakes = response.features;

  // convert geoJSON file into layer points and provide popup and tooltip inputs
  L.geoJSON(earthquakes, {
      pointToLayer: function (geoJsonPoint, latlng) {
          let depth = Number(geoJsonPoint.geometry.coordinates.slice(2));
          let magnitude = Number(geoJsonPoint.properties.mag)
          let color = getColour(depth);     // map the color of the marker relate to depth
          earthquakeData.push( L.circleMarker(latlng, {
              radius: magnitude * 2.5,  // let the marker size relate to magnitude
              fillColor: color,
              fillOpacity: 0.7,
              color: "grey",
              weight: 1,
              opacity:0.7
          })
          .bindPopup(` <h3>${geoJsonPoint.properties.place}</h3>
                          <p>Magnitude: ${magnitude}<p>
                          <p>Depth: ${depth}km<p>
                          <p> ${new Date(geoJsonPoint.properties.time)}</p>`)
          .bindTooltip(`${geoJsonPoint.properties.place}<br>
                        Magnitude: ${magnitude}<br>
                        Depth: ${depth}km`)
          );
      }
    })

  const earthquakeLayer = L.layerGroup(earthquakeData);
  
  createMap(earthquakeLayer);
  
  }

/**
 * Returns the color hex depending on the input depth.
 * @param {Number} d depth number which maps a color
 * @returns color hex
 */
function getColour(d) {
  return  d > 110 ? '#993404' :
          d >  80 ? '#d95f0e' :
          d >  50 ? '#fe9929' :
          d >  20 ? '#fed98e' :
                    '#ffffd4' ;
}


/**
 * Creates a Leaflet colour legend.
 * @param {Leaflet Map} map Map object to add colourbar to.
 * @returns Leaflet control object in the form of a legend
 */
function addColorBar(map) {
  var legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {

  const div = L.DomUtil.create('div', 'info legend'),
    depths = [-10, 20, 50, 80, 110];
    labels = '';

  // generate the html code for color box and the labels
  for (var i = 0; i < depths.length; i++) {
    labels +=  `
      <i style="background:${getColour(depths[i] + 1)}"></i> 
      ${depths[i]} ${depths[i + 1] ? '&ndash; ' + depths[i + 1] + ' km<br>' : 'km +'}`;

  }

  // generate the html of the color legend and insert the colour labels
  div.innerHTML += `<div class="title";>
                      <h4>Depth of Earthquake Epicentre</h4>
                    </div>
                    <div class="colourbox";>
                      ${labels}
                    </div>`
  

  return div;
};

return legend
}

  


      
