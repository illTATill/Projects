<template>
  <!-- 顶部导航切换 -->
  <view class="menu-view">
    <view class="button-top"></view>
    <view class="menu-style">
      <text v-for="(item, index) in menu" :key="index" @click="selectNav(item.type)">{{ item.value }}</text>
    </view>
  </view>
  <view class="ment-view-height"></view>
  <!-- 对话历史 -->
  <ChatHistory v-show="pinia.switchChat"></ChatHistory>
  <!-- 对话界面 -->
  <ChatWindow v-if="!pinia.chatWelcome"></ChatWindow>
  <!-- 底部输入框 -->
  <ChatInput></ChatInput>
  <!-- 欢迎页面 -->
  <ChatWelcome v-if="pinia.chatWelcome"></ChatWelcome>
</template>

<script setup lang="ts">
import { ref, watch, getCurrentInstance } from "vue";
import { onLoad } from "@dcloudio/uni-app";
// 胶囊按钮坐标
import { buttonPosition } from "@/api/component-api.ts";
const { but_height, but_top, but_button } = buttonPosition();
import { projectStore } from "@/store/index";
const pinia = projectStore();
// 对话历史
import ChatHistory from "./component/ChatHistory.vue";
// 对话界面
import ChatWindow from "./component/ChatWindow.vue";
// 底部输入框
import ChatInput from "./component/ChatInput.vue";
// 启动欢迎页面
import ChatWelcome from "./component/ChatWelcome.vue";
import { GetChatListApi } from "@/api/request";
const menu = ref([
  { type: "AA", value: "对话历史" },
  { type: "BB", value: "对话" },
]);
// 切换对话和对话历史
const selectNav = (type: string) => {
  // 模型回复中禁止触发
  if (pinia.disabledStatus) return false;
  pinia.switchChat = type == "AA" ? true : false;
};
// 初次进入该页面，获取对话列表
onLoad(async () => {
  const chatListData = await GetChatListApi();
  console.log(chatListData);

  pinia.chatListData = chatListData.data;
});
</script>

<style>
page {
  background-color: #f3f3f3;
}
.menu-view {
  height: v-bind("but_button");
  background: linear-gradient(#ceeffd, #ebf5f9);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}
.button-top {
  height: v-bind("but_top");
}
.menu-style {
  display: flex;
  align-items: center;
  height: v-bind("but_height");
  padding-left: 20rpx;
}
.menu-style text {
  color: #9d9486;
  font-weight: bold;
}
.menu-style text:nth-child(2) {
  padding: 0 60rpx;
}
.ment-view-height {
  height: v-bind("but_button");
}
</style>
