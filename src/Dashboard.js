import React, { useState, useMemo } from 'react';
import { Layout } from 'antd';
import Menu from './views/Menu';
import View2 from './views/View2';
import View3 from './views/View3';
import View4 from './views/View4';
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
            <Layout style={{ height: 1000 }}>
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
                    <Content style={{ height: 300 }}>
                        <View4 user={selectedUser} />
                    </Content>
                    <Layout style={{ height: 600 }}>
                        <Content>
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
                        <a href="https://github.com/sdq/react-d3-dashboard">
                            https://github.com/sdq/react-d3-dashboard
                        </a>
                        ; Author <a href="https://sdq.ai">sdq</a>;
                    </div>
                </Footer>
            </Layout>
        </div>
    );
};

export default Dashboard;
