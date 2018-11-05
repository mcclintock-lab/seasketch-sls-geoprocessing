import React from 'react';
import mapboxgl from 'mapbox-gl';
import { withStyles } from '@material-ui/core';
import { ReduxMapControl } from '@mapbox/mapbox-gl-redux'
import { store } from '../store';
import { connect } from 'react-redux'
import centroid from '@turf/centroid';

mapboxgl.accessToken = 'pk.eyJ1IjoidW5kZXJibHVld2F0ZXJzIiwiYSI6IjMzZ215RTQifQ.u6Gb_-kNfvaxiHdd9eJEEA';

const styles = theme => ({
  map: {
    height: '100%',
    flex: 1
  }
});

class Map extends React.Component {

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      zoom: this.props.zoom,
      center: this.props.center
    });
    if (this.props.mapRef) {
      this.props.mapRef(this.map);
    }
    const reduxControl = new ReduxMapControl('map');
    this.reduxControl = reduxControl;
    this.map.addControl(reduxControl)
    this.map.on('load', () => {
      store.dispatch(reduxControl.MapActionCreators.sync())
      if (this.props.example) {
        this.showExample(this.props.example);
      }
    });
  }

  componentDidUpdate(oldProps) {
    if (this.props.example !== oldProps.example) {
      this.showExample(this.props.example);
      const center = centroid(this.props.example.feature).geometry.coordinates;
      store.dispatch(this.reduxControl.MapActionCreators.panTo(center));
    }
  }

  showExample(example) {
    const source = this.map.getSource("example");
    if (source) {
      source.setData(example.feature);
    } else {
      this.map.addLayer({
        'id': 'example',
        'type': 'fill',
        'source': {
          'type': 'geojson',
          'data': example.feature
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
    return <div id="map" className={classes.map} />
  }
}

const mapStateToProps = (state, ownProps) => ({
  zoom: state.map.zoom,
  center: state.map.center
});

export default connect(mapStateToProps)(withStyles(styles)(Map));