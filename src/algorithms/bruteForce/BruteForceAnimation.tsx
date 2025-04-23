import React, { useState, useEffect } from 'react';
import BruteForceVisualizer from './BruteForceVisualizer';
import { Typography, Card, Row, Col } from 'antd';
import algorithm from './bruteForce';

const { Title, Text } = Typography;

interface Props {
  heights: number[];
}

const BruteForceAnimation: React.FC<Props> = ({ heights }) => {
  const [speed, setSpeed] = useState<number>(1000);
  const [resultWater, setResultWater] = useState<number>(0);

  useEffect(() => {
    const water = algorithm(heights);
    if (typeof water === 'number') {
      setResultWater(water);
    }
  }, [heights]);

  const handleSpeedChange = (value: number | null) => {
    if (value !== null) {
      setSpeed(value);
    }
  };

  return (
    <Card 
      title={<Title level={5} style={{ margin: 0, padding: 0 }}>暴力法求解接雨水问题</Title>}
      bordered={false} 
      style={{ marginBottom: 8, padding: '8px 12px' }}
      bodyStyle={{ padding: '8px' }}
    >
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Card 
            type="inner" 
            title={null} 
            style={{ padding: 0 }}
            bodyStyle={{ padding: 0 }}
          >
            <BruteForceVisualizer
              heights={heights}
              speed={speed}
              onSpeedChange={handleSpeedChange}
            />
            <div style={{ marginTop: 4, textAlign: 'center', fontSize: '12px' }}>
              <Text strong>
                解答: 总接水量为 {resultWater} 个单位
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default BruteForceAnimation; 