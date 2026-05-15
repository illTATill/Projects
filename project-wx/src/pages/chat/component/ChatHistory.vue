<template>
  <view class="modal-backdrop"></view>
  <view class="personal-center">
    <view class="user-info">
      <image v-if="pinia.userInfo?.avatar" :src="pinia.userInfo?.avatar" mode="aspectFill"></image>
      <text>{{ pinia.userInfo?.phoneNumber }}</text>
    </view>
    <text class="new-dialogue" @click="createSession">开启新对话</text>
    <text class="history">对话历史</text>
    <!-- 消息列表 -->
    <scroll-view scroll-y type="list" class="scroll-height" enhanced enable-passive>
      <view
        class="history-list"
        v-for="(item, index) in pinia.chatListData"
        :key="index"
        @click="handleSessionClick(index, item.sessionId)"
        :class="{ sessionStyle: index === pinia.sessionIndex }"
      >
        <text class="text-show">{{ item.content }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
// 胶囊按钮坐标
import { buttonPosition } from "@/api/component-api.ts";
const { but_button } = buttonPosition();
import { projectStore } from "@/store/index";
import { ref } from "vue";
const pinia = projectStore();
import { SingleChatDataApi } from "@/api/request";
// 用户点击每个会话
const handleSessionClick = async (index: number, sessionId: string) => {
  pinia.sessionIndex = index;
  // 存储会话id
  pinia.sessionId = sessionId;
  // 请求当前会话数据
  const res = await SingleChatDataApi({ sessionId });
  console.log(res);
  pinia.messageList = res.data;
  pinia.switchChat = false;
  pinia.chatWelcome = false;
};
// 开启新会话
const createSession = () => {
  pinia.chatWelcome = true;
  pinia.sessionIndex = -1;
  pinia.sessionId = "null";
  pinia.messageList = [];
  pinia.switchChat = false;
};
</script>

<style scoped>
/* 遮罩层 */
.modal-backdrop {
  position: fixed;
  left: 0;
  top: v-bind("but_button");
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 99;
}
.personal-center {
  background-color: #f8f8f8;
  position: fixed;
  left: -80%;
  top: v-bind("but_button");
  bottom: 0;
  width: 80%;
  animation: slideInFromLeft 0.5s forwards;
  z-index: 99;
}
@keyframes slideInFromLeft {
  from {
    left: -80%;
  }
  to {
    left: 0;
  }
}
.user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
}
.user-info image {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
}
.user-info text {
  font-size: 35rpx;
  font-weight: bold;
  padding-top: 10rpx;
}
/* 开启新对话 */
.new-dialogue {
  margin: 45rpx 20rpx;
}
/* 对话历史 */
.history {
  margin: 30rpx 20rpx;
  border-bottom: 1rpx solid rgba(218, 218, 218, 0.6);
  padding-bottom: 20rpx;
}
/* 消息列表 */
.scroll-height {
  height: 800rpx;
}
.history-list {
  background-color: #ffffff;
  border-radius: 20rpx;
  margin: 20rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.history-list text:nth-child(1) {
  flex: 1;
  -webkit-line-clamp: 1;
}
/* .history-list text:nth-child(2) {
  color: #9d9eab;
  font-size: 26rpx;
  padding-left: 20rpx;
} */
/* 点击之后每个会话样式 */
.sessionStyle {
  background-color: #5a66fc;
  color: #ffffff;
}
</style>
