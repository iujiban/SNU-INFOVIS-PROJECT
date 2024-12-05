import React, { Component } from 'react';
import './view4.css';
import LineChart from '../../charts/LineChart';

export default class MapChart extends Component {
    render() {
        const {user} = this.props,
              width = 1250,
              height = 450;
        return (
            <div id='view4' className='pane' >
                <div className='header'>Map Chart</div>
                <div>
                    <LineChart data={user} width={width} height={height}/>
                </div>
            </div>
        )
    }
}