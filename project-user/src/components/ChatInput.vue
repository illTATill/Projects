<template>
  <!-- 底部输入框 -->
  <div class="chat-input">
    <div class="chat-input-flex">
      <div class="function-select" v-if="uploadFileItem.length <= 0 && uploadImageItem.length <= 0">
        <!-- 查询知识库的按钮 -->
        <el-button class="query-kb-button" @click="queryKb" v-if="uploadFileItem.length <= 0">
          <div class="query-kb">
            <img src="../assets/zhishiku.png" alt="" />
            <span>知识库问答</span>
          </div>
        </el-button>
        <!-- 图片上传 -->
        <el-button class="query-kb-button check-report-button">
          <input type="file" multiple :accept="uploadImageType" style="display: none" @change="handleImageChange" ref="imageInputRef" />
          <el-tooltip content="上传不超过一张10MB的JPG/PNG/JPEG/WEBP的图片" effect="customized" placement="top">
            <div class="query-kb" @click="triggerImageInput">
              <img src="../assets/baogaodan.png" alt="" />
              <span>上传报告单/药品/CT</span>
            </div>
          </el-tooltip>
        </el-button>
      </div>
      <!-- 文件上传的列表 -->
      <div class="upload-file-list" v-if="uploadFileItem.length > 0">
        <div class="upload-file-item" v-for="(item, index) in uploadFileItem" :key="index">
          <img :src="item.fileType == 'PDF' ? pdfIcon : docxIcon" alt="" />
          <div>
            <span class="hidden-text">{{ item.fileName }}</span>
            <span>{{ item.fileSize }}</span>
          </div>
          <el-icon :size="11" class="delete-file" @click="deleteFile(item.docId, index)"><CloseBold /></el-icon>
        </div>
      </div>
      <!-- 上传的图片展示 -->
      <div class="upload-file-list" v-if="uploadImageItem.length > 0">
        <div class="upload-image-item" v-for="(item, index) in uploadImageItem" :key="index">
          <img :src="item.imageUrl" alt="" />
          <el-icon :size="11" class="delete-image" @click="deleteImage(item.imagePath)"><CloseBold /></el-icon>
        </div>
      </div>
      <!-- 输入框 -->
      <div class="chat-input-content">
        <input
          type="file"
          multiple
          :accept="uploadFileType"
          style="display: none"
          @change="handleFileChange"
          ref="fileInputRef"
          :disabled="uploadImageItem.length > 0"
        />
        <el-tooltip
          :content="uploadImageItem.length > 0 ? '已存在图片,请先删除图片才可以上传文档' : '每次最多上传3个文件(每个5MB),仅支持PDF,DOCX文件类型'"
          effect="customized"
          placement="top"
        >
          <div class="upload-icon">
            <img src="../assets//upload-icon.png" alt="" @click="triggerFileInput" />
          </div>
        </el-tooltip>
        <el-input
          v-model="userMessage"
          type="textarea"
          placeholder="任何健康问题都可以问我,Shift + Enter可换行"
          :autosize="{ minRows: 1, maxRows: 4 }"
          resize="none"
          @keydown="handleKeyDown"
        />
        <el-button v-if="!project.disabledStatus">
          <img src="../assets//send-icon.png" alt="" class="send-icon" @click="sendMessage" />
        </el-button>
        <el-button v-if="project.disabledStatus">
          <img src="../assets/stop-icon.png" alt="" class="send-icon" @click="stopOutput" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 逻辑层
import { CloseBold } from "@element-plus/icons-vue";
import { reactive, ref } from "vue";
// 文件上传的类型
const uploadFileType = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
// 图片上传的类型
const uploadImageType = "image/jpg,image/jpeg,image/png,image/webp";

