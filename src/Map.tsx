import { useEffect, useRef, useState } from 'react';
import './Map.css';

import * as d3 from "d3";
import { tile, tileWrap } from 'd3-tile';
import * as topojson from 'topojson-client';
import { topoJSON } from 'topojson-client';

import { URLs } from './map_utils.ts';

const projection = d3.geoMercator();
const path = d3.geoPath(projection);

const url = URLs["Stamen Toner"];

const cid = (d: topoJSON) => `comuna-${d.properties.COMUNAS}`;
const clipPathProp = (d: topoJSON) => `comuna-${cid(d)}-clip-path`

const runTiles = (images, width, height) => {
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

function Map({ width, height }: { width: number, height: number }) {
    const svgRef = useRef(null);
    const [data, setData] = useState<topoJSON[2]>([]);

    useEffect(() => {
    Promise.all([
        d3.json('./data/comunas.topo'),
        d3.json('./data/barrios.topo')
    ]).then(setData)
    }, [])

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
        runTiles(images, width, height);

        const clearSelection = (selection: d3.Selection<d3.BaseType, unknown, null, unknown>) => {
            selection.classed('raised', false)
                .classed('selected', false)
                .attr('transform', null)
        }


        function onMouseOver(e, d) {
            const sel = d3.select(this)
            if (sel.classed('raised')) {
                return
            }
            svg.selectAll('.comuna')
                .call(clearSelection)
                .selectAll('*').interrupt();

            sel.raise()
                .classed('raised', true)
        }
        function onClick(_, d) {
            const [[l, t], [r, b]] = path.bounds(d);
            const w = r - l;
            const h = b - t;

            const tr = d3.transition()
                .duration(750)
                .ease(d3.easeLinear)

            svg.select(`#${cid(d)}-group`)
                .classed('selected', true)
                .transition(tr)
                .attr('transform', `scale(${Math.round(width / (w * 1.3))}) translate(${-l} ${-t})`)
        }

        const map = svg.append('g').attr('class', 'comunas')
        map
            .selectAll('.comuna')
            .data(topo.comunas.features, d => d.properties.COMUNAS)
            .join(
                enter => {
                    const g = enter.append('g')
                        .attr('class', 'comuna')
                        .attr('id', (d: topoJSON) => `${cid(d)}-group`)
                        .on("mouseover", onMouseOver)
                        .on("click", onClick)

                    g.append('path').attr('d', path);
                    const clipPath = g.append('clipPath').attr('id', clipPathProp)
                    clipPath.append('path').attr('d', path);

                    g.append('text').text(d => d.properties.COMUNAS)
                        .attr('class', 'comuna-text')
                        .attr('x', d => path.centroid(d)[0])
                        .attr('y', d => path.centroid(d)[1])
                        .attr("text-anchor", "middle")
                        .style("font-size", 12)

                    const barrios = g.append('g').attr('class', 'barrios')

                    barrios.append('use')
                        .attr('xlink:href', '#tiles')
                        .attr('clip-path', d => `url(#${clipPathProp(d)})`)

                    const calcFontSize = (path) => d => {
                        const [[l, b], [r, t]] = path.bounds(d);
                        const sz = d.properties.BARRIO.split(' ').reduce((a, c) => Math.max(a, c.length), 0)
                        const s = Math.round((r - l) / (sz))
                        return `${s}px`
                    }

                    barrios.selectAll('.barrio')
                        .attr('pointer-events', 'none')
                        .data((d: topoJSON) => topo.barrios.features
                            .filter((f: topoJSON) => f.properties.COMUNA === d.properties.COMUNAS),
                            (d: topoJSON) => d)
                        .join((enter: d3.Selection<SVGElement>) => {
                            const g = enter.append('g')
                        .attr('class', 'barrio')
                        .attr('fill', 'transparent')
                            g.append('path')
                        .attr('id', (d: topoJSON) => d.properties.BARRIO)
                        .attr('d', path)

                            g.append('text')
                                .attr('x', d => path.centroid(d)[0])
                                .attr('y', d => path.centroid(d)[1])
                                .attr("fill", "black")
                                .attr("text-anchor", "middle")
                                .style("font-size", calcFontSize(path))
                                .selectAll('tspan')
                                .data(d => d.properties.BARRIO.split(' '))
                                .join('tspan')
                                .text(d => d)
                                .attr('x', (d, _i, e) => e[0].parentElement.getAttribute('x'))
                                .attr('y', (d, i, e) => e[0].parentElement.getAttribute('y') - (e.length - i) * 8)
                                .attr('dy', '20px')
                        })
                    return g;
                }
            )
    }, [svgRef.current])
    return (<svg className="map" width={width} height={height} ref={svgRef}></svg>)
}

export default Map;
