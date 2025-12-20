import React, { useState } from 'react';
import './WeChatFloat.css';

const WeChatFloat: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="wechat-float"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="wechat-float-button">
        <span className="wechat-icon">💬</span>
        <span className="wechat-text">交流群</span>
      </div>
      
      {isHovered && (
        <div className="wechat-popup">
          <div className="wechat-popup-content">
            <img 
              src={`${process.env.PUBLIC_URL}/wechat-qrcode.png`}
              alt="微信二维码"
              className="wechat-qrcode"
            />
            <p className="wechat-tip">微信扫码发送 "leetcode"<br/>加入算法交流群</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeChatFloat;
