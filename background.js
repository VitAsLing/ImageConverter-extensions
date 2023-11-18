chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "imageConverter",
    title: chrome.i18n.getMessage("menuTitle"),
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "downloadAsPng",
    parentId: "imageConverter",
    title: chrome.i18n.getMessage("downloadPng"),
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "downloadAsCompressedPng",
    parentId: "imageConverter",
    title: chrome.i18n.getMessage("downloadCompressedPng"),
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "downloadAsPng" && info.srcUrl) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: downloadImageAsPng,
      args: [info.srcUrl],
    });
  } else if ((info.menuItemId = "downloadAsCompressedPng" && info.srcUrl)) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: downloadAndCompressImageAsPng,
      args: [info.srcUrl],
    });
  }
});

function downloadImageAsPng(imageUrl) {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .then((imageBitmap) => {
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageBitmap, 0, 0);

      canvas.toBlob(function (blob) {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "image.png";
        a.click();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    });
}

function downloadAndCompressImageAsPng(imageUrl) {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .then((imageBitmap) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 设置新的大小，这里可以根据需要调整压缩比例
      const maxWidth = 300; // 最大宽度
      const maxHeight = 300; // 最大高度
      let width = imageBitmap.width;
      let height = imageBitmap.height;

      // 计算压缩后的尺寸
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height *= maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width *= maxHeight / height));
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(imageBitmap, 0, 0, width, height);

      canvas.toBlob(function (blob) {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "compressed_image.png";
        a.click();
        document.body.appendChild(a);
        a.remove();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    })
    .catch((error) =>
      console.error("Error in compressing and downloading image:", error)
    );
}
