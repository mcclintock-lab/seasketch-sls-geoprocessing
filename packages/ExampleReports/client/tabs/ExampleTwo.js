import React from "react";
import {
  asReportTab,
  JSONCard,
  Card
} from "@seasketch-sls-geoprocessing/client";
import geojson2svg, { Renderer } from 'geojson-to-svg';

const ExampleTwo = ({ results, sketch }) => (
  <React.Fragment>
    <Card title="Triangulated Irregular Network">
      <div style={{width: "50%", margin: '20px auto'}} dangerouslySetInnerHTML={{__html: geojson2svg().styles(() => ({weight: 0.001, stroke: 'black'})).data(results["ExampleReports-geoprocessing-tin"].results).render()}} />
    </Card>
  </React.Fragment>
);

export default asReportTab({
  sources: ["ExampleReports-geoprocessing-tin"],
  title: "TIN"
})(ExampleTwo);
