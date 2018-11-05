import React from 'react';
import mapboxgl from 'mapbox-gl';
import {withStyles} from '@material-ui/core/styles';
import Card, { CardHeader, CardMedia, CardContent, CardActions } from '@material-ui/core/Card';
import MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';
import centroid from '@turf/centroid';

mapboxgl.accessToken = 'pk.eyJ1IjoidW5kZXJibHVld2F0ZXJzIiwiYSI6IjMzZ215RTQifQ.u6Gb_-kNfvaxiHdd9eJEEA';

const styles = {
  map: {
    width: '95%',
    height: '95%',
    margin: 10,
    textAlign: 'left'
  },
  mapCard: {
    height: 500,
    margin: 10
  },
  root: {
    width: '100vw',
    height: 'calc(100vh - 64px)',
    flex: 1
  }
}

class MapInput extends React.Component {

  componentDidMount = () => {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: this.props.initialCenter,
      zoom: this.props.initialZoom
    });
    if (this.props.mapRef) {
      this.props.mapRef(this.map);
    }
    this.Draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        point: true,
        line_string: true
      }
    });
    this.map.on('load', () => {
      if (this.props.example) {
        this.showExample(this.props.example);
        const center = centroid(this.props.example).geometry.coordinates;
        this.map.panTo(center);
      }
      this.mapLoaded = true;
      this.map.addControl(this.Draw, 'top-left');
      this.map.on('draw.create', (e) => {
        if (this.props.onInput) {
          this.props.onInput(e.features[0]);
        }
      });
      this.map.on('draw.modechange', (e) => {
        if (this.props.onDrawModeChange) {
          this.props.onDrawModeChange(e);
        }
      });
    });
  }

  componentDidUpdate(oldProps) {
    if (this.mapLoaded) {
      if (this.props.example !== oldProps.example) {
        if (this.props.example) {
          this.showExample(this.props.example);
          const center = centroid(this.props.example).geometry.coordinates;
          this.map.panTo(center);  
        } else {
          this.map.removeLayer("example");
          this.map.removeSource("example");
        }
      }  
    }
  }

  showExample(example) {
    const source = this.map.getSource("example");
    if (source) {
      source.setData(example);
    } else {
      this.map.addLayer({
        'id': 'example',
        'type': 'fill',
        'source': {
          'type': 'geojson',
          'data': example
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
    const {classes} = this.props;
    return (
      <div className={classes.root} id="map" />
    )
  }

}

export default withStyles(styles)(MapInput);
