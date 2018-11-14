import React from "react";

import DrawingServer from "./DrawingServer";
import generatePathSegments from "./generate-paths";

import "./App.css";

export default class DrawingApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      points: [],
      confirmedPoints: [],
      justStarted: false,
      server: new DrawingServer(),
      refreshInterval: null,
    };

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.reset = this.reset.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  componentDidMount() {
    this.setState({
      refreshInterval: window.setInterval(this.refresh, 33),
    });
  }
  componentWillUnmount() {
    if (this.state.refreshInterval) {
      window.clearInterval(this.state.refreshInterval);
    }
  }

  onMouseDown(ev) {
    this.setState({ dragging: true, justStarted: true });
  }

  onMouseUp(ev) {
    this.setState({ dragging: false });
  }

  onMouseMove(ev) {
    if (this.state.dragging) {
      // We will build an array of exactly one or two points to add to our overall line data
      const newPoints = [];

      const lastPoint = this.state.points[this.state.points.length - 1];

      // If this point is the start of a new segment, create an "end segment" point
      // at the position of the previous point
      if (this.state.justStarted && this.state.points.length > 0) {
        newPoints.push(Object.assign({}, lastPoint, { isEndOfSegment: true }));
      }

      // Append a new point to the array
      const newPoint = {
        x: ev.nativeEvent.offsetX,
        y: ev.nativeEvent.offsetY,
        isStartOfSegment: this.state.justStarted,
        isEndOfSegment: false,
      };

      newPoints.push(newPoint);

      this.setState({
        points: this.state.points.concat(newPoints),
        justStarted: false,
      });

      // And send to the "remote" server
      this.state.server
        .addPoints(newPoints)
        .then(response => {
          // Success
        })
        .catch(error => {
          // Failure
        });
    }
  }

  reset() {
    this.setState({ points: [] });
    this.state.server.reset();
  }

  refresh() {
    this.state.server
      .getPoints()
      .then(response => {
        this.setState({ confirmedPoints: response });
      })
      .catch(error => {
        console.warn(error);
      });
  }

  render() {
    return (
      <div className="DrawingApp">
        <svg
          width="100%"
          height="100%"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseMove={this.onMouseMove}
        >
          {generatePathSegments(this.state.points, "sent")}
          {generatePathSegments(this.state.confirmedPoints, "confirmed")}
        </svg>
        <div className="reset">
          <button onClick={this.reset}>Reset</button>
        </div>
      </div>
    );
  }
}
