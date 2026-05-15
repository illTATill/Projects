<template>
  <view class="file-list" v-for="(item, index) in pinia.kbUploadFileItem" :key="index">
    <image mode="widthFix" :src="item.fileType === 'DOCX' ? '/static/docx-icon.png' : '/static/pdf.icon.png'"></image>
    <view class="file-title">
      <text>{{ item.fileName }}</text>
      <text>{{ item.fileSize }}</text>
    </view>
  </view>
  <!-- 上传 -->
  <view class="upload-file" @click="uploadFile">
    <text>上传文件</text>
  </view>
  <view style="height: 120rpx"></view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { KbFileListApi, UploadkbApi } from "@/api/request";
import { projectStore } from "@/store/index";
const pinia = projectStore();
import { useFileUploader } from "@/api/useFileUploader";
// 获取知识库文件
onLoad(async () => {
  const res = await KbFileListApi();
  console.log(res);
  pinia.kbUploadFileItem = res.data;
});
// 上传文件
const uploadFile = async () => {
  await useFileUploader({ page: "knowledge", uploadApi: UploadkbApi });
};
</script>

<style scoped>
.file-list {
  display: flex;
  align-items: center;
  margin: 0 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #e5e5e5;
}
.file-list image {
  width: 100rpx;
}
.file-title {
  padding-left: 10rpx;
}
.file-title text:nth-child(2) {
  font-size: 27rpx;
  color: #666;
}
.upload-file {
  background-color: #ffffff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 7rpx 20rpx 20rpx 20rpx;
}
.upload-file text {
  background-color: #5a66fc;
  font-size: 30rpx;
  text-align: center;
  border-radius: 10rpx;
  color: #ffffff;
  height: 80rpx;
  line-height: 80rpx;
}
</style>
