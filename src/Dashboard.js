import React, { useState, useMemo } from 'react';
import { Layout } from 'antd';
import Menu from './views/Menu';
import MapChart from './views/MapChart';
import PieChart from './views/PieChart'
import View5 from './views/View5';
import View6 from './views/View6';
import data from './data';
import './dashboard.css';

const { Sider, Content, Footer } = Layout;

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
        <div>
            <Layout style={{ height: 1010 }}>
                {/* 좌측 메뉴 영역 */}
                <Sider width={200} style={{ backgroundColor: '#eee' }}>
                    <Content
                        style={{
                            height: 1000,
                            paddingTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Menu user={selectedUser} />
                    </Content>
                </Sider>
                
                {/* 메인 콘텐츠 영역 */}
                <Layout>
                    <Content style={{ 
                        height: 800, 
                        width : 1500,
                        padding : 20,
                        paddingTop : 3,  
                        display: 'flex',
                        alignItems: 'flex-start', }}>
                        <MapChart user={selectedUser} />
                    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                        <div style={{ flex: 1, paddingLeft: 5, width: 600, height: 800, }}>
                            <PieChart data={filteredData} />
                        </div>
                    </div>
                    </Content>
                    <Layout style={{ height: 900, padding: 5 }}>
                        <Content style ={{
                            height:400,
                            width: 600,
                            paddingLeft: 12,
                            paddingTop: 0,
                            display: 'flex',
                            alignItems: 'flex-start',
                        }}>
                            <View5 data={filteredData} />
                    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                        <div style={{ flex: 1, paddingLeft: 5, width: 600, height: 800, }}>
                                <View6 data={filteredData} changeSelectUser={setSelectedUser} />
                            </div>
                        </div>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>

            {/* 푸터 */}
            <Layout>
                <Footer style={{ height: 20 }}>
                    <div style={{ marginTop: -10 }}>
                        Source Code{' '}
                        <a href="https://github.com/iujiban/SNU-INFOVIS-PROJECT">
                        https://github.com/iujiban/SNU-INFOVIS-PROJECT
                        </a>
                        ; Author: JihoonBan, Jaeseon Lee, JaeYongLee, SeoheeKim;
                    </div>
                </Footer>
            </Layout>
        </div>
    );
};

export default Dashboard;