// 输入的内容
const userMessage = ref("");
//#region
// 键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // 阻止换行
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};
const queryKbStyle = reactive({
  border: "#eceff3",
  backgroundColor: "#ffffff",
  color: "#d783af",
});
const isKnowledgeBased = ref(false);
// 点击知识库按钮
const queryKb = () => {
  isKnowledgeBased.value = !isKnowledgeBased.value;
  if (isKnowledgeBased.value) {
    // 选中
    queryKbStyle.backgroundColor = "#597CEE";
    queryKbStyle.border = "#597CEE";
    queryKbStyle.color = "#ffffff";
  } else {
    queryKbStyle.backgroundColor = "#ffffff";
    queryKbStyle.border = "#eceff3";
    queryKbStyle.color = "#d783af";
  }
};
//#endregion
// 文件上传
import { UploadDialogApi, DeleteFileApi, SendMessageApi, StopOutputApi, UploadImageApi, DeleteIamgeApi } from "@/api/request";
import { useFileUploader, useImageUploader } from "@/api/useFileUploader";
const { uploadFileItem, fileInputRef, triggerFileInput, handleFileChange } = useFileUploader({ page: "chatinput", uploadApi: UploadDialogApi });
import { validators } from "@/utils/validators";
// 图片上传的逻辑
const { uploadImageItem, imageInputRef, triggerImageInput, handleImageChange } = useImageUploader({ uploadApi: UploadImageApi });
// 引入图标
import docxIcon from "@/assets/docx-icon.png";
import pdfIcon from "@/assets/pdf-icon.png";
import { projectStore } from "@/store/index";
const project = projectStore();
// 删除文件
const deleteFile = async (docId: string, index: number) => {
  // loading加载提示
  const loading = ElLoading.service({
    lock: true,
    text: "删除中...",
    background: "rgba(0, 0, 0, 0.8)",
  });
  try {
    await DeleteFileApi({ docId });
    loading.close();
    uploadFileItem.value.splice(index, 1);
  } catch (error) {
    loading.close();
  }
};
// 删除图片
const deleteImage = async (imagePath: string) => {
  // loading加载提示
  const loading = ElLoading.service({
    lock: true,
    text: "删除中...",
    background: "rgba(0, 0, 0, 0.8)",
  });
  try {
    await DeleteIamgeApi({ imagePath });
    loading.close();
    uploadImageItem.value = [];
  } catch (error) {
    loading.close();
  }
};
// 发送消息
const sendMessage = () => {
  // 校验
  validators.isNotEmpty(userMessage.value, "请输入内容");
  project.messageList.push(
    {
      role: "user",
      content: userMessage.value.trim(),
      ...(uploadFileItem.value.length > 0 && { uploadFileList: uploadFileItem.value }),
      ...(uploadFileItem.value.length > 0 && { displayContent: userMessage.value.trim() }),
      ...(uploadImageItem.value.length > 0 && { uploadImageList: uploadImageItem.value[0] }),
    },
    {
      role: "assistant",
      content: "",
      loadingCircle: true,
    }
  );
  project.disabledStatus = true;
  project.chatWelcome = false;
  // 如果是新建对话，需要把问题加入对话列表的第一项里
  if (project.sessionId == "null") {
    project.chatListData.unshift({ sessionId: project.sessionId, content: userMessage.value.trim() });
    project.getSessIonIndex(0);
  }
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth", // 可选：平滑滚动
  });
  SendMessageApi({
    content: userMessage.value.trim(),
    sessionId: project.sessionId,
    uploadFileList: uploadFileItem.value,
    isKnowledgeBased: isKnowledgeBased.value,
    uploadImageList: uploadImageItem.value[0],
  });
  // 清空输入框和临时文件和图片
  userMessage.value = "";
  uploadFileItem.value = [];
  uploadImageItem.value = [];
};
// 终止模型输出
const stopOutput = () => {
  StopOutputApi({ sessionId: project.sessionId });
};
</script>

<style scoped>
/* 样式层 */
.chat-input {
  background-color: #f6f7fb;
  position: fixed;
  left: 230px;
  bottom: 0;
  right: 0;
  padding-bottom: 30px;
}
.chat-input-flex {
  display: flex;
  flex-direction: column;
  max-width: 968px;
  margin: 0 auto;
  background-color: #ffffff;
  border: 1px solid #615ced;
  padding: 15px;
  border-radius: 20px;
  box-shadow: 0 1px 11px 7px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
/* 功能选择按钮 */
.function-select {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.query-kb-button {
  width: fit-content;
  padding: initial;
  height: auto;
  border: 1px solid v-bind("queryKbStyle.border");
  border-radius: 20px;
  background-color: v-bind("queryKbStyle.backgroundColor");
  /* margin-bottom: 10px; */
}
/* 检查报告 */
.check-report-button {
  border: 1px solid #eceff3;
  background-color: #ffffff;
}
.query-kb {
  display: flex;
  align-items: center;
  padding: 7px;
}
.query-kb span {
  font-size: 14px;
  padding-left: 6px;
  color: v-bind("queryKbStyle.color");
}
/* 检查报告 */
.check-report-span {
  color: #d783af !important;
}
.query-kb img {
  width: 15px;
  height: 15px;
}
.upload-file-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 15px;
}
.upload-file-item img {
  width: 30px;
  height: 30px;
  margin-right: 5px;
}
.upload-file-item {
  display: inline-flex;
  align-items: center;
  border: 1px solid #cecfdd;
  border-radius: 10px;
  max-width: 200px;
  padding: 5px;
  margin-right: 10px;
  position: relative;
}
.delete-file {
  position: absolute;
  bottom: 2px;
  right: 4px;
}
.upload-file-item span:nth-child(1) {
  font-size: 14px;
}
.upload-file-item span:nth-child(2) {
  font-size: 10px;
  color: #cecfdd;
}
.chat-input-content {
  display: flex;
  align-items: flex-end;
}
.upload-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.upload-icon img {
  width: 20px;
  height: 20px;
}
/* 强制更改input样式 */
.chat-input-content >>> .el-textarea__inner:focus {
  box-shadow: none;
  border: none;
}
.chat-input-content >>> .el-textarea__inner {
  box-shadow: none;
  background: none;
  font-size: 16px;
}
.send-icon {
  width: 34px;
  height: auto;
}
.chat-input-content >>> .el-button {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  margin-left: 10px;
  background: none;
  border: none;
}
/* 上传图片的样式 */
.check-report-button {
  border: 1px solid #eceff3;
  background-color: #ffffff;
}
.upload-image-item {
  width: 50px;
  height: 50px;
  position: relative;
  border: 1px solid #dcdcdc;
  border-radius: 10px;
  overflow: hidden;
  padding: 3px;
}
.upload-image-item img {
  width: 50px;
  height: 50px;
  object-fit: cover;
}
.delete-image {
  position: absolute;
  right: 3px;
  top: 3px;
}
</style>
