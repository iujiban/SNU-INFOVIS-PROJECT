import React, { Component } from 'react';
import BarChart from '../../charts/BarChart';
import './view6.css';

export default class View6 extends Component {
    render() {
        const {data} = this.props;
        return (
            <div id='view6' className='pane'>
                <div className='header'>Age</div>
                <div>
                <BarChart data={data} width={900} height={480}/>
                </div>                
            </div>
        )
    }
}