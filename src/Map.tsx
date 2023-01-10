import './Map.css';
import { useRef, useState, useEffect } from 'react';

import * as d3 from "d3";
import { tile, tileWrap } from 'd3-tile';
import * as topojson from 'topojson-client';
import { topoJSON } from 'topojson-client';

import { URLs } from './map_utils.ts';

const projection = d3.geoMercator();
const path = d3.geoPath(projection);

const url = URLs["Stamen Toner"];
type TileCoords = { x: number, y: number, z: number, tx: number, ty: number, k: number }

function Map({ width, height }: { width: number, height: number }) {
    const svgRef = useRef(null);
    const [data, setData] = useState<topoJSON[2]>([]);

    Promise.all([
        d3.json('./data/comunas.topo'),
        d3.json('./data/barrios.topo')
    ]).then(setData)

    useEffect(() => {
        const [comunas, barrios] = data;
        if (!(comunas && barrios)) return;

        const topo = {
            comunas: topojson.feature(comunas, comunas.objects.comunas),
            barrios: topojson.feature(barrios, barrios.objects.barrios),
        }

        projection.fitSize([width, height], topo.comunas)

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        let images = svg.append('defs').append('g').attr('id', 'tiles')
        const runTiles = () => {
            const tiler = tile()
                .size([width, height])
                .scale(projection.scale() * 2 * Math.PI)
                .translate(projection([0, 0]))

            let tiles = tiler();
            const { translate: [tx, ty], scale: k } = tiles;
            images
            .selectAll('.tile')
                .data(tiles, d => d)
            .join('image')
            .attr('class', 'tile')
                .attr('xlink:href', (d) => url(...tileWrap(d)))
                .attr('x', ([x]) => Math.round((x + tx) * k))
                .attr('y', ([, y]) => Math.round((y + ty) * k))
                .attr('width', k)
                .attr('height', k)
            return tiles
        }
        runTiles();
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
    }, [svgRef.current])
    return (<svg className="map" width={width} height={height} ref={svgRef}></svg>)
}

export default Map;
