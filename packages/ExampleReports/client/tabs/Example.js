import React from "react";
import {
  asReportTab,
  JSONCard,
  Card,
  useTMSLayer
} from "@seasketch-sls-geoprocessing/client";
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const ExampleTab = ({ results, sketch }) => {
  const layerUrl = `${window.location.protocol}//s3-us-west-2.amazonaws.com/seasketchreportingcore-production-reportoutputs-m4w0dilgdwtf/DOCZonation/zonation/df3b5227-1baf-498c-a14e-b7ada108afa7/TSBasic/{z}/{x}/{y}.png`;
  const [layerToggled, toggleLayer, layerLoading] = useTMSLayer(layerUrl);
  return (
    <React.Fragment>
      <JSONCard title="Attributes" json={sketch.properties} />
      <Card title="Layers">
      <FormControlLabel
        control={
          <Checkbox
            checked={layerToggled}
            onChange={toggleLayer}
          />
        }
        label="TSBasic"
      />
      </Card>
      {
        Object.keys(results).map((functionName) => (
          <JSONCard key={functionName} title={functionName} json={results[functionName]} />
        ))
      }
    </React.Fragment>
  );
};

export default asReportTab({
  sources: ["ExampleReports-geoprocessing-area"],
  title: "Zone Area"
})(ExampleTab);
