import { BufferAttribute, BufferGeometry, Color, Mesh, MeshLambertMaterial } from 'three';
import type { ElevationGrid, LocalFrame } from 'alebrije/geo';

const LOW = new Color('#7fa86a');
const HIGH = new Color('#b08a5a');

export const buildRelieve = (grid: ElevationGrid, frame: LocalFrame): Mesh => {
    const { width, height, extent } = grid;
    const [west, south, east, north] = extent;
    const positions = new Float32Array(width * height * 3);
    const colors = new Float32Array(width * height * 3);
    const finite = Array.from(grid.values).filter(Number.isFinite);
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const color = new Color();
    for (let row = 0; row < height; row += 1) {
        for (let column = 0; column < width; column += 1) {
            const i = row * width + column;
            const value = grid.values[i] ?? min;
            const lon = west + ((column + 0.5) / width) * (east - west);
            const lat = north - ((row + 0.5) / height) * (north - south);
            positions.set(frame.toLocal([lon, lat], (Number.isFinite(value) ? value : min) - 0.05), i * 3);
            color.lerpColors(LOW, HIGH, max > min ? (value - min) / (max - min) : 0);
            colors.set([color.r, color.g, color.b], i * 3);
        }
    }
    const index: number[] = [];
    for (let row = 0; row < height - 1; row += 1) {
        for (let column = 0; column < width - 1; column += 1) {
            const a = row * width + column;
            index.push(a, a + width, a + 1, a + 1, a + width, a + width + 1);
        }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    const material = new MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.78 });
    const mesh = new Mesh(geometry, material);
    mesh.name = 'relieve';
    return mesh;
};
