import { LASExporter } from "../exporter/LASExporter.js";
import { Points } from "../Points.js";

export class VolumeFilterExportTool {

    constructor(viewer) {
        this.viewer = viewer;
        this.exportLasURL = null;
        this.exportCsvURL = null;
    }

    exportLas() {
        const points = this.getVolumePoints();
        let buffer = LASExporter.toLAS(points);

        let blob = new Blob([buffer], { type: "application/octet-stream" });
        let url = URL.createObjectURL(blob);
        this.exportLasURL = url;
    }

    exportCsv() {
        // TODO: Implement CSV export
    }

    getVolumePoints() {
        const volumes = this.viewer.scene.volumes;

        const pointCloud = this.viewer.scene.pointclouds[0];

        // TODO: selectable points in volume or out volume by parameter
        const pointNodes = pointCloud.visibleNodes.map((node, _) => {
            return node.getPointsOutBox(volumes);
        });

        const flatPositions = pointNodes.map(node => node.positions).flat();
        const flatColors = pointNodes.map(node => node.colors).flat();

        let tempAttributes = {};
        pointNodes.forEach(node => {
            for (let attributeName in node.attributes) {
                if (!tempAttributes[attributeName]) {
                    tempAttributes[attributeName] = [];
                }
                tempAttributes[attributeName].push(...node.attributes[attributeName]);
            }
        });

        let points = new Points();
        points.boundingBox = pointCloud.boundingBox;
        points.numPoints = flatPositions.length / 3; // 3 because xyz
        points.data["position"] = new Float64Array(flatPositions);

        if (flatColors.length > 0) {
            points.data["rgba"] = new Uint8Array(flatColors);
        }

        for (let attributeName in tempAttributes) {
            points.data[attributeName] = tempAttributes[attributeName];
        }

        return points;
    }

    revokeExportURLs() {
        if (this.exportLasURL) {
            URL.revokeObjectURL(this.exportLasURL);
            this.exportLasURL = null;
        }
        if (this.exportCsvURL) {
            URL.revokeObjectURL(this.exportCsvURL);
            this.exportCsvURL = null;
        }
    }
}
