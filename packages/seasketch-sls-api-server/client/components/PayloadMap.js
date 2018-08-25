import React from 'react';
import mapboxgl from 'mapbox-gl';
import { withStyles } from '@material-ui/core/styles';
import bbox from '@turf/bbox';

mapboxgl.accessToken = 'pk.eyJ1IjoidW5kZXJibHVld2F0ZXJzIiwiYSI6IjMzZ215RTQifQ.u6Gb_-kNfvaxiHdd9eJEEA';

const styles = theme => ({
  map: {
    height: 278,
    width: 'calc(100% + 2px)'
  }
});

class PayloadMap extends React.Component {

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: 'payloadmap',
      style: 'mapbox://styles/mapbox/streets-v9',
      scrollZoom: false
    });
    this.map.on('load', () => {
      if (this.props.url) {
        this.fetchGeoJSON(this.props.url);
      }
    });
  }

  fetchGeoJSON(url) {
    fetch(url).then((response) => {
      return response.json();
    }).then((feature) => {
      this.showGeoJSON(feature);
      const bounds = bbox(feature);
      this.map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
        padding: {top: 100, bottom:100, left: 100, right: 100},
        duration: 500
      });
    });
  }

  componentDidUpdate(oldProps) {
    if (this.props.url !== oldProps.url) {
      this.fetchGeoJSON(this.props.url);
    }
  }

  showGeoJSON(feature) {
    const source = this.map.getSource("example");
    if (source) {
      source.setData(feature);
    } else {
      this.map.addLayer({
        'id': 'example',
        'type': 'fill',
        'source': {
          'type': 'geojson',
          'data': feature
        },
        'layout': {},
        'paint': {
          'fill-color': '#088',
          'fill-opacity': 0.8
        }
      });  
    }
  }

  render() {
    const { classes } = this.props;
    return <div id="payloadmap" className={classes.map} />
  }
}

export default withStyles(styles)(PayloadMap);