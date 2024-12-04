import React, { useState, useMemo } from 'react';
import { Layout } from 'antd';
import Menu from './views/Menu';
import MapChart from './views/MapChart';
import View2 from './views/View2';
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
                        width : 1200,
                        padding : 10,  
                        display: 'flex',
                        alignItems: 'flex-start', }}>
                        <MapChart user={selectedUser} />
                        <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                        <div style={{ flex: 1, paddingRight: 10 }}>
                            <MapChart user={selectedUser} />
                        </div>
                        <div style={{ flex: 1, paddingLeft: 10 }}>
                            <PieChart data={filteredData} />
                        </div>
                    </div>
                    </Content>
                    <Content>
                        <View2 data={filteredData}/>
                    </Content>
                    <Layout style={{ height: 545 }}>
                        <Content style ={{
                            height:600,
                            width: 600,
                            padding: 10,
                            display: 'flex',
                            alignItems: 'flex-start',
                        }}>
                            <View5 data={filteredData} />
                        </Content>
                        <Sider width={300} style={{ backgroundColor: '#eee' }}>
                            <View6 data={filteredData} changeSelectUser={setSelectedUser} />
                        </Sider>
                    </Layout>
                </Layout>
            </Layout>

            {/* 푸터 */}
            <Layout>
                <Footer style={{ height: 20 }}>
                    <div style={{ marginTop: -10 }}>
                        Source Code{' '}
                        <a href="https://github.com/iujiban/SNU-INFOVIS-PROJECT/tree/main/src">
                        https://github.com/iujiban/SNU-INFOVIS-PROJECT/tree/main/src
                        </a>
                        ; Author: JihoonBan, Jaeseon Lee, JaeYongLee, SeoheeKim;
                    </div>
                </Footer>
            </Layout>
        </div>
    );
};

export default Dashboard;
