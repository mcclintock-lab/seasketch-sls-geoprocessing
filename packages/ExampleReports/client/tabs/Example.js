import React from "react";
import {
  asReportTab,
  JSONCard,
  Card
} from "@seasketch-sls-geoprocessing/client";

const ExampleTab = ({ results, sketch }) => (
  <React.Fragment>
    <JSONCard title="Attributes" json={sketch.properties} />
    {
      Object.keys(results).map((functionName) => (
        <JSONCard key={functionName} title={functionName} json={results[functionName]} />
      ))
    }
  </React.Fragment>
);

export default asReportTab({
  sources: ["ExampleReports-geoprocessing-area"],
  title: "Zone Area"
})(ExampleTab);
