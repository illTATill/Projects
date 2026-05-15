<template>
  <view class="chat-message" v-for="(item, index) in pinia.messageList" :key="index">
    <!-- 用户消息 -->
    <template v-if="item.role == 'user'">
      <view class="user-message">
        <text>{{ item.displayContent || item.content }}</text>
      </view>
      <view class="file-view" v-if="item.uploadFileList && item.uploadFileList.length > 0">
        <view class="file-item" v-for="(itema, indexa) in item.uploadFileList" :key="indexa">
          <view class="file-icon"><image :src="itema.fileType == 'PDF' ? '/static/pdf-icon.png' : '/static/docx-icon.png'"></image></view>
          <view class="file-name">
            <text class="text-show">{{ itema.fileName }}</text>
            <text>{{ itema.fileSize }}</text>
          </view>
        </view>
      </view>
    </template>
    <!-- 模型消息 -->
    <view class="ai-message" v-if="item.role == 'assistant'">
      <view class="file-reading" @click="toggle(index)" v-if="item.readFileData" :key="item.readFileData.statusInfo">
        <view class="file-class">
          <text>{{ item.readFileData.promptInfo }}</text>
          <image src="/static/zhankai.png"></image>
        </view>
        <view class="file-list" v-show="item.isOpen">
          <text v-for="(itemb, indexb) in item.readFileData.fileList" :key="indexb">{{ indexb + 1 + "." }}{{ itemb }}</text>
        </view>
      </view>
      <towxml :nodes="appContext.$towxml(item.content, 'markdown')"></towxml>
      <!-- loading -->
      <view class="loading-circle" v-if="item.loadingCircle"></view>
    </view>
  </view>
  <!-- 高度 -->
  <view style="height: 300rpx"></view>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance } from "vue";
import { projectStore } from "@/store/index";
const pinia = projectStore();
// const isOpen = ref(-1);
// 展开收起文件
const toggle = (index: number) => {
  pinia.messageList[index].isOpen = !pinia.messageList[index].isOpen;
};
// markdown渲染
const instance = getCurrentInstance();
const appContext = ref<any>(null);
appContext.value = instance?.appContext.config.globalProperties as any;
</script>

<style scoped>
.chat-message {
  display: flex;
  flex-direction: column;
  margin: 0 15rpx;
}
.user-message {
  margin-top: 30rpx;
  max-width: 70%;
  align-self: flex-end;
}
.user-message text {
  line-height: 1.5;
  background-color: #3a71e8;
  border-radius: 10rpx;
  color: #ffffff;
  padding: 10rpx;
  font-size: 30rpx;
}
.file-view {
  display: flex;
  align-items: center;
  align-self: flex-end;
  flex-flow: wrap;
  margin-top: 15rpx;
  justify-content: flex-end;
}
.file-item {
  display: inline-flex;
  border: 1rpx solid #f3f3f3;
  padding: 5rpx;
  border-radius: 10rpx;
  /* 子元素在末端对其 */
  align-self: flex-end;
  background-color: #ffffff;
  max-width: 270rpx;
  margin-left: 5rpx;
  margin-bottom: 5rpx;
}
.file-item image {
  width: 50rpx;
  height: 50rpx;
}
.file-icon {
  display: flex;
  align-self: center;
}
.file-name {
  display: flex;
  flex-direction: column;
  padding-left: 10rpx;
}
.file-name text:nth-child(1) {
  font-size: 25rpx;
  -webkit-line-clamp: 1;
}
.file-name text:nth-child(2) {
  font-size: 20rpx;
  color: #8d8ea5;
}
.ai-message {
  margin-top: 30rpx;
  background-color: #ffffff;
  padding: 10rpx;
  border-radius: 10rpx;
}
/* 展开收起 */
.file-reading {
  margin-bottom: 10rpx;
  border-top: 1rpx solid #e5e5e5;
  border-bottom: 1rpx solid #e5e5e5;
  padding: 20rpx 0;
}
.file-class {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.file-class text {
  color: #00f;
  font-weight: bold;
  font-size: 30rpx;
}
.file-class image {
  width: 25rpx;
  height: 25rpx;
}
.file-list {
  background: #f3f3f3;
  border-radius: 8rpx;
  margin-top: 10rpx;
  font-size: 28rpx;
  padding: 0 10rpx 10rpx 10rpx;
}
.file-list text {
  padding-top: 10rpx;
}

.loading-circle {
  width: 12px;
  height: 12px;
  background-color: #3a71e8;
  border-radius: 50%;
  margin: 5px 0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.7;
  }
}
</style>
