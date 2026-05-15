<template>
  <!-- 知识库弹窗 -->
  <el-drawer v-model="project.knowledgePopup" title="个人知识库管理" append-to-body size="600">
    <div class="file-data-list">
      <div v-for="(item, index) in uploadFileItem" :key="index">
        <img :src="item.fileType == 'PDF' ? pdfIcon : docxIcon" alt="" />
        <span class="hidden-text">{{ item.fileName }}</span>
        <el-icon class="delete-file" @click="deleteFileKb(item.docId, index)"><CloseBold /></el-icon>
      </div>
    </div>
    <div style="height: 70px"></div>
    <div class="file-upload">
      <input type="file" multiple :accept="uploadFileType" style="display: none" ref="fileInputRef" @change="handleFileChange" />
      <el-tooltip content="每次最多上传3个文件(每个5MB),仅支持PDF,DOCX文件类型" effect="customized" placement="top">
        <el-button type="primary" @click="triggerFileInput">上传文件</el-button>
      </el-tooltip>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
// 逻辑层
import { projectStore } from "@/store/index";
const project = projectStore();
import { CloseBold } from "@element-plus/icons-vue";
// 文件上传的类型
const uploadFileType = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
// 文件上传
import { UploadkbApi, DeleteFileKbApi, KbFileListApi } from "@/api/request";
import { useFileUploader } from "@/api/useFileUploader";
const { uploadFileItem, fileInputRef, triggerFileInput, handleFileChange } = useFileUploader({ page: "knowledge", uploadApi: UploadkbApi });
// 引入图标
import docxIcon from "@/assets/docx-icon.png";
import pdfIcon from "@/assets/pdf-icon.png";
import { watch } from "vue";
// 删除知识库文件
const deleteFileKb = async (docId: string, index: number) => {
  // loading加载提示
  const loading = ElLoading.service({
    lock: true,
    text: "删除中...",
    background: "rgba(0, 0, 0, 0.8)",
  });
  try {
    await DeleteFileKbApi({ docId });
    loading.close();
    uploadFileItem.value.splice(index, 1);
  } catch (error) {
    loading.close();
  }
};
// 请求知识库文件
let count = 0;
watch(
  () => project.knowledgePopup,
  async (newVal) => {
    console.log(newVal);
    if (newVal) {
      count += 1;
      if (count === 1) {
        const res = await KbFileListApi();
        console.log(res);
        uploadFileItem.value = res.data;
      }
    }
  }
);
</script>

<style scoped>
/* 样式层 */
.file-data-list {
  /* 网格布局 */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
}
.file-data-list img {
  width: 70px;
  height: 70px;
}
.file-data-list div {
  border: 1px solid #888;
  padding: 7px;
  border-radius: 10px;
  position: relative;
}
.delete-file {
  position: absolute;
  right: 4px;
  top: 4px;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}
.file-data-list div:hover .delete-file {
  opacity: 1;
}
.file-upload {
  background-color: #ffffff;
  position: fixed;
  bottom: 0;
  right: 0;
  width: 600px;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
