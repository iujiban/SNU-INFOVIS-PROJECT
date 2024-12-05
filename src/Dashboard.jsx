// React
import React, { useState, useMemo } from 'react';

// Data
import data from './data';

// Components
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Prevalence from './components/Prevalence';
import Seizure from './components/Seizure';
import Price from './components/Price';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

// Seizure data
export const seizureData = [
    { group: "2018", Opioid: 20, Benzo: 15, NonOpioid: 10 },
    { group: "2019", Opioid: 25, Benzo: 18, NonOpioid: 12 },
    { group: "2020", Opioid: 22, Benzo: 20, NonOpioid: 15 },
    { group: "2021", Opioid: 30, Benzo: 22, NonOpioid: 18 },
    { group: "2022", Opioid: 28, Benzo: 25, NonOpioid: 20 }
];

// Sample data for prevalence and price charts
export const prevalenceData1 = [
    { label: "Category A", value: 30 },
    { label: "Category B", value: 45 },
    { label: "Category C", value: 25 }
];

export const prevalenceData2 = [
    { label: "Type X", value: 40 },
    { label: "Type Y", value: 35 },
    { label: "Type Z", value: 25 }
];

export const priceData = [
    { date: "2023-01-01", price: 100 },
    { date: "2023-02-01", price: 120 },
    { date: "2023-03-01", price: 115 },
    { date: "2023-04-01", price: 140 },
    { date: "2023-05-01", price: 135 },
    { date: "2023-06-01", price: 160 }
];

const Dashboard = () => {
    // React Hook을 사용해 상태 관리
    const [selectedUser, setSelectedUser] = useState(data[0]);
    const [greaterThenAge, setGreaterThenAge] = useState(0);
    const [includedGender, setIncludedGender] = useState(['Male', 'Female', 'Unknown']);

    // 필터링된 데이터를 계산
    const filteredData = useMemo(() => {
        return data
            .filter(user => includedGender.includes(user.gender))
            .filter(user => user.age > greaterThenAge);
    }, [includedGender, greaterThenAge]);

    // UI 렌더링
    return (
        <div className='container-fluid'>
            {/* Navbar */}
            <div className='row'>
                <nav class="navbar bg-body-tertiary">
                    <div class="container-fluid">
                        <span class="navbar-brand mb-0 h1">Global Drug Use Dashboard</span>
                    </div>
                </nav>
            </div>
            <div className='row' style={{ height: 'calc(100vh - 150px)' }}>
                {/* Sidebar */}
                <div className='col-3 p-2 d-flex flex-column' style={{ height: '100%' }}>
                    <Sidebar />
                </div>
                {/* Main Content */}
                <div className='col-9 p-2 d-flex flex-column' style={{ height: '100%' }}>
                    <div className='row flex-grow-1' style={{ flex: 1 }}>
                        {/* Map */}
                        <div className='col-6 p-2 h-100'>
                            <Map />
                        </div>
                        {/* Prevalence */}
                        <div className='col-6 p-2 h-100'>
                            <Prevalence data1={prevalenceData1} data2={prevalenceData2} />
                        </div>
                    </div>
                    <div className='row flex-grow-1' style={{ flex: 1 }}>
                        {/* Seizure */}
                        <div className='col-6 p-2 h-100'>
                            <Seizure data={seizureData} />
                        </div>
                        {/* Price */}
                        <div className='col-6 p-2 h-100'>
                            <Price data={priceData} />
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className='row'>
                <footer class="py-3 my-4">
                    <p class="text-center text-body-secondary"> 2024 Jihoon Ban, Jaeseon Lee, Jaeyong Lee, Seohee Kim</p>
                    <p class="text-center text-body-secondary">
                        Source code: <a href="https://github.com/iujiban/SNU-INFOVIS-PROJECT">Github</a>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;