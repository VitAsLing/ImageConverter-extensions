interface CreateProperties {
  id: string;
  title: string;
  contexts: chrome.contextMenus.ContextType[];
  parentId?: string;
}

interface OnClickData {
  menuItemId: string | Number;
  srcUrl?: string;
}

interface Tab {
  id?: number;
}

// 在顶层作用域中定义全局变量
let globalImageFormat = "jpg"; // 默认值
let globalCompressionRatio = 100; // 默认值

// 在启动时读取存储的设置
chrome.storage.sync.get(["imageFormat", "compressionRatio"], (result) => {
  if (result.imageFormat) {
    globalImageFormat = result.imageFormat;
  }
  if (result.compressionRatio) {
    globalCompressionRatio = result.compressionRatio;
  }

  console.log(`初始图片格式: ${globalImageFormat}`);
  console.log(`初始压缩比例: ${globalCompressionRatio}`);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    if (changes.imageFormat) {
      globalImageFormat = changes.imageFormat.newValue;
      console.log(`新的图片格式: ${globalImageFormat}`);
    }
    if (changes.compressionRatio) {
      globalCompressionRatio = changes.compressionRatio.newValue;
      console.log(`新的压缩比例: ${globalCompressionRatio}`);
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  const createProps: CreateProperties[] = [
    {
      id: "imageConverter",
      title: chrome.i18n.getMessage("menuTitle"),
      contexts: ["image"],
    },
    {
      id: "download",
      parentId: "imageConverter",
      title: chrome.i18n.getMessage("download"),
      contexts: ["image"],
    },
    {
      id: "downloadAsCompresse",
      parentId: "imageConverter",
      title: chrome.i18n.getMessage("downloadCompresse"),
      contexts: ["image"],
    },
  ];

  createProps.forEach((prop) => chrome.contextMenus.create(prop));
});

chrome.contextMenus.onClicked.addListener((info: OnClickData, tab?: Tab) => {
  if (info.menuItemId === "download" && info.srcUrl) {
    chrome.scripting.executeScript({
      target: { tabId: tab?.id! },
      func: downloadImage,
      args: [info.srcUrl, globalImageFormat],
    });
  } else if (info.menuItemId === "downloadAsCompresse" && info.srcUrl) {
    chrome.scripting.executeScript({
      target: { tabId: tab?.id! },
      func: downloadAndCompressImage,
      args: [info.srcUrl, globalImageFormat, globalCompressionRatio],
    });
  }
});

const downloadImage = (imageUrl: string, format: string = "jpg") => {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .then((imageBitmap) => {
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(imageBitmap, 0, 0);

        let mimeType = "iamge/jpg";
        if (format === "png") {
          mimeType = "image/png";
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const filename = Math.floor(new Date().getTime() / 1000);
            a.href = downloadUrl;
            a.download = `${filename}.${format}`;
            a.click();
            URL.revokeObjectURL(downloadUrl);
          }
        }, mimeType);
      } else {
        console.error("无法获取 Canvas 2D 上下文");
      }
    });
};

const downloadAndCompressImage = (
  imageUrl: string,
  format: string = "jpg",
  compressionRatio: number = 100
) => {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .then((imageBitmap) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("无法获取 Canvas 2D 上下文");
      }

      // 计算按比例压缩后的尺寸
      const width = (imageBitmap.width * compressionRatio) / 100;
      const height = (imageBitmap.height * compressionRatio) / 100;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(imageBitmap, 0, 0, width, height);

      let mimeType = "iamge/jpg";
      if (format === "png") {
        mimeType = "image/png";
      }

      canvas.toBlob(function (blob) {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const filename = Math.floor(new Date().getTime() / 1000);
          a.href = downloadUrl;
          a.download = `${filename}.${format}`;
          a.click();
          document.body.appendChild(a);
          a.remove();
          URL.revokeObjectURL(downloadUrl);
        }
      }, mimeType);
    })
    .catch((error) =>
      console.error("Error in compressing and downloading image:", error)
    );
};
