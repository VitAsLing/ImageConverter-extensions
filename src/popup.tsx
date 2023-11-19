import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

const Popup = () => {
  const [imageFormat, setImageFormat] = useState("jpg");
  const [compressionRatio, setCompressionRatio] = useState(100);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 当组件加载时，获取存储的设置
    chrome.storage.sync.get(["imageFormat", "compressionRatio"], (result) => {
      if (result.imageFormat) {
        setImageFormat(result.imageFormat);
      }
      if (result.compressionRatio) {
        setCompressionRatio(result.compressionRatio);
      }
    });
  }, []); // 空依赖数组表示此 effect 仅在组件挂载时运行一次

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setImageFormat(event.target.value);
  };

  const handleCompressionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCompressionRatio(Number(event.target.value));
  };

  const handleSave = () => {
    setMessage("");

    chrome.storage.sync.set(
      {
        imageFormat: imageFormat,
        compressionRatio: compressionRatio,
      },
      () => {
        if (chrome.runtime.lastError) {
          // 处理错误情况
          setMessage(`保存失败: ${chrome.runtime.lastError.message}`);
        } else {
          // 处理成功情况
          setMessage("设置已成功保存");
        }
        setTimeout(() => {
          setMessage("");
        }, 1000);
        console.log(
          `Saving settings: Format - ${imageFormat}, Compression Ratio - ${compressionRatio}%`
        );
      }
    );
  };

  return (
    <div>
      <div>
        <label htmlFor="format-select">转换后的图片格式：</label>
        <select
          id="format-select"
          value={imageFormat}
          onChange={handleFormatChange}
        >
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
        </select>
      </div>
      <div>
        <label htmlFor="compression-range">图片压缩比例：</label>
        <input
          type="range"
          id="compression-range"
          min="0"
          max="100"
          value={compressionRatio}
          onChange={handleCompressionChange}
        />
        <span>{compressionRatio}%</span>
      </div>
      <div className="center-container">
        {" "}
        <button className="center-container" onClick={handleSave}>
          保存
        </button>
      </div>
      {message && <div className="message">{message}</div>}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
