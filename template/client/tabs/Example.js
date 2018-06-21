import React from "react";
import {
  withSources,
  JSONCard
} from "seasketch-report-client";

const ExampleTab = ({ results, sketch, sketchClass }) => (
  <React.Fragment>
    <JSONCard title="Attributes" json={sketch.properties} />
    {
      Object.keys(results).map((functionName) => (
        <JSONCard title={functionName} json={results[functionName]} />
      ))
    }
  </React.Fragment>
);

export default withSources([
  // function name (e.g. MyProject-geoprocessing-area)
  // you should usually name these explicitly, but can also use * for all
  "*"
])(ExampleTab);
