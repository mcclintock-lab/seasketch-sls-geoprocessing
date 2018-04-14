# seasketch-sls-geoprocessing
Serverless geoprocessing platform for SeaSketch

# Usage

```
sls create --name MyReports --template-url https://github.com/mcclintock-lab/seasketch-sls-geoprocessing/tree/master/template
cd MyReports
npm install
sls add_function -n area
# modify functions/area/index.js as needed to implement the geoprocessing function
sls invoke local -f area -p functions/area/examples/sketch.json
```
