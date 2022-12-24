import './Map.css';

import * as d3 from "d3";
import { tile } from 'd3-tile';
import * as topojson from 'topojson-client';
import { topoJSON } from 'topojson-client';

import { URLs } from './map_utils.ts';

const projection = d3.geoMercator();
const path = d3.geoPath(projection);

const url = URLs["Stamen Toner"];
type TileCoords = { x: number, y: number, z: number, tx: number, ty: number, k: number }

function Map({ width, height }: { width: number, height: number }) {
    Promise.all([
        d3.json('./data/comunas.topo'),
        d3.json('./data/barrios.topo')
    ]).then(([comunas, barrios]: [topoJSON, topoJSON]) => {
        const t = tile()
            .size([600, 600])
            .scale(projection.scale() * 2 * Math.PI)
            .translate(projection([0, 0]));

        const topo = {
            comunas: topojson.feature(comunas, comunas.objects.comunas),
            barrios: topojson.feature(barrios, barrios.objects.barrios),
            mesh: topojson.mesh(comunas, comunas.objects.comunas,
                (a, b) => a === b)
        }
        projection.fitExtent([[0, 0], [600, 600]], topo.comunas)
        t.scale(projection.scale() * 2 * Math.PI)
            .translate(projection([0, 0]))
        const svg = d3.select('#svg');
        svg.selectAll('*').remove();
        svg.append('defs').append('g').attr('id', 'tiles')
            .selectAll('.tile')
            .data(t().map(([x, y, z]: number[],
                _i: number,
                { translate: [tx, ty], scale: k }: { translate: number[], scale: number }
            ) => ({ x, y, z, tx, ty, k })))
            .join('image')
            .attr('class', 'tile')
            .attr('xlink:href', ({ x, y, z }) => url(x, y, z))
            .attr('x', ({ x, tx, k }) => Math.round((x + tx) * k))
            .attr('y', ({ y, ty, k }) => Math.round((y + ty) * k))
            .attr('width', ({ k }) => k)
            .attr('height', ({ k }) => k)

        const cprop = (d: topoJSON) => `comuna${d.properties.ID}`;
        svg.append('g').attr('class', 'comunas')
            .selectAll('.comuna')
            .data(topo.comunas.features, d => d.properties.COMUNAS)
            .join(
                enter => {
                    const g = enter.append('g')
                        .attr('class', 'comuna')
                        .attr('id', (d: topoJSON) => d.properties.COMUNAS)
                        .on("mouseover", function() {
                            svg.selectAll('.comuna')
                                .classed('raised', false)
                            const sel = d3.select(this)
                            sel.raise()
                                .classed('raised', true)
                        })

                    g.append('path').attr('d', path);
                    const clipPath = g.append('clipPath').attr('id', cprop)
                    clipPath.append('path').attr('d', path);

                    const barrios = g.append('g').attr('class', 'barrios')
                    barrios.append('use').attr('xlink:href', '#tiles').attr('clip-path', d => `url(#${cprop(d)})`)
                    barrios.selectAll('.barrio')
                        .data((d: topoJSON) => topo.barrios.features
                            .filter((f: topoJSON) => f.properties.COMUNA === d.properties.COMUNAS),
                            (d: topoJSON) => d.properties.BARRIO)
                        .join('path')
                        .attr('class', 'barrio')
                        .attr('fill', 'transparent')
                        .attr('id', (d: topoJSON) => d.properties.BARRIO)
                        .attr('d', path)
                    return g;
                }
            )
    })
    return (<svg id="svg" className="map" width={width} height={height}></svg>)
}

export default Map;
