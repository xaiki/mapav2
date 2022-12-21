<script lang="ts">
 import { geoPath, geoMercator, select} from "d3";
 import {tile} from 'd3-tile';
 import * as topojson from 'topojson-client';
 export let topo;
 let selected = null;

 import { draw } from "svelte/transition";
 import { quadInOut } from "svelte/easing";
 const access_token ="pk.eyJ1Ijoic2VydWdlbmVyaXMiLCJhIjoiY2w3dzB4aHZyMDh1ZDN2cXRiZ3M2emh5OCJ9.w5ChPmWEjwfdL5Zbglcrmg";
 const tileset="mapbox.mapbox-streets-v8";

 const projection = geoMercator();
 const path = geoPath(projection);
 let geo = {comunas: {features: []}, barrios: {features: []}};
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
 const t = tile()
     .size([600, 600])
     .scale(projection.scale() * 2 * Math.PI)
     .translate(projection([0, 0]));

 $: {
     if (topo && topo.comunas && topo.barrios) {
         console.error(topo)
         geo.comunas = topojson.feature(topo.comunas, topo.comunas.objects.comunas)
         geo.barrios = topojson.feature(topo.barrios, topo.barrios.objects.barrios)
         geo.comunas.mesh = topojson.mesh(topo.comunas, topo.comunas.objects.comunas, (a,b) => a===b)
         console.error()
         projection.fitExtent([[0,0], [600,600]], geo.comunas )
         t.scale(projection.scale() * 2 * Math.PI)
                       .translate(projection([0, 0]))
     }
 }
</script>

<g>
    <g class="map" class:selection={selected}>
        <g class="contour">
            <path d={path(geo.comunas.mesh)}/>
        </g>
        {#each geo.comunas.features as c}
            {#if selected !== c}
                <g
                    class="cluster"
                    key={c.properties.COMUNAS}
                    id={c.properties.COMUNAS}>
                    <g class="barrios">
                        {#each geo.barrios.features as b}
                            {#if b.properties.COMUNA === c.properties.COMUNAS}
                                <path
                                    class="barrio"
                                    key={b.properties.ID}
                                    id={b.properties.ID}
                                    transition:draw={{ duration: 1000, delay: 0, easing: quadInOut }}
                                    d={path(b)}
                                />
                            {/if}
                        {/each}
                    </g>
                    <path
                        class="comuna"
                        transition:draw={{ duration: 1000, delay: 0, easing: quadInOut }}
                        on:click={() => {selected = selected === c ? undefined:c}}
                        on:keydown={() => {selected = selected === c ? undefined:c}}
                        on:mouseenter={({target}) => select(target).raise()}
                        d={path(c)}
                    />
                </g>

            {/if}
        {/each}
    </g>

    {#if selected}
        <clipPath id={selected.properties.ID}>
            <path d={path(selected)}/>
        </clipPath>
        <g  class="selected" clip-path="url({location}#{selected.properties.ID})">
            <path
                transition:draw={{ duration: 1000, delay: 0, easing: quadInOut }}
                on:click={() => {selected = undefined}}
                d={path(selected)}
            />
            {#each t().map(([x, y, z], i, {translate: [tx, ty], scale: k}) => [x,y,z,i,tx,ty,k]) as [x,y,z,i,tx,ty,k]}
                <image xlink:href={url(x, y, z)} x={(x + tx) * k - 0.5} y={(y + ty) * k - 0.5} width={k + 1} height={k + 1} />
                <image xlink:href={url(x, y, z)} x={(x + tx) * k} y={(y + ty) * k} width={k} height={k} />
            {/each}
        </g>
    {/if}
</g>        
<style>
 .map {
     transition: all 200ms;
 }
 .map.selection {
     transform: rotateX(45deg);
 }
 path {
     fill: white;
     stroke: black;
     transition: all 200ms;
     transform-origin: center;
     transform-box: fill-box;

 }
 .barrio {
     stroke: yellow;
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

 g {
     transform-box: fill-box;
     transform-origin: center;
 }
 .selected {
     fill: darkred!important;
     transform: scale(4);
     transform-origin: center;
     transform-box: fill-box;
 }

 .cluster:hover {
     fill: darkgreen;
     transform: scale(1.5) ;
     z-index: 99;
 }
 .cluster:hover .barrios {
     display: block;
 }
 .selected path:hover {
     transform: none!important;
 }

</style>
