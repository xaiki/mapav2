<script lang="ts">
 import * as d3  from "d3";
 import {tile} from 'd3-tile';
 import * as topojson from 'topojson-client';
 export let width;
 export let height;

 const access_token ="pk.eyJ1Ijoic2VydWdlbmVyaXMiLCJhIjoiY2w3dzB4aHZyMDh1ZDN2cXRiZ3M2emh5OCJ9.w5ChPmWEjwfdL5Zbglcrmg";
 const tileset="mapbox.mapbox-streets-v8";

 const projection = d3.geoMercator();
 const path = d3.geoPath(projection);

 let urls = new Set();

 const url = (x, y, z) => {
     const ret = `./tiles/${"abc"[Math.abs(x + y) % 3]}.tiles.mapbox.com/v4/${tileset}/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}.png?access_token=${access_token}`;
     urls.add(ret)
     let  s = '';
     for (let e of urls) {
         s+=e + '\n'
     }
     console.error(s)
     return ret;
 }

 Promise.all([
     d3.json('./data/comunas.topo'),
     d3.json('./data/barrios.topo')
 ]).then(([comunas, barrios]) => {
     console.error(comunas, barrios)
     const t = tile()
         .size([600, 600])
         .scale(projection.scale() * 2 * Math.PI)
         .translate(projection([0, 0]));

     const topo = {
         comunas: topojson.feature(comunas, comunas.objects.comunas),
         barrios: topojson.feature(barrios, barrios.objects.barrios),
         mesh: topojson.mesh(comunas, comunas.objects.comunas,
                             (a,b) => a===b)
     }
     projection.fitExtent([[0,0], [600,600]], topo.comunas )
     t.scale(projection.scale() * 2 * Math.PI)
               .translate(projection([0, 0]))
     const svg = d3.select('#svg');

     svg
                   .selectAll('.comuna')
                   .data(topo.comunas.features, d => d.properties.COMUNAS)
                   .join(
                       enter => {
                           const g = enter.append('g')
                                          .attr('class', 'comuna')
                                          .attr('id', d => d.properties.COMUNAS)
                                          .on("mouseover", function() {
                                              svg.selectAll('.comuna')
                                              .classed('raised', false)
                                              const sel = d3.select(this)
                                              sel.raise()
                                              .classed('raised', true)
                                          })

                           g.append('path')
                                          .attr('d', path);

                           g.append('g')
                            .attr('class', 'barrios')
                            .selectAll('.barrio')
                            .data(d => topo.barrios.features.filter(function (f) {
                                console.error(this, d)
                                return f.properties.COMUNA === d.properties.COMUNAS
                            }), d => d.properties.BARRIO)
                            .join('path')
                            .attr('class', 'barrio')
                            .attr('id', d => d.properties.BARRIO)
                            .attr('d', path)
                       }

                   )

 }) 
</script>

<svg id="svg" class="map" {width} {height}></svg>

<style>
 .map {
     transition: all 200ms;
 }
 .map.selection {
     transform: rotateX(45deg);
 }
 :global(path) {
     fill: white;
     stroke: black;
     transition: all 200ms;
     transform-origin: center;
     transform-box: fill-box;
 }

 :global(.raised .barrio) {
     opacity: 1;
 }
 :global(.barrio) {
     stroke: yellow;
     opacity: 0;
     transition: all 500ms;
 }
 .barrios {
     display: none;
 }
 .contour {

 }
 .contour path {
     stroke: red;
     stroke-width: 50px;
     stroke-linejoin: round;
     fill: black;
 }

 :global(.comuna) {
     transform-box: fill-box;
     transform-origin: center;
 }
 .selected {
     fill: darkred!important;
     transform: scale(4);
     transform-origin: center;
     transform-box: fill-box;
 }

 :global(.comuna:hover) {
     transform: scale(1.5) ;
     z-index: 99;
 }
 :global(.comuna:hover path) {
     fill: darkgreen;
 }

 .cluster:hover .barrios {
     display: block;
 }
 .selected path:hover {
     transform: none!important;
 }

</style>
