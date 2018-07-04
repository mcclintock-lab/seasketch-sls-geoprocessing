import React from "react";
import {
  asReportTab,
  JSONCard,
  Card
} from "seasketch-report-client";

const ExampleTab = ({ results, sketch }) => (
  <React.Fragment>
    <JSONCard title="Attributes" json={sketch.properties} />
    {
      Object.keys(results).map((functionName) => (
        <JSONCard title={functionName} json={results[functionName]} />
      ))
    }
  </React.Fragment>
);

export default asReportTab({
  sources: ["$template-geoprocessing-$functionName"],
  title: "Zone Area"
})(ExampleTab);
