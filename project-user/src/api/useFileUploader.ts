// -------------------------文件上传：对话框，知识库
import { ref } from "vue";
import type { KbFileListType, ImageUploadType } from "@/types/index";
import { projectStore } from "@/store/index";
// import { ElLoading } from "element-plus";
const pinia = projectStore();
import { showValidateMessage } from "@/utils/validateMessage";
// 文件上传
interface UseFileUploaderOptions {
  page: "knowledge" | "chatinput";
  uploadApi: (formData: FormData) => Promise<{ data: string[] }>;
}
export function useFileUploader(options: UseFileUploaderOptions) {
  // 临时存储上传的文件
  const uploadFileItem = ref<KbFileListType>([]);
  // 调用input上传
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const triggerFileInput = () => {
    fileInputRef.value?.click();
  };
  // 本地上传文件触发
  const handleFileChange = async (env: Event) => {
    const input = env.target as HTMLInputElement;
    // 复制一份文件数组快照
    const files = Array.from(input.files || []);
    console.log(files);
    // 清空input.value，防止下次选同一文件不触发change事件
    input.value = "";
    if (files.length <= 0) return false;
    // 如果没有登陆，禁止上传
    if (!pinia.userInfo) {
      showValidateMessage("请登录再上传", "warning");
      return false;
    }
    // 每次最多选择三个文件
    if (files.length > 3) {
      showValidateMessage("每次最多选择三个文件", "warning");
      return false;
    }
    console.log(options.page);

    // 如果是对话框上传文件，最多只能上传三个
    if (options.page === "chatinput") {
      if (uploadFileItem.value.length >= 3) {
        showValidateMessage("最多上传三个文件", "warning");
        return false;
      }
    }
    // loading加载提示
    const loading = ElLoading.service({
      lock: true,
      text: "解析中...",
      background: "rgba(0, 0, 0, 0.8)",
    });
    const formData = new FormData();
    // 过滤掉文件不是pdf和docx，并且大于5mb的
    const allowedTypes = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"];
    const maxSize = 5 * 1024 * 1024;
    for (const file of files) {
      if (allowedTypes.includes(file.type) && file.size <= maxSize) {
        formData.append("file", file);
      }
    }
    // 记录一个现有数量
    const existingCount = uploadFileItem.value.length;
    // 视图层展示
    const formDataFiles = formData.getAll("file") as File[];
    console.log(formDataFiles);
    formDataFiles.forEach((file) => {
      uploadFileItem.value.push({
        fileName: file.name,
        fileType: file.type == "application/pdf" ? "PDF" : "DOCX",
        fileSize: (file.size / 1024).toFixed(2) + "kb",
        docId: "",
      });
    });
    if (formDataFiles.length <= 0) {
      loading.close();
      return false;
    }
    // 上传服务器
    try {
      const res = await options.uploadApi(formData);
      console.log(res);
      res.data.forEach((item, index) => {
        const targetIndex = existingCount + index;
        uploadFileItem.value[targetIndex].docId = item;
      });
      loading.close();
    } catch (error) {
      loading.close();
      showValidateMessage("上传出错", "error");
      uploadFileItem.value = uploadFileItem.value.filter((item) => item.docId !== "");
    }
  };
  return {
    uploadFileItem,
    fileInputRef,
    triggerFileInput,
    handleFileChange,
  };
}

// 图片上传
interface UseImageUploaderOptions {
  uploadApi: (formData: FormData) => Promise<{ data: ImageUploadType }>;
}
export function useImageUploader(options: UseImageUploaderOptions) {
  // 临时存储上传的文件
  const uploadImageItem = ref<ImageUploadType[]>([]);
  // 调用input上传
  const imageInputRef = ref<HTMLInputElement | null>(null);
  const triggerImageInput = () => {
    imageInputRef.value?.click();
  };
  // 本地上传文件触发
  const handleImageChange = async (env: Event) => {
    const input = env.target as HTMLInputElement;
    // 复制一份文件数组快照
    const files = Array.from(input.files || []);
    console.log(files);
    // 清空input.value，防止下次选同一文件不触发change事件
    input.value = "";
    if (files.length <= 0) return false;
    // 如果没有登陆，禁止上传
    if (!pinia.userInfo) {
      showValidateMessage("请登录再上传", "warning");
      return false;
    }
    // 每次最多选择三个文件
    if (files.length > 1) {
      showValidateMessage("每次最多选择一张图片", "warning");
      return false;
    }
    const formData = new FormData();
    // 校验
    const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showValidateMessage("情选择正确的图片", "warning");
        return false;
      }
      if (file.size >= maxSize) {
        showValidateMessage("图片大小应该小于10MB", "warning");
        return false;
      }
      formData.append("file", file);
    }
    // loading加载提示
    const loading = ElLoading.service({
      lock: true,
      text: "解析中...",
      background: "rgba(0, 0, 0, 0.8)",
    });
    // 上传服务器
    try {
      const res = await options.uploadApi(formData);
      console.log(res);
      uploadImageItem.value = [res.data];
      loading.close();
    } catch (error) {
      loading.close();
      showValidateMessage("上传出错", "error");
    }
  };
  return {
    uploadImageItem,
    imageInputRef,
    triggerImageInput,
    handleImageChange,
  };
}
