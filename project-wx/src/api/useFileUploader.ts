// -------------------------文件上传：对话框，知识库
import { projectStore } from "@/store/index";
const pinia = projectStore();

interface UseFileUploaderOptions {
  page: "knowledge" | "chatinput";
  uploadApi: string;
}
// 文件选择
function chooseFiles(): Promise<UniApp.ChooseMessageFileSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    uni.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["pdf", "docx"],
      success: resolve,
      fail: reject,
    });
  });
}
export const useFileUploader = async (options: UseFileUploaderOptions) => {
  // 如果没有登陆，禁止上传
  if (!pinia.userInfo) {
    uni.navigateTo({ url: "/pages/userlogin/userlogin" });
    return false;
  }
  // 选择文件
  const selectRes = await chooseFiles();
  // 如果为空
  if (selectRes.tempFiles.length <= 0) {
    return;
  }
  // 判断类型
  const allowedExtensions = ["pdf", "docx"];
  const invalidFiles = selectRes.tempFiles.filter((file) => {
    // 过滤出不是pdf和docx的文件
    const ext = file.name.split(".").pop()?.toLowerCase();
    return !allowedExtensions.includes(ext || "");
  });
  if (invalidFiles.length > 0) {
    uni.showToast({ title: "仅支持上传 PDF 或 DOCX 文件", icon: "none" });
    return;
  }
  // 判断大小
  const maxSize = 5 * 1024 * 1024;
  selectRes.tempFiles.filter((file) => {
    if (file.size > maxSize) {
      uni.showToast({ title: "请选择小于5mb的文件", icon: "none" });
      return;
    }
  });
  // 如果是对话框上传文件，最多只能上传三个
  if (options.page === "chatinput") {
    if (pinia.uploadFileItem.length >= 3) {
      uni.showToast({ title: "最多上传三个文件", icon: "none" });
      return;
    }
  }
  // console.log(selectRes.tempFiles);
  uni.showLoading({ title: "上传中" });
  // 上传服务器
  uni.uploadFile({
    url: options.uploadApi,
    filePath: selectRes.tempFiles[0].path,
    name: "file",
    formData: { wxoriginalname: selectRes.tempFiles[0].name },
    header: { Authorization: "Bearer " + pinia.userInfo?.token || "" },
    success: (data) => {
      // console.log(data);
      if (data.statusCode == 200) {
        const docId = JSON.parse(data.data).data[0] as string;
        // 上传成功，添加临时数据
        const fileObj = selectRes.tempFiles[0];
        // 判断是对话框还是知识库文件
        if (options.page == "chatinput") {
          pinia.uploadFileItem.push({
            fileName: fileObj.name,
            fileType: fileObj.name.split(".").pop()?.toLowerCase() == "pdf" ? "PDF" : "DOCX",
            fileSize: (fileObj.size / 1024).toFixed(2) + "kb",
            docId: docId,
          });
        } else {
          pinia.kbUploadFileItem.unshift({
            fileName: fileObj.name,
            fileType: fileObj.name.split(".").pop()?.toLowerCase() == "pdf" ? "PDF" : "DOCX",
            fileSize: (fileObj.size / 1024).toFixed(2) + "kb",
            docId: docId,
          });
        }
        console.log(pinia.uploadFileItem);
      } else if (data.statusCode == 401) {
        uni.navigateTo({ url: "/pages/userlogin/userlogin" });
      } else {
        uni.showToast({ title: "上传失败", icon: "none" });
      }
      uni.hideLoading();
    },
    fail: (error) => {
      uni.showToast({ title: "上传失败", icon: "none" });
      uni.hideLoading();
    },
  });
  // return { uploadFileItem };
};
